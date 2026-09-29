import { Resend } from "resend";

import { config } from "../config";
import type { SendEmailHandler } from "../types";

let client: Resend | undefined;

/**
 * The Resend client is made on the first send, not at import: `new Resend()` throws without
 * `RESEND_API_KEY`, and a build or a page that never sends mail must not need the key.
 */
function getClient() {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY is not set");
	}
	client ??= new Resend(apiKey);
	return client;
}

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	cc,
	bcc,
	replyTo,
	html,
	text,
}) => {
	// Resend reports failures in the result rather than throwing: raise them, so `sendEmail`
	// returns false and a form can say the message was not sent.
	const { error } = await getClient().emails.send({
		from: from ?? config.mailFrom,
		to: [to],
		cc,
		bcc,
		replyTo,
		subject,
		html,
		text,
	});

	if (error) {
		throw new Error(`Could not send email: ${error.name}: ${error.message}`);
	}
};
