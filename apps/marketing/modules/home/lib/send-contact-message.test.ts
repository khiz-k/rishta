import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/mail", () => ({
	sendEmail: vi.fn(),
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn() },
}));

import { sendEmail } from "@repo/mail";

import { sendContactMessage } from "./send-contact-message";

const visitor = {
	name: "Sunita Sharma",
	email: "sunita@example.com",
	message: "Can my daughter's page be written in Punjabi as well?",
	website: "",
};

describe("sendContactMessage", () => {
	beforeEach(() => {
		vi.mocked(sendEmail).mockReset();
		vi.stubEnv("CONTACT_FORM_TO", "hello@rishta.example");
		vi.stubEnv("MAIL_FROM", "noreply@rishta.example");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("sends to the team with the visitor as reply-to", async () => {
		vi.mocked(sendEmail).mockResolvedValue(true);

		await expect(sendContactMessage(visitor)).resolves.toEqual({ ok: true });
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "hello@rishta.example",
				replyTo: "sunita@example.com",
				subject: "Rishta contact form: Sunita Sharma",
			}),
		);
	});

	it("falls back to MAIL_FROM when no contact inbox is set", async () => {
		vi.stubEnv("CONTACT_FORM_TO", "");
		vi.mocked(sendEmail).mockResolvedValue(true);

		await sendContactMessage(visitor);

		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({ to: "noreply@rishta.example" }),
		);
	});

	it("reports a failed send instead of pretending", async () => {
		vi.mocked(sendEmail).mockResolvedValue(false);

		await expect(sendContactMessage(visitor)).resolves.toEqual({ ok: false });
	});

	it("reports failure when there is nowhere to deliver", async () => {
		vi.stubEnv("CONTACT_FORM_TO", "");
		vi.stubEnv("MAIL_FROM", "");

		await expect(sendContactMessage(visitor)).resolves.toEqual({ ok: false });
		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("validates on the server: nothing invalid is sent", async () => {
		for (const values of [
			{ ...visitor, email: "not-an-email" },
			{ ...visitor, message: "Hi" },
			{ ...visitor, name: "" },
			// A line break in the name would reach the subject header.
			{ ...visitor, name: "Sunita\r\nBcc: someone@example.com" },
		]) {
			await expect(sendContactMessage(values)).resolves.toEqual({ ok: false });
		}
		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("accepts a filled honeypot quietly and sends nothing", async () => {
		await expect(
			sendContactMessage({ ...visitor, website: "https://spam.example" }),
		).resolves.toEqual({
			ok: true,
		});
		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("escapes the visitor's words in the HTML body", async () => {
		vi.mocked(sendEmail).mockResolvedValue(true);

		await sendContactMessage({
			...visitor,
			message: '<img src=x onerror="alert(1)"> hello there',
		});

		const [params] = vi.mocked(sendEmail).mock.calls[0] ?? [];
		expect(params && "html" in params ? params.html : "").toContain(
			"&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
		);
	});
});
