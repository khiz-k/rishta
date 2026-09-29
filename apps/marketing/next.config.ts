import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const nextConfig: NextConfig = {
	transpilePackages: ["@repo/i18n", "@repo/ui"],
	images: {
		remotePatterns: [],
	},
};

export default withContentCollections(withNextIntl(nextConfig));
