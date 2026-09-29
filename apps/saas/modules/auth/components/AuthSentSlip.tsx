import { LogoMark } from "@repo/ui";

/**
 * "Sealed and sent": the confirmation after a link is emailed. A flat slip with the pressed seal,
 * instead of a mailbox icon in a coloured alert.
 */
export function AuthSentSlip({ title, message }: { title: string; message?: string }) {
	return (
		<div role="status" className="gap-4 p-5 flex items-start border border-border bg-sealed">
			<LogoMark className="mt-0.5 size-10" />
			<div className="min-w-0">
				<p className="font-display text-section text-foreground">{title}</p>
				{message && <p className="mt-1 text-body text-foreground">{message}</p>}
			</div>
		</div>
	);
}
