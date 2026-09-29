/** A hairline with a condensed-caps word in the middle ("Or continue with"). */
export function AuthDivider({ label }: { label: string }) {
	return (
		<div className="my-7 gap-3 flex items-center" role="separator" aria-label={label}>
			<span aria-hidden="true" className="h-px flex-1 bg-border" />
			<span aria-hidden="true" className="label-caps text-muted-foreground">
				{label}
			</span>
			<span aria-hidden="true" className="h-px flex-1 bg-border" />
		</div>
	);
}
