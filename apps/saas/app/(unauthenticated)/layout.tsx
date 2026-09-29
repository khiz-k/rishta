import { SessionProvider } from "@auth/components/SessionProvider";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";

export default async function AuthLayout({ children }: PropsWithChildren) {
	const messages = await getMessages();
	return (
		<NextIntlClientProvider messages={messages}>
			<SessionProvider>
				<AuthWrapper>{children}</AuthWrapper>
			</SessionProvider>
		</NextIntlClientProvider>
	);
}
