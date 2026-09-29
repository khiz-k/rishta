import { ReadersScreen } from "@biodata/components/ReadersScreen";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("readers");
	return { title: t("title") };
}

export default function ReadersPage() {
	return <ReadersScreen />;
}
