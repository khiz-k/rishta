import type { PropsWithChildren } from "react";

/**
 * A pencil note beside the sign-in sheet: in the left margin on wide screens, under the form on
 * phones. It answers the question the page's likely reader is holding (a parent, a candidate).
 */
export function AuthMarginNote({ children }: PropsWithChildren) {
	return (
		<p className="mt-8 pt-5 lg:absolute lg:top-28 lg:right-full lg:mt-0 lg:mr-12 lg:w-56 lg:border-t-0 lg:pt-0 lg:text-right border-t border-border pencil text-body">
			{children}
		</p>
	);
}
