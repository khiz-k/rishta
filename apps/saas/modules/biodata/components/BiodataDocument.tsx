import { cn } from "@repo/ui/lib";
import type { PageView } from "@shared/lib/api-types";
import { firstNameOf } from "@shared/lib/format";
import type { ReactNode } from "react";

import type { PageText } from "../lib/page-text";
import {
	FieldRow,
	InvocationLine,
	type PageScale,
	PageSection,
	SealedSection,
	VeiledPhoto,
	VerifiedMark,
} from "./PagePrimitives";

export interface BiodataDocumentProps {
	page: PageView;
	seenBefore?: boolean;
	scale?: PageScale;
	/** Replaces the pending seal in the Sealed section (your pressed seal, "You wrote today"). */
	sealedLead?: ReactNode;
	/** A quiet line above the name ("Kept by Ammi"). */
	overline?: ReactNode;
	/** Photos open with a 400ms unblur (the introduction, right after both seals break). */
	unveil?: boolean;
	/** Hide the sealed contents behind an opaque veil that lifts (the introduction's opening). */
	sealedVeil?: boolean;
	/** A diagonal watermark over the page (the family link). */
	watermark?: ReactNode;
	/** Stack edges for the pages that remain in the folio (0-3). */
	stackEdges?: number;
	className?: string;
	headingId?: string;
}

/** The most edges a page ever shows; phones reserve this much room so the edges stay on screen. */
const MAX_STACK_EDGES = 3;

/** Flat offset edges, no blur: one `--stack-offset` edge per remaining page, up to three (design.md §9). */
export function stackEdgeShadow(edges: number) {
	const count = Math.max(0, Math.min(MAX_STACK_EDGES, edges));
	return Array.from({ length: count }, (_, index) => {
		const offset = `calc(var(--stack-offset) * ${index + 1})`;
		return `${offset} ${offset} 0 -1px var(--card), ${offset} ${offset} 0 0 var(--border)`;
	}).join(", ");
}

/**
 * One candidate's biodata, rendered as the document families already know (design.md §5.1): the
 * double marigold rule, the invocation, the name block with the photo box, then Personal,
 * Education & work, Family, Lifestyle, About, Looking for and the Sealed lower third, in that
 * order. What a reader sees is exactly what the redaction layer sent: nothing more.
 *
 * Pure (no hooks, no "use client"): the words come in as `text`, so the family link renders the
 * whole page on the server in Ammi's language (design.md §5.9), and `BiodataPage` renders the
 * same document on the client in the reader's locale.
 */
export function BiodataDocument({
	page,
	seenBefore,
	scale = "normal",
	sealedLead,
	overline,
	unveil,
	sealedVeil,
	watermark,
	stackEdges = 0,
	className,
	headingId,
	text,
}: BiodataDocumentProps & { text: PageText }) {
	const { t } = text;
	const name = page.header.displayName;
	const firstName = firstNameOf(name);
	const meta = text.headerMeta(page.header);
	const verified = text.verification(page.header.verification);
	const titleId = headingId ?? `page-${page.handle}-name`;
	const family = scale === "family";

	const extraPhotos = page.photos.slice(1).filter((photo) => !photo.veiled && photo.url);
	const photoStrings = {
		veiledAlt: t("photo.veiledAlt"),
		alt: t("photo.alt", { name: firstName }),
		none: t("photo.none"),
		veiled: t("photo.veiled"),
	};

	return (
		<article
			lang={page.language}
			dir={page.dir}
			aria-labelledby={titleId}
			data-print-page
			className={cn(
				"relative mx-auto w-full max-w-(--page-width) border border-border bg-card text-card-foreground",
				className,
			)}
			style={stackEdges > 0 ? { boxShadow: stackEdgeShadow(stackEdges) } : undefined}
		>
			<div aria-hidden="true" className="double-rule" />
			{watermark}
			<div className={cn("pb-8 page-pad", family ? "pt-6" : "pt-4")}>
				<InvocationLine invocation={page.invocation} />

				<header
					className={cn(
						"gap-4 md:gap-6 grid grid-cols-[1fr_30%]",
						page.invocation ? "mt-6" : "mt-5",
					)}
				>
					<div className="min-w-0">
						{seenBefore && (
							<p className="mb-2 label-caps text-muted-foreground">
								{t("seenBefore")}
							</p>
						)}
						{overline && <div className="mb-2">{overline}</div>}
						<h1
							id={titleId}
							className={cn(
								"font-display tracking-[-0.005em] break-words text-foreground",
								family ? "text-family-name" : "text-name-sm min-[400px]:text-title",
							)}
						>
							{name}
						</h1>
						{meta && (
							<p
								className={cn(
									"mt-1 text-foreground tabular",
									family ? "text-family-value" : "text-body",
								)}
							>
								{meta}
							</p>
						)}
						<p
							className={cn(
								"mt-1 text-muted-foreground",
								family ? "text-family-value" : "text-meta",
							)}
						>
							{text.signer(page.header)}
						</p>
						{verified && (
							<div className="mt-1.5">
								<VerifiedMark label={verified} />
							</div>
						)}
					</div>
					<VeiledPhoto photo={page.photos[0]} strings={photoStrings} unveil={unveil} />
				</header>

				{page.sections.map((section) => {
					const hasFields = section.fields.length > 0;
					const hasText = Boolean(section.text?.trim());
					if (!hasFields && !hasText) {
						return null;
					}
					return (
						<PageSection
							key={section.id}
							id={`${page.handle}-${section.id}`}
							title={t(`sections.${section.id}`)}
							scale={scale}
						>
							{hasFields && (
								<dl>
									{section.fields.map((field) => (
										<FieldRow
											key={field.key}
											label={text.label(field.key)}
											scale={scale}
										>
											{text.value(field.key, field.value)}
										</FieldRow>
									))}
								</dl>
							)}
							{hasText && (
								<p
									className={cn(
										"whitespace-pre-line text-foreground",
										hasFields && "mt-3",
										family ? "text-family-value" : "text-body",
									)}
								>
									{section.text}
								</p>
							)}
						</PageSection>
					);
				})}

				<SealedSection
					sealed={page.sealed}
					title={t("sections.sealed")}
					scale={scale}
					lead={sealedLead}
					sealInitials={name}
					strings={{ aria: t("sealed.aria"), closed: t("sealed.closed") }}
				>
					{page.sealed.open && (
						<div className="relative">
							{page.sealed.fields.length > 0 ? (
								<dl>
									{page.sealed.fields.map((field) => (
										<FieldRow
											key={field.key}
											label={text.label(field.key)}
											scale={scale}
										>
											{text.value(field.key, field.value)}
										</FieldRow>
									))}
								</dl>
							) : (
								<p className="pencil text-body">{t("sealed.empty")}</p>
							)}
							{extraPhotos.length > 0 && (
								<div className="mt-4 gap-3 grid grid-cols-3">
									{extraPhotos.map((photo) => (
										<VeiledPhoto
											key={photo.id}
											photo={photo}
											strings={photoStrings}
											unveil={unveil}
										/>
									))}
								</div>
							)}
							{sealedVeil && (
								<div
									aria-hidden="true"
									className="inset-0 animate-veil-lift absolute bg-sealed"
								/>
							)}
						</div>
					)}
				</SealedSection>

				<p className="mt-6 text-ref text-muted-foreground tabular">{text.ref(page)}</p>
				<p className="mt-2 hidden text-ref text-muted-foreground print:block">
					{t("printWatermark", { ref: page.ref })}
				</p>
			</div>
		</article>
	);
}
