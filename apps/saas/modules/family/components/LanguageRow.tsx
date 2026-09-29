"use client";

import {
	FAMILY_LANGUAGE_NAMES,
	FAMILY_LANGUAGES,
	type FamilyLanguage,
	familyLanguageDir,
} from "@repo/i18n/lib/family-languages";
import { cn } from "@repo/ui/lib";
import Link, { useLinkStatus } from "next/link";

/** While the server re-sets the page (a translation can take a moment), the chosen name fades. */
function LanguageName({ code }: { code: FamilyLanguage }) {
	const { pending } = useLinkStatus();
	return (
		<span className={cn("transition-opacity duration-150", pending && "opacity-50")}>
			{FAMILY_LANGUAGE_NAMES[code]}
		</span>
	);
}

/**
 * English · हिन्दी · اردو · ਪੰਜਾਬੀ · ગુજરાતી · বাংলা · தமிழ் · తెలుగు (design.md §5.9): each language in
 * its own script. Choosing one asks the server for the page in that language (`?lang=`), which
 * serves the cached translation or says one isn't available; the sharer's choice is only the
 * starting point, so Ammi can re-set the page if Priya picked the wrong script.
 */
export function LanguageRow({ current, label }: { current: FamilyLanguage; label: string }) {
	return (
		<nav aria-label={label} className="mt-3">
			<ul className="gap-x-4 gap-y-1 flex flex-wrap items-center">
				{FAMILY_LANGUAGES.map((code) => {
					const active = code === current;
					return (
						<li key={code}>
							<Link
								href={{ query: { lang: code } }}
								replace
								scroll={false}
								prefetch={false}
								lang={code}
								hrefLang={code}
								dir={familyLanguageDir(code)}
								aria-current={active ? "true" : undefined}
								className={cn(
									"min-h-11 inline-flex items-center border-b-2 text-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
									active
										? "border-foreground text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								<LanguageName code={code} />
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
