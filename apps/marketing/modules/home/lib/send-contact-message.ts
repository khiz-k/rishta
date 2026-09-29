"use server";

import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";

import { contactSchema, type ContactValues } from "./contact-schema";

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * Delivers a contact-form message to the team's inbox (`CONTACT_FORM_TO`, else `MAIL_FROM`), with
 * the visitor as reply-to. It reports failure honestly, so the form never claims a message it lost.
 */
export async function sendContactMessage(values: ContactValues): Promise<{ ok: boolean }> {
	const parsed = contactSchema().safeParse(values);
	if (!parsed.success) {
		return { ok: false };
	}
	const { name, email, message, website } = parsed.data;
	if (website) {
		// A bot filled the hidden field: accept quietly, send nothing.
		return { ok: true };
	}

	const to = process.env.CONTACT_FORM_TO || process.env.MAIL_FROM;
	if (!to) {
		logger.error("Contact form: set CONTACT_FORM_TO (or MAIL_FROM) to receive messages.");
		return { ok: false };
	}

	const sent = await sendEmail({
		to,
		replyTo: email,
		subject: `Rishta contact form: ${name}`,
		text: `${name} <${email}>\n\n${message}`,
		html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
	});
	return { ok: sent };
}
