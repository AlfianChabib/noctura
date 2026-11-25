import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { env } from "@/env";
import type { Role } from "@/lib/auth-access";
import { IMAGEKIT_UPLOAD_URL } from "@/lib/imagekit";
import {
	type AllowedImageMimeType,
	DEFAULT_SIGNATURE_TTL_SECONDS,
	MIME_TYPE_TO_EXTENSION,
	type UploadSignatureRequest,
	type UploadSignatureResponse,
} from "@/shared/schemas/media";

export interface ImageKitConfig {
	publicKey: string;
	privateKey: string;
	urlEndpoint: string;
}

export interface MediaActor {
	id: string;
	role: Role;
}

export interface MediaServiceDeps {
	getConfig?: () => ImageKitConfig | null;
	verifyOrderOwnership?: (orderId: string, actor: MediaActor) => Promise<void>;
	nowSeconds?: () => number;
	createToken?: () => string;
}

const PRODUCT_UPLOAD_ROLES = new Set<Role>(["admin", "merchandiser"]);
const EVIDENCE_STAFF_ROLES = new Set<Role>([
	"admin",
	"cs_staff",
	"warehouse_staff",
]);

/**
 * Strips path segments and unsafe characters, guaranteeing the output extension
 * matches the validated image MIME type.
 */
export function sanitizeImageFileName(
	rawName: string,
	mimeType: AllowedImageMimeType,
): string {
	const base = rawName.split(/[\\/]/).pop() ?? "image";
	const lastDot = base.lastIndexOf(".");
	const stemRaw = lastDot > 0 ? base.slice(0, lastDot) : base;

	const cleanStem =
		stemRaw
			.toLowerCase()
			.replace(/[^a-z0-9_-]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 80) || "noctura-media";

	const ext = MIME_TYPE_TO_EXTENSION[mimeType];
	return `${cleanStem}.${ext}`;
}

/**
 * Maps upload purpose to its canonical ImageKit folder path.
 */
export function resolveImageKitFolder(input: UploadSignatureRequest): string {
	if (input.purpose === "product") {
		return `/products/${input.categorySlug}/`;
	}
	return `/evidence/${input.orderId}/`;
}

/**
 * Computes ImageKit Upload API v1 HMAC-SHA1 signature using Web Crypto API,
 * compatible with both Node.js 22+ and Cloudflare Workers (`workerd`).
 */
export async function computeImageKitSignature(
	privateKey: string,
	token: string,
	expire: number,
): Promise<string> {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(privateKey),
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);
	const rawSignature = await crypto.subtle.sign(
		"HMAC",
		cryptoKey,
		encoder.encode(`${token}${expire}`),
	);
	return Array.from(new Uint8Array(rawSignature))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function defaultGetConfig(): ImageKitConfig | null {
	const publicKey = env.IMAGEKIT_PUBLIC_KEY;
	const privateKey = env.IMAGEKIT_PRIVATE_KEY;
	const urlEndpoint = env.IMAGEKIT_URL_ENDPOINT;

	if (!publicKey || !privateKey || !urlEndpoint) {
		return null;
	}

	return {
		publicKey,
		privateKey,
		urlEndpoint: urlEndpoint.replace(/\/+$/, ""),
	};
}

async function defaultVerifyOrderOwnership(
	orderId: string,
	actor: MediaActor,
): Promise<void> {
	const [order] = await db
		.select({ id: orders.id, userId: orders.userId })
		.from(orders)
		.where(eq(orders.id, orderId))
		.limit(1);

	if (!order) {
		throw new HTTPException(404, {
			message: "Pesanan tidak ditemukan untuk unggahan bukti retur.",
		});
	}

	if (!EVIDENCE_STAFF_ROLES.has(actor.role) && order.userId !== actor.id) {
		throw new HTTPException(403, {
			message:
				"Anda tidak memiliki izin mengunggah bukti retur untuk pesanan ini.",
		});
	}
}

export function createMediaService(deps: MediaServiceDeps = {}) {
	const getConfig = deps.getConfig ?? defaultGetConfig;
	const verifyOrderOwnership =
		deps.verifyOrderOwnership ?? defaultVerifyOrderOwnership;
	const nowSeconds = deps.nowSeconds ?? (() => Math.floor(Date.now() / 1000));
	const createToken = deps.createToken ?? (() => crypto.randomUUID());

	return {
		async generateUploadSignature(
			input: UploadSignatureRequest,
			actor: MediaActor,
		): Promise<UploadSignatureResponse> {
			if (input.purpose === "product") {
				if (!PRODUCT_UPLOAD_ROLES.has(actor.role)) {
					throw new HTTPException(403, {
						message:
							"Akses ditolak: hanya merchandiser atau admin yang dapat mengunggah media produk.",
					});
				}
			} else {
				await verifyOrderOwnership(input.orderId, actor);
			}

			const config = getConfig();
			if (!config) {
				throw new HTTPException(503, {
					message:
						"Konfigurasi ImageKit belum lengkap di server. Periksa IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, dan IMAGEKIT_URL_ENDPOINT.",
				});
			}

			const ttlSeconds =
				input.expiresInSeconds ?? DEFAULT_SIGNATURE_TTL_SECONDS;
			const token = createToken();
			const expire = nowSeconds() + ttlSeconds;
			const signature = await computeImageKitSignature(
				config.privateKey,
				token,
				expire,
			);

			return {
				token,
				expire,
				signature,
				publicKey: config.publicKey,
				urlEndpoint: config.urlEndpoint.replace(/\/+$/, ""),
				uploadUrl: IMAGEKIT_UPLOAD_URL,
				folder: resolveImageKitFolder(input),
				sanitizedFileName: sanitizeImageFileName(
					input.fileName,
					input.mimeType,
				),
			};
		},
	};
}

export const mediaService = createMediaService();
export type MediaService = ReturnType<typeof createMediaService>;
