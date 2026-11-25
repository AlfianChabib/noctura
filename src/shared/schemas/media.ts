import { z } from "zod";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB

export const ALLOWED_IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MIME_TYPE_TO_EXTENSION: Record<AllowedImageMimeType, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const MIN_SIGNATURE_TTL_SECONDS = 600; // 10 minutes
export const DEFAULT_SIGNATURE_TTL_SECONDS = 900; // 15 minutes
export const MAX_SIGNATURE_TTL_SECONDS = 1800; // 30 minutes

export const slugSchema = z
	.string()
	.trim()
	.min(1, "Category slug is required.")
	.max(120, "Category slug must not exceed 120 characters.")
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Category slug must use lowercase letters, numbers, and hyphens only.",
	);

const uploadSignatureBaseShape = {
	fileName: z
		.string()
		.trim()
		.min(1, "File name is required.")
		.max(255, "File name must not exceed 255 characters."),
	mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
		error: "Only JPEG, PNG, and WEBP image files are allowed.",
	}),
	fileSize: z
		.int({ error: "File size must be an integer in bytes." })
		.positive("File size must be greater than 0 bytes.")
		.max(
			MAX_IMAGE_SIZE_BYTES,
			"Image size must not exceed 5 MB (5,242,880 bytes).",
		),
	expiresInSeconds: z
		.int()
		.min(MIN_SIGNATURE_TTL_SECONDS)
		.max(MAX_SIGNATURE_TTL_SECONDS)
		.optional(),
};

export const uploadSignatureRequestSchema = z.discriminatedUnion("purpose", [
	z.object({
		purpose: z.literal("product"),
		categorySlug: slugSchema,
		...uploadSignatureBaseShape,
	}),
	z.object({
		purpose: z.literal("evidence"),
		orderId: z.uuid({ error: "Invalid order ID format." }),
		...uploadSignatureBaseShape,
	}),
]);

export type UploadSignatureRequest = z.infer<
	typeof uploadSignatureRequestSchema
>;

export const uploadSignatureResponseSchema = z.object({
	token: z.string().min(1),
	expire: z.int().positive(),
	signature: z.string().regex(/^[0-9a-f]{40}$/),
	publicKey: z.string().min(1),
	urlEndpoint: z.url(),
	uploadUrl: z.url(),
	folder: z.string().startsWith("/"),
	sanitizedFileName: z.string().min(1),
});

export type UploadSignatureResponse = z.infer<
	typeof uploadSignatureResponseSchema
>;

export const imagekitUploadResponseSchema = z.looseObject({
	fileId: z.string().min(1),
	name: z.string().min(1),
	url: z.url(),
	filePath: z.string().min(1),
	thumbnailUrl: z.url().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	size: z.number().optional(),
	fileType: z.string().optional(),
});

export type ImageKitUploadResponse = z.infer<
	typeof imagekitUploadResponseSchema
>;

export const productMediaItemSchema = z.object({
	url: z.url({ error: "Image URL must be a valid URL." }),
	altText: z
		.string()
		.trim()
		.min(1, "Alt text is required.")
		.max(255, "Alt text must not exceed 255 characters."),
	colorName: z
		.string()
		.trim()
		.max(60, "Color name must not exceed 60 characters.")
		.optional(),
	fileId: z.string().min(1).optional(),
	isPrimary: z.boolean().default(false),
});

export type ProductMediaItem = z.infer<typeof productMediaItemSchema>;

export interface ImageFileCheckInput {
	name: string;
	type: string;
	size: number;
}

export type ImageFileCheckResult =
	| { ok: true }
	| { ok: false; message: string };

/**
 * Validates image MIME type, file extension (when present), and byte size
 * consistently on both client and tests before requesting an upload signature.
 */
export function validateImageFile(
	file: ImageFileCheckInput,
): ImageFileCheckResult {
	const mimeParsed = uploadSignatureBaseShape.mimeType.safeParse(file.type);
	if (!mimeParsed.success) {
		return {
			ok: false,
			message:
				"Format file tidak didukung. Gunakan hanya JPEG, PNG, atau WEBP.",
		};
	}

	const lastDotIndex = file.name.lastIndexOf(".");
	if (lastDotIndex !== -1) {
		const ext = file.name.slice(lastDotIndex + 1).toLowerCase();
		if (!(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
			return {
				ok: false,
				message:
					"Ekstensi file tidak valid. Gunakan ekstensi .jpg, .jpeg, .png, atau .webp.",
			};
		}
	}

	const sizeParsed = uploadSignatureBaseShape.fileSize.safeParse(file.size);
	if (!sizeParsed.success) {
		return {
			ok: false,
			message:
				file.size <= 0
					? "File gambar kosong atau tidak valid."
					: "Ukuran gambar maksimal adalah 5 MB per foto.",
		};
	}

	return { ok: true };
}
