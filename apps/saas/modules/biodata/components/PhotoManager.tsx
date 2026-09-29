"use client";

import { useHousehold } from "@household/components/HouseholdProvider";
import type { PhotoVisibility } from "@repo/database/drizzle/domain";
import { Button, cn } from "@repo/ui";
import { ResponsiveSheet } from "@shared/components/ResponsiveSheet";
import type { OwnerPhoto } from "@shared/lib/api-types";
import { knownErrorCode } from "@shared/lib/errors";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { encodePhoto } from "../lib/photo-encode";

const MAX_PHOTOS = 5;
const VISIBILITIES: PhotoVisibility[] = ["everyone", "after_note", "after_yes"];

async function upload(url: string, blob: Blob) {
	const response = await fetch(url, {
		method: "PUT",
		body: blob,
		headers: { "Content-Type": "image/jpeg" },
	});
	if (!response.ok) {
		throw new Error("Upload failed");
	}
}

/**
 * The photo manager (design.md §5.7): up to five photos, each with its own visibility. Clear
 * after you both say yes is the default and recommended. Photos are re-encoded before upload so
 * no location or camera data leaves the phone.
 */
export function PhotoManager({
	open,
	onOpenChange,
	photos,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	photos: OwnerPhoto[];
}) {
	const t = useTranslations("biodata.photos");
	const { organizationId } = useHousehold();
	const queryClient = useQueryClient();
	const inputRef = useRef<HTMLInputElement>(null);
	const [working, setWorking] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const createUrl = useMutation(orpc.profiles.photos.createUploadUrl.mutationOptions());
	const add = useMutation(orpc.profiles.photos.add.mutationOptions());
	const update = useMutation(orpc.profiles.photos.update.mutationOptions());
	const remove = useMutation(orpc.profiles.photos.remove.mutationOptions());

	const refresh = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.profiles.me.queryKey({ input: { organizationId } }),
		});

	const sorted = [...photos].sort((a, b) => a.position - b.position);

	const onFiles = async (files: FileList | null) => {
		const file = files?.[0];
		if (!file) {
			return;
		}
		setError(null);
		setWorking("upload");
		try {
			const encoded = await encodePhoto(file);
			const [clearUrl, veilUrl] = await Promise.all([
				createUrl.mutateAsync({
					organizationId,
					contentType: "image/jpeg",
					variant: "clear",
				}),
				createUrl.mutateAsync({
					organizationId,
					contentType: "image/jpeg",
					variant: "veil",
				}),
			]);
			await Promise.all([
				upload(clearUrl.signedUploadUrl, encoded.clear),
				upload(veilUrl.signedUploadUrl, encoded.veil),
			]);
			await add.mutateAsync({
				organizationId,
				storageKey: clearUrl.storageKey,
				veilKey: veilUrl.storageKey,
				width: encoded.width,
				height: encoded.height,
				visibility: "after_yes",
			});
			await refresh();
		} catch (failure) {
			setError(knownErrorCode(failure) === "PHOTO_LIMIT" ? t("limit") : t("uploadFailed"));
		} finally {
			setWorking(null);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	};

	const run = async (id: string, task: () => Promise<unknown>) => {
		setError(null);
		setWorking(id);
		try {
			await task();
			await refresh();
		} catch {
			setError(t("failed"));
		} finally {
			setWorking(null);
		}
	};

	return (
		<ResponsiveSheet
			open={open}
			onOpenChange={onOpenChange}
			title={t("title")}
			description={t("description")}
			desktopClassName="max-w-2xl"
		>
			<div className="gap-5 flex flex-col">
				{sorted.length === 0 && <p className="pencil text-body">{t("empty")}</p>}
				<ul className="gap-4 flex flex-col">
					{sorted.map((photo, index) => (
						<li
							key={photo.id}
							className="gap-4 p-3 grid grid-cols-[5.5rem_1fr] border border-border bg-card"
						>
							<div className="aspect-[4/5] overflow-hidden border border-border bg-veil">
								{photo.url && (
									<img
										src={photo.url}
										alt={t("yourPhoto", { number: index + 1 })}
										className="size-full object-cover"
									/>
								)}
							</div>
							<div className="min-w-0">
								<p className="label-caps text-muted-foreground">
									{index === 0 ? t("first") : t("number", { number: index + 1 })}
								</p>
								{/* A tap saves at once, so pressed buttons rather than radios: an arrow key
								    must never change who sees a photo. */}
								<div
									role="group"
									aria-label={t("whoSees")}
									className="mt-2 flex flex-col"
								>
									{VISIBILITIES.map((visibility) => (
										<button
											key={visibility}
											type="button"
											aria-pressed={photo.visibility === visibility}
											disabled={working !== null}
											onClick={() =>
												void run(photo.id, () =>
													update.mutateAsync({
														photoId: photo.id,
														visibility,
													}),
												)
											}
											className={cn(
												"min-h-11 px-2 gap-2 flex items-center text-left text-ui",
												photo.visibility === visibility
													? "text-foreground"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											<span
												aria-hidden="true"
												className="size-4 inline-flex items-center justify-center border border-input"
											>
												{photo.visibility === visibility ? "✓" : ""}
											</span>
											{t(`visibility.${visibility}`)}
										</button>
									))}
								</div>
								<div className="mt-2 gap-4 flex flex-wrap">
									{index > 0 && (
										<Button
											variant="link"
											size="sm"
											disabled={working !== null}
											onClick={() =>
												void run(photo.id, () =>
													update.mutateAsync({
														photoId: photo.id,
														position: 0,
													}),
												)
											}
										>
											{t("makeFirst")}
										</Button>
									)}
									<Button
										variant="link"
										size="sm"
										className="text-muted-foreground"
										disabled={working !== null}
										onClick={() =>
											void run(photo.id, () =>
												remove.mutateAsync({ photoId: photo.id }),
											)
										}
									>
										{t("remove")}
									</Button>
								</div>
							</div>
						</li>
					))}
				</ul>

				{error && (
					<p role="alert" className="text-body text-destructive">
						{error}
					</p>
				)}

				{sorted.length < MAX_PHOTOS ? (
					<div>
						<input
							ref={inputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/heic"
							className="sr-only"
							id="photo-upload"
							onChange={(event) => void onFiles(event.target.files)}
						/>
						<Button asChild variant="outline" loading={working === "upload"}>
							<label htmlFor="photo-upload" className="cursor-pointer">
								{working === "upload" ? t("adding") : t("add")}
							</label>
						</Button>
						<p className="mt-2 text-meta text-muted-foreground">{t("exif")}</p>
					</div>
				) : (
					<p className="text-meta text-muted-foreground">{t("limit")}</p>
				)}
			</div>
		</ResponsiveSheet>
	);
}
