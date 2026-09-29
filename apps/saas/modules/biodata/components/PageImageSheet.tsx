"use client";

import { Button, invocationText, sealInitials } from "@repo/ui";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import type { PageView } from "@shared/lib/api-types";
import { firstNameOf } from "@shared/lib/format";
import { DownloadIcon, ShareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePageText } from "../lib/fields";
import { type PageImageContent, renderPageImage } from "../lib/page-image";

type Status =
	| { kind: "preparing" }
	| { kind: "ready"; blob: Blob; url: string }
	| { kind: "failed" };

/** Everything the image says, in the reader's words, built from the redacted page view. */
function usePageImageContent(page: PageView): PageImageContent {
	// The helpers are stable callbacks; the object holding them is not, so depend on each.
	const { label, value, headerMeta, signer, verification, ref } = usePageText();
	const t = useTranslations("page");
	const tExport = useTranslations("biodata.export");

	return useMemo(() => {
		const invocation = page.invocation
			? page.invocation.kind === "cross" || page.invocation.kind === "khanda"
				? { kind: page.invocation.kind }
				: (() => {
						const entry = invocationText(
							page.invocation.kind === "none" ? "custom" : page.invocation.kind,
							page.invocation.text,
						);
						return entry
							? { kind: "text" as const, text: entry.text, dir: entry.dir }
							: null;
					})()
			: null;
		const rows = (fields: PageView["sections"][number]["fields"]) =>
			fields.map((field) => ({
				label: label(field.key),
				value: value(field.key, field.value),
			}));

		return {
			dir: page.dir,
			lang: page.language,
			invocation,
			name: page.header.displayName,
			meta: headerMeta(page.header),
			signer: signer(page.header),
			verified: verification(page.header.verification),
			photoLine: page.photos.length > 0 ? t("photo.veiledAlt") : t("photo.none"),
			sections: page.sections
				.filter((section) => section.fields.length > 0 || Boolean(section.text?.trim()))
				.map((section) => ({
					title: t(`sections.${section.id}`),
					rows: rows(section.fields),
					text: section.text?.trim() || null,
				})),
			sealed: {
				title: t("sections.sealed"),
				initials: sealInitials(page.header.displayName) || "·",
				closedLine: page.sealed.open ? null : t("sealed.closed"),
				rows: page.sealed.open ? rows(page.sealed.fields) : [],
				emptyLine: t("sealed.empty"),
			},
			ref: ref(page),
			watermark: tExport("watermark", { ref: page.ref }),
		};
	}, [page, label, value, headerMeta, signer, verification, ref, t, tExport]);
}

function canShareFiles(file: File) {
	return (
		typeof navigator !== "undefined" &&
		typeof navigator.canShare === "function" &&
		navigator.canShare({ files: [file] })
	);
}

/**
 * The WhatsApp image (design.md §5.7): your page, as the chosen reader sees it, set as a PNG
 * with its reference number and a "not for forwarding" line. It is prepared first, then shared
 * from a second tap, so the phone's share sheet always opens (it needs a fresh tap).
 */
export function PageImageSheet({
	open,
	onOpenChange,
	page,
	audienceNote,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	page: PageView;
	/** Which reader the image is for ("as a stranger reads it"). */
	audienceNote: string;
}) {
	const t = useTranslations("biodata.image");
	const content = usePageImageContent(page);
	const [status, setStatus] = useState<Status>({ kind: "preparing" });
	const [shareFailed, setShareFailed] = useState(false);
	const attempt = useRef(0);
	const contentRef = useRef(content);
	useEffect(() => {
		contentRef.current = content;
	}, [content]);
	const fileName = `rishta-${page.ref.toLowerCase()}.png`;

	const prepare = useCallback(() => {
		const current = ++attempt.current;
		setShareFailed(false);
		setStatus({ kind: "preparing" });
		renderPageImage(contentRef.current).then(
			(blob) => {
				if (attempt.current === current) {
					setStatus({ kind: "ready", blob, url: URL.createObjectURL(blob) });
				}
			},
			() => {
				if (attempt.current === current) {
					setStatus({ kind: "failed" });
				}
			},
		);
	}, []);

	// Prepared once each time the sheet opens (and again if the page itself changes meanwhile).
	useEffect(() => {
		if (open) {
			prepare();
		}
		return () => {
			attempt.current += 1;
		};
	}, [open, page, prepare]);

	// Object URLs are released as soon as a newer image, or none, replaces them.
	useEffect(() => {
		if (status.kind !== "ready") {
			return undefined;
		}
		const { url } = status;
		return () => URL.revokeObjectURL(url);
	}, [status]);

	const file = useMemo(
		() =>
			status.kind === "ready"
				? new File([status.blob], fileName, { type: "image/png" })
				: null,
		[status, fileName],
	);
	const shareable = useMemo(() => (file ? canShareFiles(file) : false), [file]);

	const share = async () => {
		if (!file) {
			return;
		}
		setShareFailed(false);
		try {
			await navigator.share({ files: [file], title: t("shareTitle", { ref: page.ref }) });
		} catch (error) {
			// Closing the share sheet is not a failure.
			if (!(error instanceof DOMException && error.name === "AbortError")) {
				setShareFailed(true);
			}
		}
	};

	const download = () => {
		if (status.kind !== "ready") {
			return;
		}
		const link = document.createElement("a");
		link.href = status.url;
		link.download = fileName;
		document.body.append(link);
		link.click();
		link.remove();
	};

	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t("title")}
			description={audienceNote}
		>
			<div className="gap-4 flex flex-col">
				<div
					className="min-h-48 flex max-h-[52dvh] items-start justify-center overflow-y-auto border border-border bg-background"
					aria-busy={status.kind === "preparing"}
				>
					{status.kind === "ready" ? (
						<img
							src={status.url}
							alt={t("alt", { name: firstNameOf(page.header.displayName) })}
							className="w-full"
							draggable={false}
						/>
					) : status.kind === "failed" ? (
						<p
							role="alert"
							className="p-6 self-center text-center font-display text-letter"
						>
							{t("failed")}
						</p>
					) : (
						<p role="status" className="p-6 self-center text-center pencil text-body">
							{t("preparing")}
						</p>
					)}
				</div>

				{status.kind === "failed" ? (
					<div>
						<Button variant="secondary" onClick={prepare}>
							{t("tryAgain")}
						</Button>
					</div>
				) : (
					<>
						<p className="text-meta text-muted-foreground">{t("note")}</p>
						<div className="gap-3 flex flex-wrap">
							{shareable && (
								<Button
									variant="secondary"
									onClick={() => void share()}
									disabled={status.kind !== "ready"}
								>
									<ShareIcon className="size-4" />
									{t("share")}
								</Button>
							)}
							<Button
								variant={shareable ? "outline" : "secondary"}
								onClick={download}
								disabled={status.kind !== "ready"}
							>
								<DownloadIcon className="size-4" />
								{t("download")}
							</Button>
						</div>
						{shareFailed && (
							<p role="alert" className="text-meta text-destructive">
								{t("shareFailed")}
							</p>
						)}
					</>
				)}
			</div>
		</ResponsiveSheet>
	);
}
