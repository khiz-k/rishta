import type { StorageConfig } from "./types";

export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		// Private: clear images are only ever served as short-lived signed URLs (spec.md F4).
		biodataPhotos: process.env.BIODATA_PHOTOS_BUCKET_NAME ?? "biodata-photos",
	},
} as const satisfies StorageConfig;
