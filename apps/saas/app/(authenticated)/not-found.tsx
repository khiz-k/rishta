import { AppWrapper } from "@shared/components/AppWrapper";
import { PaperSlip } from "@shared/components/PaperSlip";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

/** A missing page is a slip on the desk, never a big 404. */
export default async function NotFoundPage() {
	const t = await getTranslations("notFound");

	return (
		<AppWrapper>
			<div className="px-4 md:px-6 pt-10 md:pt-20 mx-auto max-w-(--page-width)">
				<PaperSlip
					title={t("title")}
					actions={
						<Link
							href="/"
							className="text-ui text-seal-ink underline-offset-4 hover:underline"
						>
							{t("goToDashboard")}
						</Link>
					}
				>
					{t("body")}
				</PaperSlip>
			</div>
		</AppWrapper>
	);
}
