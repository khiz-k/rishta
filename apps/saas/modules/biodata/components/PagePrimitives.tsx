import { InvocationGlyph } from "@repo/ui/components/rishta/invocation-glyph";
import { MonogramSeal } from "@repo/ui/components/rishta/monogram-seal";
import { VerifiedMark as VerifiedStamp } from "@repo/ui/components/rishta/verified-mark";
import { cn } from "@repo/ui/lib";
import type { PagePhoto, PageView } from "@shared/lib/api-types";
import type { PropsWithChildren, ReactNode } from "react";

/*
 * No "use client" and no hooks: these render on the server for the family link (design.md
 * §5.9, where the only client islands are the reactions and the language row) and inside
 * client trees everywhere else. Words arrive as props (from `PageText`), so the family link can
 * set them in Ammi's language. Deep `@repo/ui` imports keep the barrel's client components out
 * of the family link's module graph.
 */

export type PageScale = "normal" | "family";

/** A section head in Tiro 20/26 followed by a hairline that fills the line. */
export function PageSection({
	title,
	children,
	scale = "normal",
	id,
	aside,
}: PropsWithChildren<{ title: string; scale?: PageScale; id?: string; aside?: ReactNode }>) {
	return (
		<section aria-labelledby={id} className={cn(scale === "family" ? "mt-10" : "mt-8")}>
			<h2
				id={id}
				className={cn(
					"hairline-after font-display text-foreground",
					scale === "family" ? "text-title-sm" : "text-section",
				)}
			>
				{title}
			</h2>
			{aside}
			<div className="mt-3">{children}</div>
		</section>
	);
}

/** A label (condensed caps) and its value, as a <dt>/<dd> pair. */
export function FieldRow({
	label,
	children,
	scale = "normal",
	aside,
}: PropsWithChildren<{ label: string; scale?: PageScale; aside?: ReactNode }>) {
	return (
		<div
			className={cn(
				"gap-x-4 grid",
				scale === "family"
					? "py-2 sm:grid-cols-[minmax(8rem,34%)_1fr] grid-cols-1"
					: "py-1.5 grid-cols-[minmax(6.75rem,34%)_1fr]",
			)}
		>
			<dt
				className={cn(
					"label-caps text-muted-foreground",
					scale === "family" ? "pt-1 leading-6 text-[0.95rem]" : "pt-[0.3rem]",
				)}
			>
				{label}
			</dt>
			<dd
				className={cn(
					"min-w-0 break-words text-foreground",
					scale === "family" ? "text-family-value" : "text-body",
				)}
			>
				{children}
				{aside}
			</dd>
		</div>
	);
}

/** The optional invocation at the head of a page, in its own script. */
export function InvocationLine({ invocation }: { invocation: PageView["invocation"] }) {
	if (!invocation) {
		return null;
	}
	return (
		<p className="mt-5 flex justify-center text-center">
			<InvocationGlyph
				kind={invocation.kind === "none" ? "custom" : invocation.kind}
				text={invocation.text}
			/>
		</p>
	);
}

export interface VeiledPhotoStrings {
	veiledAlt: string;
	alt: string;
	none: string;
	veiled: string;
}

interface VeiledPhotoProps {
	photo: PagePhoto | undefined;
	strings: VeiledPhotoStrings;
	unveil?: boolean;
	emptyLabel?: string;
	className?: string;
}

/**
 * The photo box: 30% of the page width, portrait 4:5, square corners, 1px border. A veiled
 * photo is the server-made 32px derivative scaled up under blur(16px) on --veil; the clear image
 * never reaches a stranger.
 */
export function VeiledPhoto({
	photo,
	unveil,
	emptyLabel,
	className,
	strings,
	children,
}: PropsWithChildren<VeiledPhotoProps>) {
	const hasImage = Boolean(photo?.url);

	return (
		<div
			className={cn(
				"relative aspect-[4/5] w-full overflow-hidden border border-border bg-veil",
				className,
			)}
		>
			{hasImage && photo ? (
				photo.veiled ? (
					// oxlint-disable-next-line jsx_a11y/img-redundant-alt -- the alt is the veil's meaning
					<img
						src={photo.url}
						alt={strings.veiledAlt}
						className="size-full scale-125 object-cover blur-[16px]"
						draggable={false}
					/>
				) : (
					<img
						src={photo.url}
						alt={strings.alt}
						className={cn("size-full object-cover", unveil && "animate-unveil")}
						draggable={false}
					/>
				)
			) : (
				<div className="p-2 flex size-full items-center justify-center text-center">
					<span className="pencil text-meta">{emptyLabel ?? strings.none}</span>
				</div>
			)}
			{hasImage && photo?.veiled && (
				// A flat paper plate, so the caps stay legible over any blurred photo (dark in Paper,
				// light in Lamp): foreground on --card, never text straight on the image.
				<span className="inset-x-0 bottom-2 absolute flex justify-center">
					<span className="px-1.5 border border-border bg-card label-caps text-foreground">
						{strings.veiled}
					</span>
				</span>
			)}
			{children}
		</div>
	);
}

export interface SealedSectionStrings {
	aria: string;
	closed: string;
}

interface SealedSectionProps {
	sealed: PageView["sealed"];
	title: string;
	strings: SealedSectionStrings;
	scale?: PageScale;
	sealInitials?: string;
	/** Replaces the pending seal (your pressed seal and "You wrote to Arjun today"). */
	lead?: ReactNode;
}

/** The sealed lower third: dashed, on --sealed, with the pending seal until both say yes. */
export function SealedSection({
	sealed,
	title,
	children,
	scale = "normal",
	lead,
	sealInitials = "",
	strings,
}: PropsWithChildren<SealedSectionProps>) {
	return (
		<section
			aria-label={sealed.open ? title : strings.aria}
			className={cn(scale === "family" ? "mt-10" : "mt-8")}
		>
			<h2
				className={cn(
					"hairline-after font-display",
					scale === "family" ? "text-title-sm" : "text-section",
				)}
			>
				{title}
			</h2>
			<div className="mt-3 p-4 md:p-5 border border-dashed border-border bg-sealed">
				{lead ??
					(sealed.open ? null : (
						<div className="gap-4 flex items-center">
							<MonogramSeal initials={sealInitials} state="pending" size={40} />
							<p
								className={cn(
									"text-muted-foreground",
									scale === "family" ? "text-family-value" : "text-body",
								)}
							>
								{strings.closed}
							</p>
						</div>
					))}
				{children}
			</div>
		</section>
	);
}

export function VerifiedMark({ label }: { label: string | null }) {
	if (!label) {
		return null;
	}
	return <VerifiedStamp className="text-muted-foreground">{label}</VerifiedStamp>;
}
