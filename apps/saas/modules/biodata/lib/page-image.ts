import { INVOCATION_PATHS } from "@repo/ui";

/**
 * The WhatsApp image of a page (design.md §5.7, "Export"): the same document families forward,
 * set on a canvas with the fonts the page already loaded. It is always Paper (like the family
 * link), carries the reference number and a line asking people not to forward it, and never
 * draws a photograph: the photo box says the photo opens when both say yes.
 *
 * Layout is computed in logical coordinates (distance from the page's start edge) and resolved
 * at draw time, so an Urdu page mirrors exactly as it does on screen.
 */

export interface PageImageRow {
	label: string;
	value: string;
}

export interface PageImageContent {
	dir: "ltr" | "rtl";
	lang: string;
	invocation: { kind: "text"; text: string; dir?: "rtl" } | { kind: "cross" | "khanda" } | null;
	name: string;
	meta: string;
	signer: string;
	verified: string | null;
	photoLine: string;
	sections: Array<{ title: string; rows: PageImageRow[]; text: string | null }>;
	sealed: {
		title: string;
		/** The monogram's initials, already reduced ("AM"). */
		initials: string;
		/** The closed line ("Photos, full name, workplace and contact open…"), or null when open. */
		closedLine: string | null;
		rows: PageImageRow[];
		emptyLine: string;
	};
	ref: string;
	watermark: string;
}

/**
 * Paper, always: the canvas cannot follow Lamp, and a forwarded page must read the same on
 * every phone. These mirror the Paper tokens in tooling/tailwind/theme.css (design.md §7).
 */
const PAPER = {
	desk: "#f5efe3",
	page: "#fffbf3",
	ink: "#1f1b16",
	muted: "#5e554a",
	border: "#cdbfa6",
	rule: "#c98a17",
	sealed: "#efe6d6",
	veil: "#d9cdb7",
	pencil: "#5e554a",
} as const;

/** 1080px wide, the size WhatsApp keeps sharp; the 620px page scales by the same ratio. */
const WIDTH = 1080;
const DESK = 28;
const PAGE_WIDTH = WIDTH - DESK * 2;
const S = PAGE_WIDTH / 620;
const PAD = Math.round(48 * S);
const CONTENT = PAGE_WIDTH - PAD * 2;

const px = (value: number) => Math.round(value * S);

const RTL_STRONG = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/u;
const LTR_STRONG = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0900-\u0DFF]/u;

/** The direction of a run from its first strong character, as dir="auto" decides it. */
function directionOf(text: string, fallback: "ltr" | "rtl"): "ltr" | "rtl" {
	for (const character of text) {
		if (RTL_STRONG.test(character)) {
			return "rtl";
		}
		if (LTR_STRONG.test(character)) {
			return "ltr";
		}
	}
	return fallback;
}

interface Fonts {
	display: string;
	sans: string;
}

type Op =
	| {
			type: "text";
			text: string;
			/** Logical start offset from the page's content start edge. */
			x: number;
			y: number;
			font: string;
			color: string;
			align?: "start" | "center";
			condensed?: boolean;
			tracking?: number;
			dir?: "ltr" | "rtl";
	  }
	| {
			type: "rule";
			x: number;
			y: number;
			width: number;
			color: string;
			lineWidth?: number;
	  }
	| {
			type: "rect";
			x: number;
			y: number;
			width: number;
			height: number;
			fill?: string;
			stroke?: string;
			dashed?: boolean;
	  }
	| { type: "seal"; x: number; y: number; size: number; initials: string; font: string }
	| { type: "stamp"; x: number; y: number; size: number }
	| { type: "glyph"; kind: "cross" | "khanda"; centerY: number; height: number };

function readFonts(): Fonts {
	const style = getComputedStyle(document.documentElement);
	const display = style.getPropertyValue("--font-display").trim();
	const sans = style.getPropertyValue("--font-sans").trim();
	return {
		display: display || '"Tiro Devanagari Hindi", Georgia, serif',
		sans: sans || '"Anek Latin", system-ui, sans-serif',
	};
}

function font(
	family: string,
	sizePx: number,
	{ weight = 400, italic = false }: { weight?: number; italic?: boolean } = {},
) {
	return `${italic ? "italic " : ""}${weight} ${sizePx}px ${family}`;
}

function supports(ctx: CanvasRenderingContext2D, property: "fontStretch" | "letterSpacing") {
	return property in ctx;
}

function applyText(
	ctx: CanvasRenderingContext2D,
	op: Extract<Op, { type: "text" }>,
	pageDir: "ltr" | "rtl",
) {
	ctx.font = op.font;
	ctx.fillStyle = op.color;
	ctx.direction = op.dir ?? directionOf(op.text, pageDir);
	if (supports(ctx, "fontStretch")) {
		ctx.fontStretch = op.condensed ? "condensed" : "normal";
	}
	if (supports(ctx, "letterSpacing")) {
		ctx.letterSpacing = op.tracking ? `${op.tracking}px` : "0px";
	}
}

/** Breaks text into lines that fit `maxWidth`, keeping explicit line breaks. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
	const lines: string[] = [];
	for (const paragraph of text.split(/\n/)) {
		const words = paragraph.split(/\s+/).filter(Boolean);
		if (words.length === 0) {
			lines.push("");
			continue;
		}
		let line = "";
		for (const word of words) {
			const candidate = line ? `${line} ${word}` : word;
			if (ctx.measureText(candidate).width <= maxWidth) {
				line = candidate;
				continue;
			}
			if (line) {
				lines.push(line);
			}
			// A single word longer than the line (a long email or place name) breaks by character.
			if (ctx.measureText(word).width > maxWidth) {
				let chunk = "";
				for (const character of Array.from(word)) {
					if (ctx.measureText(chunk + character).width > maxWidth && chunk) {
						lines.push(chunk);
						chunk = character;
					} else {
						chunk += character;
					}
				}
				line = chunk;
			} else {
				line = word;
			}
		}
		lines.push(line);
	}
	return lines;
}

/**
 * Lays the page out as draw operations and returns them with the page's total height. A first
 * pass measures on a scratch canvas; the real canvas is then sized to fit.
 */
function layout(content: PageImageContent, fonts: Fonts) {
	const scratch = document.createElement("canvas").getContext("2d");
	if (!scratch) {
		throw new Error("Canvas is not available");
	}
	const ctx = scratch;
	ctx.direction = content.dir;
	const ops: Op[] = [];

	// Nastaliq needs room above and below the line (design.md §8: Urdu line-height 2.0).
	const leading = content.lang === "ur" ? 1.35 : 1;
	const line = (value: number) => Math.round(px(value) * leading);
	const type = {
		name: { font: font(fonts.display, px(34)), line: line(40) },
		meta: { font: font(fonts.sans, px(17), { weight: 420 }), line: line(26) },
		small: { font: font(fonts.sans, px(14), { weight: 420 }), line: line(20) },
		section: { font: font(fonts.display, px(20)), line: line(26) },
		label: { font: font(fonts.sans, px(12), { weight: 600 }), line: line(16) },
		value: { font: font(fonts.sans, px(17), { weight: 420 }), line: line(26) },
		pencil: { font: font(fonts.display, px(15), { italic: true }), line: line(22) },
		ref: { font: font(fonts.sans, px(13), { weight: 420 }), line: px(18) },
		invocation: { font: font(fonts.display, px(20)), line: line(30) },
	};
	const tracking = px(12) * 0.08;

	const measureWith = (spec: { font: string }, condensed = false) => {
		ctx.font = spec.font;
		if (supports(ctx, "fontStretch")) {
			ctx.fontStretch = condensed ? "condensed" : "normal";
		}
		if (supports(ctx, "letterSpacing")) {
			ctx.letterSpacing = condensed ? `${tracking}px` : "0px";
		}
	};

	/** Adds wrapped text and returns the y below it. Baselines sit ~78% down each line box. */
	const paragraph = (
		text: string,
		spec: { font: string; line: number },
		x: number,
		y: number,
		maxWidth: number,
		options: {
			color?: string;
			condensed?: boolean;
			align?: "start" | "center";
			dir?: "ltr" | "rtl";
		} = {},
	) => {
		measureWith(spec, options.condensed);
		const lines = wrap(ctx, text, maxWidth);
		lines.forEach((line, index) => {
			ops.push({
				type: "text",
				text: line,
				x: options.align === "center" ? x + maxWidth / 2 : x,
				y: y + index * spec.line + spec.line * 0.78,
				font: spec.font,
				color: options.color ?? PAPER.ink,
				align: options.align,
				condensed: options.condensed,
				tracking: options.condensed ? tracking : undefined,
				dir: options.dir,
			});
		});
		return y + lines.length * spec.line;
	};

	const upper = (value: string) => value.toLocaleUpperCase(content.lang || undefined);

	/** A label and its value, the label in a 34% column (design.md §5.1). */
	const gap = px(16);
	const row = (entry: PageImageRow, y: number, x0 = 0, width = CONTENT) => {
		const labelColumn = Math.max(px(108), Math.round(width * 0.34));
		const top = y + px(6);
		const labelBottom = paragraph(
			upper(entry.label),
			type.label,
			x0,
			top + px(5),
			labelColumn,
			{ color: PAPER.muted, condensed: true },
		);
		const valueBottom = paragraph(
			entry.value,
			type.value,
			x0 + labelColumn + gap,
			top,
			width - labelColumn - gap,
		);
		return Math.max(labelBottom, valueBottom) + px(6);
	};

	/** A section head in Tiro, then a hairline that fills the line. */
	const sectionHead = (title: string, y: number) => {
		measureWith(type.section);
		const titleWidth = Math.min(ctx.measureText(title).width, CONTENT);
		const bottom = paragraph(title, type.section, 0, y, CONTENT);
		const ruleStart = titleWidth + px(12);
		if (ruleStart < CONTENT) {
			ops.push({
				type: "rule",
				x: ruleStart,
				y: y + type.section.line * 0.62,
				width: CONTENT - ruleStart,
				color: PAPER.border,
			});
		}
		return bottom;
	};

	// The double marigold rule sits at the very top of the page (drawn in `draw`).
	let y = px(4) + px(16);

	if (content.invocation) {
		y += px(4);
		if (content.invocation.kind === "text") {
			y = paragraph(content.invocation.text, type.invocation, 0, y, CONTENT, {
				align: "center",
				dir: content.invocation.dir,
			});
		} else {
			const height = px(30);
			ops.push({
				type: "glyph",
				kind: content.invocation.kind,
				centerY: y + height / 2,
				height,
			});
			y += height;
		}
		y += px(20);
	} else {
		y += px(4);
	}

	// The name block beside the 30% photo box.
	const photoWidth = Math.round(CONTENT * 0.3);
	const photoHeight = Math.round((photoWidth * 5) / 4);
	const headGap = px(24);
	const textWidth = CONTENT - photoWidth - headGap;
	const headTop = y;
	let textY = paragraph(content.name, type.name, 0, headTop, textWidth);
	if (content.meta) {
		textY = paragraph(content.meta, type.meta, 0, textY + px(4), textWidth);
	}
	textY = paragraph(content.signer, type.small, 0, textY + px(4), textWidth, {
		color: PAPER.muted,
	});
	if (content.verified) {
		const stamp = px(14);
		const lineTop = textY + px(5);
		// Centred on the words' first line, whatever the script's leading.
		ops.push({
			type: "stamp",
			x: 0,
			y: lineTop + type.small.line * 0.78 - stamp * 0.9,
			size: stamp,
		});
		textY = paragraph(content.verified, type.small, stamp + px(8), lineTop, textWidth, {
			color: PAPER.muted,
		});
	}
	const photoX = CONTENT - photoWidth;
	ops.push({
		type: "rect",
		x: photoX,
		y: headTop,
		width: photoWidth,
		height: photoHeight,
		fill: PAPER.veil,
		stroke: PAPER.border,
	});
	measureWith(type.pencil);
	const photoLines = wrap(ctx, content.photoLine, photoWidth - px(20)).length;
	paragraph(
		content.photoLine,
		type.pencil,
		photoX + px(10),
		headTop + photoHeight / 2 - (photoLines * type.pencil.line) / 2,
		photoWidth - px(20),
		{ color: PAPER.pencil, align: "center" },
	);
	y = Math.max(textY, headTop + photoHeight);

	for (const section of content.sections) {
		y += px(32);
		y = sectionHead(section.title, y);
		y += px(8);
		for (const entry of section.rows) {
			y = row(entry, y);
		}
		if (section.text) {
			y = paragraph(
				section.text,
				type.value,
				0,
				y + (section.rows.length ? px(12) : 0),
				CONTENT,
			);
		}
	}

	// The sealed lower third: dashed, on --sealed, with the pending seal while it is closed.
	y += px(32);
	y = sectionHead(content.sealed.title, y);
	y += px(12);
	const boxTop = y;
	const inset = px(20);
	// The box is drawn first and sized once its contents are laid out.
	const box: Extract<Op, { type: "rect" }> = {
		type: "rect",
		x: 0,
		y: boxTop,
		width: CONTENT,
		height: 0,
		fill: PAPER.sealed,
		stroke: PAPER.border,
		dashed: true,
	};
	ops.push(box);
	let inner = boxTop + inset;
	const innerWidth = CONTENT - inset * 2;
	if (content.sealed.closedLine) {
		const seal = px(40);
		ops.push({
			type: "seal",
			x: inset,
			y: inner,
			size: seal,
			initials: content.sealed.initials,
			font: font(fonts.display, Math.round(seal * 0.34)),
		});
		const lineWidth = innerWidth - seal - px(16);
		measureWith(type.value);
		const lines = wrap(ctx, content.sealed.closedLine, lineWidth).length;
		const textTop = inner + Math.max(0, (seal - lines * type.value.line) / 2);
		const bottom = paragraph(
			content.sealed.closedLine,
			type.value,
			inset + seal + px(16),
			textTop,
			lineWidth,
			{ color: PAPER.muted },
		);
		inner = Math.max(inner + seal, bottom);
	} else if (content.sealed.rows.length > 0) {
		for (const entry of content.sealed.rows) {
			inner = row(entry, inner, inset, innerWidth);
		}
	} else {
		inner = paragraph(content.sealed.emptyLine, type.pencil, inset, inner, innerWidth, {
			color: PAPER.pencil,
		});
	}
	box.height = inner - boxTop + inset;
	y = boxTop + box.height;

	y += px(24);
	y = paragraph(content.ref, type.ref, 0, y, CONTENT, { color: PAPER.muted });
	y = paragraph(content.watermark, type.ref, 0, y + px(4), CONTENT, { color: PAPER.muted });
	y += px(32);

	return { ops, height: Math.ceil(y) };
}

function drawSeal(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	size: number,
	initials: string,
	fontSpec: string,
) {
	const r = (size / 2) * (29 / 32);
	ctx.save();
	ctx.strokeStyle = PAPER.ink;
	ctx.lineWidth = Math.max(1, size / 64);
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.stroke();
	ctx.strokeStyle = PAPER.muted;
	ctx.setLineDash([size * 0.04, size * 0.047]);
	ctx.beginPath();
	ctx.arc(cx, cy, r * (24.5 / 29), 0, Math.PI * 2);
	ctx.stroke();
	ctx.setLineDash([]);
	ctx.fillStyle = PAPER.muted;
	ctx.font = fontSpec;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.direction = directionOf(initials, "ltr");
	ctx.fillText(initials, cx, cy + size * 0.03);
	ctx.restore();
}

function draw(content: PageImageContent, fonts: Fonts) {
	const { ops, height: pageHeight } = layout(content, fonts);
	const canvas = document.createElement("canvas");
	canvas.width = WIDTH;
	canvas.height = pageHeight + DESK * 2;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Canvas is not available");
	}
	const rtl = content.dir === "rtl";
	const originX = DESK + PAD;
	const originY = DESK;

	/** Logical start offset (and width) to a physical x on the canvas. */
	const physical = (x: number, width = 0) => (rtl ? originX + CONTENT - x - width : originX + x);

	// The desk, the page and its 1px edge, then the double marigold rule (1px, 2px gap, 1px).
	ctx.fillStyle = PAPER.desk;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = PAPER.page;
	ctx.fillRect(DESK, DESK, PAGE_WIDTH, pageHeight);
	ctx.strokeStyle = PAPER.border;
	ctx.lineWidth = 1;
	ctx.strokeRect(DESK + 0.5, DESK + 0.5, PAGE_WIDTH - 1, pageHeight - 1);
	const ruleWidth = Math.max(1, Math.round(S));
	ctx.fillStyle = PAPER.rule;
	ctx.fillRect(DESK, DESK, PAGE_WIDTH, ruleWidth);
	ctx.fillRect(DESK, DESK + ruleWidth * 3, PAGE_WIDTH, ruleWidth);

	for (const op of ops) {
		switch (op.type) {
			case "text": {
				applyText(ctx, op, content.dir);
				const x =
					op.align === "center"
						? rtl
							? originX + CONTENT - op.x
							: originX + op.x
						: physical(op.x);
				// Runs keep their own direction; alignment follows the page's start edge.
				ctx.textAlign = op.align === "center" ? "center" : rtl ? "right" : "left";
				ctx.textBaseline = "alphabetic";
				ctx.fillText(op.text, x, originY + op.y);
				break;
			}
			case "rule": {
				ctx.fillStyle = op.color;
				ctx.fillRect(
					physical(op.x, op.width),
					originY + Math.round(op.y),
					op.width,
					op.lineWidth ?? 1,
				);
				break;
			}
			case "rect": {
				const x = physical(op.x, op.width);
				if (op.fill) {
					ctx.fillStyle = op.fill;
					ctx.fillRect(x, originY + op.y, op.width, op.height);
				}
				if (op.stroke) {
					ctx.save();
					ctx.strokeStyle = op.stroke;
					ctx.lineWidth = 1;
					if (op.dashed) {
						ctx.setLineDash([px(4), px(3)]);
					}
					ctx.strokeRect(x + 0.5, originY + op.y + 0.5, op.width - 1, op.height - 1);
					ctx.restore();
				}
				break;
			}
			case "seal": {
				const x = physical(op.x, op.size);
				drawSeal(
					ctx,
					x + op.size / 2,
					originY + op.y + op.size / 2,
					op.size,
					op.initials,
					op.font,
				);
				break;
			}
			case "stamp": {
				// The verified stamp: a small square with a tick, always beside its words.
				const x = physical(op.x, op.size);
				const top = originY + op.y;
				ctx.save();
				ctx.strokeStyle = PAPER.muted;
				ctx.lineWidth = Math.max(1, op.size / 12);
				ctx.strokeRect(x + 0.5, top + 0.5, op.size - 1, op.size - 1);
				ctx.beginPath();
				ctx.moveTo(x + op.size * 0.24, top + op.size * 0.52);
				ctx.lineTo(x + op.size * 0.43, top + op.size * 0.7);
				ctx.lineTo(x + op.size * 0.76, top + op.size * 0.3);
				ctx.stroke();
				ctx.restore();
				break;
			}
			case "glyph": {
				const glyph = INVOCATION_PATHS[op.kind];
				const [width, height] = glyph.viewBox;
				const scale = op.height / height;
				ctx.save();
				ctx.translate(
					originX + CONTENT / 2 - (width * scale) / 2,
					originY + op.centerY - op.height / 2,
				);
				ctx.scale(scale, scale);
				ctx.strokeStyle = PAPER.ink;
				ctx.lineWidth = glyph.strokeWidth;
				ctx.lineCap = "round";
				for (const d of glyph.paths) {
					ctx.stroke(new Path2D(d));
				}
				for (const [cx, cy, r] of glyph.circles) {
					ctx.beginPath();
					ctx.arc(cx, cy, r, 0, Math.PI * 2);
					ctx.stroke();
				}
				ctx.restore();
				break;
			}
		}
	}

	return canvas;
}

/** Waits for the faces the page image will use, for exactly the characters it will draw. */
async function loadFonts(content: PageImageContent, fonts: Fonts) {
	if (!("fonts" in document)) {
		return;
	}
	const sample = (values: Array<string | null | undefined>) =>
		values.filter(Boolean).join(" ").slice(0, 4000) || "Rishta";
	const displayText = sample([
		content.name,
		content.invocation?.kind === "text" ? content.invocation.text : null,
		content.sealed.initials,
		content.sealed.title,
		...content.sections.map((section) => section.title),
	]);
	const sansText = sample([
		content.meta,
		content.signer,
		content.verified,
		content.ref,
		content.watermark,
		content.sealed.closedLine,
		...content.sections.flatMap((section) => [
			section.text,
			...section.rows.flatMap((entry) => [entry.label, entry.value]),
		]),
		...content.sealed.rows.flatMap((entry) => [entry.label, entry.value]),
	]);
	await Promise.all([
		document.fonts.load(font(fonts.display, 40), displayText),
		document.fonts.load(font(fonts.display, 40, { italic: true }), content.photoLine),
		document.fonts.load(font(fonts.sans, 20, { weight: 420 }), sansText),
		document.fonts.load(font(fonts.sans, 20, { weight: 600 }), sansText),
	]);
}

/** Renders the page as a PNG. Throws if the browser cannot draw or encode it. */
export async function renderPageImage(content: PageImageContent): Promise<Blob> {
	const fonts = readFonts();
	try {
		await loadFonts(content, fonts);
	} catch {
		// A face that will not load is drawn with its fallback rather than failing the export.
	}
	const canvas = draw(content, fonts);
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
			} else {
				reject(new Error("The page image could not be encoded"));
			}
		}, "image/png");
	});
}
