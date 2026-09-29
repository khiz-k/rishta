"use client";

import { contactSchema, type ContactValues } from "@home/lib/contact-schema";
import { sendContactMessage } from "@home/lib/send-contact-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { MailCheckIcon, MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

export function ContactForm() {
	const t = useTranslations();

	const form = useForm<ContactValues>({
		resolver: zodResolver(
			contactSchema({
				name: t("contact.form.errors.name"),
				email: t("contact.form.errors.email"),
				message: t("contact.form.errors.message"),
			}),
		),
		defaultValues: {
			name: "",
			email: "",
			message: "",
			website: "",
		},
	});

	// The message goes to a person; if it can't be delivered, the form says so and keeps it.
	const onSubmit = form.handleSubmit(async (values) => {
		const failed = () =>
			form.setError("root", {
				message: t("contact.form.notifications.error"),
			});
		try {
			const { ok } = await sendContactMessage(values);
			if (!ok) {
				failed();
			}
		} catch {
			failed();
		}
	});

	return (
		<div>
			{form.formState.isSubmitSuccessful ? (
				<Alert variant="success">
					<MailCheckIcon />
					<AlertTitle>{t("contact.form.notifications.success")}</AlertTitle>
				</Alert>
			) : (
				<Form {...form}>
					<form onSubmit={onSubmit} className="gap-6 flex flex-col items-stretch">
						{form.formState.errors.root?.message && (
							<Alert variant="error">
								<MailIcon />
								<AlertTitle>{form.formState.errors.root.message}</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("contact.form.name")}</FormLabel>
									<FormControl>
										<Input autoComplete="name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("contact.form.email")}</FormLabel>
									<FormControl>
										<Input type="email" autoComplete="email" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("contact.form.message")}</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<input
							type="text"
							tabIndex={-1}
							autoComplete="off"
							aria-hidden="true"
							className="sr-only"
							{...form.register("website")}
						/>

						<Button
							type="submit"
							className="w-full"
							variant="primary"
							loading={form.formState.isSubmitting}
						>
							{t("contact.form.submit")}
						</Button>
					</form>
				</Form>
			)}
		</div>
	);
}
