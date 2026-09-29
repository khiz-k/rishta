import { ReportQueue } from "@admin/component/reports/ReportQueue";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("admin.reports");
	return { title: t("title") };
}

export default function AdminReportsPage() {
	return <ReportQueue />;
}
