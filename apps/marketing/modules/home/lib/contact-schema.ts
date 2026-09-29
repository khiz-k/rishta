import { z } from "zod";

export const CONTACT_LIMITS = { name: 120, email: 254, messageMin: 10, message: 5000 } as const;

interface ContactSchemaMessages {
	name?: string;
	email?: string;
	message?: string;
}

/**
 * One schema for the contact form and the server action that sends it. The form passes
 * translated messages; the server validates the same shape again before anything is sent.
 */
export function contactSchema(messages: ContactSchemaMessages = {}) {
	return z.object({
		name: z
			.string()
			.trim()
			.min(1, messages.name)
			.max(CONTACT_LIMITS.name, messages.name)
			.regex(/^[^\r\n]+$/, messages.name),
		email: z.email(messages.email).max(CONTACT_LIMITS.email, messages.email),
		message: z
			.string()
			.trim()
			.min(CONTACT_LIMITS.messageMin, messages.message)
			.max(CONTACT_LIMITS.message, messages.message),
		/** Honeypot: hidden from people, filled in by bots. */
		website: z.string().max(200).optional(),
	});
}

export type ContactValues = z.input<ReturnType<typeof contactSchema>>;
