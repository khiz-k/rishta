"use client";

import { useSession } from "@auth/hooks/use-session";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { activeOrganizationQueryKey } from "@organizations/lib/api";
import { authClient } from "@repo/auth/client";
import { FAMILY_LANGUAGE_NAMES } from "@repo/i18n/lib/family-languages";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Checkbox,
	cn,
	Input,
} from "@repo/ui";
import { SettingsBlock } from "@shared/components/shell/SettingsNav";
import { useErrorText } from "@shared/hooks/use-error-text";
import { formatShortDate } from "@shared/lib/format";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useHousehold } from "./HouseholdProvider";

const inviteSchema = z.object({
	email: z.email(),
	role: z.enum(["member", "admin"]),
});

const candidateSchema = z.object({ email: z.email() });
const labelSchema = z.object({ label: z.string().trim().max(40) });

function MemberLabel({
	userId,
	label,
	editable,
}: {
	userId: string;
	label: string | null;
	editable: boolean;
}) {
	const t = useTranslations("household.members");
	const { organizationId } = useHousehold();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const setLabel = useMutation(orpc.households.setMemberLabel.mutationOptions());
	const form = useForm<z.infer<typeof labelSchema>>({
		resolver: zodResolver(labelSchema),
		defaultValues: { label: label ?? "" },
	});
	useEffect(() => {
		if (editing) {
			document.getElementById(`label-${userId}`)?.focus();
		}
	}, [editing, userId]);

	if (!editable) {
		return label ? <span className="text-body">{label}</span> : null;
	}

	if (!editing) {
		return (
			<button
				type="button"
				onClick={() => setEditing(true)}
				className={cn(
					"min-h-11 text-left text-body",
					label ? "editable-underline" : "pencil",
				)}
				aria-label={t("editLabel")}
			>
				{label ?? t("addLabel")}
			</button>
		);
	}

	return (
		<form
			className="gap-2 flex items-center"
			onSubmit={form.handleSubmit(async ({ label: next }) => {
				await setLabel.mutateAsync({
					organizationId,
					userId,
					label: next.length > 0 ? next : null,
				});
				void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
				setEditing(false);
			})}
		>
			<Input
				{...form.register("label")}
				id={`label-${userId}`}
				maxLength={40}
				placeholder={t("labelPlaceholder")}
				className="h-11 max-w-[12rem]"
				onKeyDown={(event) => {
					if (event.key === "Escape") {
						setEditing(false);
					}
				}}
			/>
			<Button type="submit" size="sm" variant="outline" loading={setLabel.isPending}>
				{t("saveLabel")}
			</Button>
		</form>
	);
}

/**
 * Household (design.md §5.11): members with relation labels and roles in words ("The candidate ·
 * holds the seal", "Ammi · Guardian"), invitations, the candidate's invite for a drafted page,
 * what the household can see, and the family links you've shared.
 */
export function HouseholdMembers() {
	const t = useTranslations("household.members");
	const locale = useLocale();
	const errorText = useErrorText();
	const queryClient = useQueryClient();
	const { user } = useSession();
	const { household, organizationId, abilities, slug, candidateFirstName } = useHousehold();
	const { activeOrganization } = useActiveOrganization();
	const [removing, setRemoving] = useState<{ memberId: string; name: string } | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const refresh = () => {
		void queryClient.invalidateQueries({ queryKey: orpc.households.get.key() });
		void queryClient.invalidateQueries({ queryKey: activeOrganizationQueryKey({ slug }) });
	};

	const betterAuthMembers = activeOrganization?.members ?? [];
	const invitations = (activeOrganization?.invitations ?? []).filter(
		(invitation) => invitation.status === "pending",
	);
	const pendingCandidate = household.settings.pendingCandidateEmail;

	const inviteForm = useForm<z.infer<typeof inviteSchema>>({
		resolver: zodResolver(inviteSchema),
		defaultValues: { email: "", role: "member" },
	});
	const candidateForm = useForm<z.infer<typeof candidateSchema>>({
		resolver: zodResolver(candidateSchema),
		defaultValues: { email: pendingCandidate ?? "" },
	});
	const settingsForm = useForm<{
		familyReadsFolio: boolean;
		familyEditsPage: boolean;
		familySeesIntroductions: boolean;
	}>({
		defaultValues: {
			familyReadsFolio: household.settings.familyReadsFolio,
			familyEditsPage: household.settings.familyEditsPage,
			familySeesIntroductions: household.settings.familySeesIntroductions,
		},
	});

	const updateSettings = useMutation(orpc.households.updateSettings.mutationOptions());
	const inviteCandidate = useMutation(orpc.households.inviteCandidate.mutationOptions());
	const links = useQuery({
		...orpc.familyLinks.list.queryOptions({ input: { organizationId } }),
		enabled: abilities.canShare,
	});
	const revoke = useMutation({
		...orpc.familyLinks.revoke.mutationOptions(),
		onSuccess: () => void links.refetch(),
	});

	const roleWords = (member: (typeof household.members)[number]) => {
		if (member.isCandidate) {
			return t("roles.candidate");
		}
		if (member.role === "owner") {
			return t("roles.drafter");
		}
		return member.role === "admin" ? t("roles.guardian") : t("roles.family");
	};

	const onInvite = inviteForm.handleSubmit(async (values) => {
		setActionError(null);
		const { error } = await authClient.organization.inviteMember({
			email: values.email,
			role: abilities.canManage ? values.role : "member",
			organizationId,
		});
		if (error) {
			inviteForm.setError("root", { message: t("invite.failed") });
			return;
		}
		inviteForm.reset({ email: "", role: "member" });
		refresh();
	});

	const changeRole = async (memberId: string, role: "admin" | "member") => {
		setActionError(null);
		const { error } = await authClient.organization.updateMemberRole({
			memberId,
			role,
			organizationId,
		});
		if (error) {
			setActionError(t("roleFailed"));
			return;
		}
		refresh();
	};

	const removeMember = async () => {
		if (!removing) {
			return;
		}
		const { error } = await authClient.organization.removeMember({
			memberIdOrEmail: removing.memberId,
			organizationId,
		});
		setRemoving(null);
		if (error) {
			setActionError(t("removeFailed"));
			return;
		}
		refresh();
	};

	const cancelInvitation = async (invitationId: string) => {
		const { error } = await authClient.organization.cancelInvitation({ invitationId });
		if (error) {
			setActionError(t("invite.cancelFailed"));
			return;
		}
		refresh();
	};

	const onSettings = settingsForm.handleSubmit(async (values) => {
		await updateSettings.mutateAsync({ organizationId, ...values });
		settingsForm.reset(values);
		refresh();
	});

	const openLinks = (links.data ?? []).filter((link) => link.state === "open");

	return (
		<div className="gap-6 flex flex-col">
			<SettingsBlock
				title={t("title")}
				description={t("seats", { used: household.seatsUsed, limit: household.seatsLimit })}
			>
				{household.members.length <= 1 && (
					<p className="mb-3 pencil text-body">{t("justYou")}</p>
				)}
				<ul className="border-t border-border">
					{household.members.map((member) => {
						const authMember = betterAuthMembers.find(
							(entry) => entry.userId === member.userId,
						);
						const isMe = member.userId === user?.id;
						const canChange =
							abilities.canManage &&
							!member.isCandidate &&
							member.role !== "owner" &&
							!isMe;
						return (
							<li
								key={member.userId}
								className="py-3 gap-x-4 gap-y-1 sm:grid-cols-[1fr_auto] grid grid-cols-1 border-b border-border"
							>
								<div className="min-w-0">
									<p className="font-display text-letter">
										{member.name}
										{isMe && (
											<span className="ml-2 text-meta text-muted-foreground">
												{t("you")}
											</span>
										)}
									</p>
									<div className="gap-x-2 flex flex-wrap items-baseline text-muted-foreground">
										<MemberLabel
											userId={member.userId}
											label={member.label}
											editable={abilities.canManage || isMe}
										/>
										<span className="text-meta">· {roleWords(member)}</span>
									</div>
									{member.role === "admin" && (
										<p className="text-meta text-muted-foreground">
											{t("guardianCan")}
										</p>
									)}
								</div>
								{canChange && authMember && (
									<div className="gap-3 flex items-center">
										<select
											aria-label={t("roleFor", { name: member.name })}
											value={member.role}
											onChange={(event) =>
												void changeRole(
													authMember.id,
													event.target.value === "admin"
														? "admin"
														: "member",
												)
											}
											className="h-11 px-2 border border-input bg-card text-ui focus-visible:outline-2 focus-visible:outline-ring"
										>
											<option value="admin">{t("roles.guardian")}</option>
											<option value="member">{t("roles.family")}</option>
										</select>
										<Button
											size="sm"
											variant="ghost"
											onClick={() =>
												setRemoving({
													memberId: authMember.id,
													name: member.name,
												})
											}
										>
											{t("remove")}
										</Button>
									</div>
								)}
							</li>
						);
					})}
				</ul>
				{actionError && (
					<p role="alert" className="mt-3 text-meta text-destructive">
						{actionError}
					</p>
				)}
			</SettingsBlock>

			{abilities.canShare && (
				<SettingsBlock title={t("invite.title")} description={t("invite.description")}>
					<form onSubmit={onInvite} className="gap-3 flex flex-col" noValidate>
						<div className="gap-3 sm:grid-cols-[1fr_auto] grid">
							<label className="gap-1.5 flex flex-col">
								<span className="label-caps text-muted-foreground">
									{t("invite.email")}
								</span>
								<Input
									type="email"
									autoComplete="off"
									{...inviteForm.register("email")}
								/>
							</label>
							{abilities.canManage && (
								<label className="gap-1.5 flex flex-col">
									<span className="label-caps text-muted-foreground">
										{t("invite.role")}
									</span>
									<select
										{...inviteForm.register("role")}
										className="h-11 px-3 border border-input bg-card text-body focus-visible:outline-2 focus-visible:outline-ring"
									>
										<option value="member">{t("roles.family")}</option>
										<option value="admin">{t("roles.guardian")}</option>
									</select>
								</label>
							)}
						</div>
						{inviteForm.formState.errors.email && (
							<p className="text-meta text-destructive">{t("invite.emailInvalid")}</p>
						)}
						{inviteForm.formState.errors.root && (
							<p role="alert" className="text-meta text-destructive">
								{inviteForm.formState.errors.root.message}
							</p>
						)}
						<div className="gap-3 flex items-center">
							<Button
								type="submit"
								variant="secondary"
								loading={inviteForm.formState.isSubmitting}
							>
								{t("invite.submit")}
							</Button>
							<span className="text-meta text-muted-foreground">
								{t("invite.never")}
							</span>
						</div>
					</form>
					{invitations.length > 0 && (
						<ul className="mt-5 border-t border-border">
							{invitations.map((invitation) => (
								<li
									key={invitation.id}
									className="py-2.5 gap-3 flex items-center justify-between border-b border-border"
								>
									<span className="min-w-0 truncate text-body">
										{invitation.email}
										<span className="ml-2 text-meta text-muted-foreground">
											{t("invite.pending", {
												date: formatShortDate(invitation.expiresAt, locale),
											})}
										</span>
									</span>
									{abilities.canShare && (
										<Button
											size="sm"
											variant="ghost"
											onClick={() => void cancelInvitation(invitation.id)}
										>
											{t("invite.cancel")}
										</Button>
									)}
								</li>
							))}
						</ul>
					)}
				</SettingsBlock>
			)}

			{!household.candidate.userId && abilities.canShare && (
				<SettingsBlock
					title={t("candidate.title", { name: candidateFirstName })}
					description={t("candidate.description", { name: candidateFirstName })}
				>
					<form
						onSubmit={candidateForm.handleSubmit(async ({ email }) => {
							await inviteCandidate.mutateAsync({ organizationId, email });
							refresh();
						})}
						className="gap-3 sm:flex-row flex flex-col"
						noValidate
					>
						<Input
							type="email"
							{...candidateForm.register("email")}
							aria-label={t("invite.email")}
							className="sm:max-w-xs"
						/>
						<Button
							type="submit"
							variant="secondary"
							loading={inviteCandidate.isPending}
						>
							{pendingCandidate ? t("candidate.resend") : t("candidate.send")}
						</Button>
					</form>
					{pendingCandidate && (
						<p className="mt-2 text-meta text-muted-foreground">
							{t("candidate.pending", { email: pendingCandidate })}
						</p>
					)}
					{inviteCandidate.error && (
						<p className="mt-2 text-meta text-destructive">
							{errorText(inviteCandidate.error)}
						</p>
					)}
				</SettingsBlock>
			)}

			<SettingsBlock
				title={t("sees.title")}
				description={t("sees.description", { name: candidateFirstName })}
			>
				<form onSubmit={onSettings} noValidate>
					{(
						["familyReadsFolio", "familyEditsPage", "familySeesIntroductions"] as const
					).map((name) => (
						<Controller
							key={name}
							control={settingsForm.control}
							name={name}
							render={({ field }) => (
								<label className="gap-3 py-2 flex items-start">
									<Checkbox
										checked={field.value}
										disabled={!abilities.canManage}
										onCheckedChange={(checked) =>
											field.onChange(checked === true)
										}
										className="mt-1"
									/>
									<span className="text-body">{t(`sees.${name}`)}</span>
								</label>
							)}
						/>
					))}
					{abilities.canManage && (
						<div className="mt-3 gap-3 flex items-center">
							<Button
								type="submit"
								size="sm"
								variant="secondary"
								disabled={!settingsForm.formState.isDirty}
								loading={settingsForm.formState.isSubmitting}
							>
								{t("sees.save")}
							</Button>
							{updateSettings.isSuccess && !settingsForm.formState.isDirty && (
								<span className="pencil text-meta">{t("sees.saved")}</span>
							)}
						</div>
					)}
				</form>
			</SettingsBlock>

			{abilities.canShare && (
				<SettingsBlock title={t("links.title")} description={t("links.description")}>
					{links.isPending ? null : openLinks.length === 0 ? (
						<p className="pencil text-body">{t("links.empty")}</p>
					) : (
						<ul className="border-t border-border">
							{openLinks.map((link) => (
								<li
									key={link.id}
									className="py-2.5 gap-3 flex items-center justify-between border-b border-border"
								>
									<span className="min-w-0">
										<span className="block text-body">
											{t("links.line", {
												label: link.recipientLabel,
												page: link.pageName,
											})}
										</span>
										<span className="block text-meta text-muted-foreground">
											<span lang={link.language}>
												{FAMILY_LANGUAGE_NAMES[link.language]}
											</span>
											{" · "}
											{t("links.until", {
												date: formatShortDate(link.expiresAt, locale),
											})}
											{" · "}
											{t("links.opened", { count: link.openCount })}
											{link.reaction
												? ` · ${t(`links.reaction.${link.reaction}`)}`
												: ""}
										</span>
									</span>
									<Button
										size="sm"
										variant="ghost"
										loading={
											revoke.isPending && revoke.variables?.linkId === link.id
										}
										onClick={() => revoke.mutate({ linkId: link.id })}
									>
										{t("links.close")}
									</Button>
								</li>
							))}
						</ul>
					)}
				</SettingsBlock>
			)}

			<AlertDialog
				open={removing !== null}
				onOpenChange={(open) => !open && setRemoving(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("removeTitle", { name: removing?.name ?? "" })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("removeBody", { name: removing?.name ?? "" })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("keep")}</AlertDialogCancel>
						<Button variant="secondary" onClick={() => void removeMember()}>
							{t("remove")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
