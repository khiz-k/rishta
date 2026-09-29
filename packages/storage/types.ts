export interface StorageBucketNamesConfig {
	/**
	 * Bucket used for user and organization avatar uploads.
	 */
	avatars: string;
	/**
	 * Private bucket for biodata photos and their veil derivatives.
	 */
	biodataPhotos: string;
}

export interface StorageConfig {
	/**
	 * Logical storage bucket names used throughout the application.
	 */
	bucketNames: StorageBucketNamesConfig;
}

export type CreateBucketHandler = (
	name: string,
	options?: {
		public?: boolean;
	},
) => Promise<void>;

export type GetSignedUploadUrlHandler = (
	path: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
		/**
		 * Content type the upload must declare. Defaults to `image/jpeg`.
		 */
		contentType?: string;
	},
) => Promise<string>;

export type DeleteObjectHandler = (
	path: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
	},
) => Promise<void>;

export type GetSignedUrlHander = (
	path: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
		expiresIn?: number;
	},
) => Promise<string>;
