import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const processEnv: Record<string, string | undefined> =
	typeof process !== "undefined" ? process.env : {};
const importMetaEnv: Record<string, string | undefined> =
	typeof import.meta !== "undefined" && import.meta.env
		? (import.meta.env as unknown as Record<string, string | undefined>)
		: {};

export const env = createEnv({
	isServer: typeof window === "undefined",

	/**
	 * Shared environment variables between client and server (e.g. NODE_ENV).
	 */
	shared: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},

	/**
	 * Server-side environment variables schema.
	 * Sensitive secrets must NOT be prefixed with VITE_.
	 */
	server: {
		// Server & Canonical URLs
		SERVER_URL: z.url().optional(),
		PORT: z.coerce.number().default(3000),

		// Database Connection (PostgreSQL)
		DATABASE_URL: z.string().min(1).optional(),
		DATABASE_URL_POOLER: z.string().optional(),

		// Better Auth
		BETTER_AUTH_SECRET: z.string().min(32).optional(),
		BETTER_AUTH_URL: z.url().optional(),

		// Midtrans Payment Gateway
		MIDTRANS_IS_PRODUCTION: z
			.enum(["true", "false"])
			.transform((v) => v === "true")
			.default(false),
		MIDTRANS_SERVER_KEY: z.string().optional(),
		MIDTRANS_CLIENT_KEY: z.string().optional(),
		MIDTRANS_SIGNATURE_SECRET_KEY: z.string().optional(),
		MIDTRANS_SNAP_URL: z.url().optional(),

		// RajaOngkir Komerce V2 API
		RAJAONGKIR_API_KEY: z.string().optional(),
		RAJAONGKIR_BASE_URL: z.url().optional(),
		RAJAONGKIR_ORIGIN_SUBDISTRICT_ID: z.coerce.number().optional(),

		// Resend Transactional Email API
		RESEND_API_KEY: z.string().optional(),
		RESEND_WEBHOOK_SECRET: z.string().optional(),

		// ImageKit DAM Media Storage
		IMAGEKIT_PUBLIC_KEY: z.string().optional(),
		IMAGEKIT_PRIVATE_KEY: z.string().optional(),
		IMAGEKIT_URL_ENDPOINT: z.url().optional(),
	},

	/**
	 * The prefix that client-side variables must have.
	 */
	clientPrefix: "VITE_",

	/**
	 * Client-side environment variables schema.
	 */
	client: {
		VITE_APP_TITLE: z.string().min(1).default("Noctura Fashion Store"),
		VITE_APP_URL: z.url().optional(),
		VITE_MIDTRANS_CLIENT_KEY: z.string().optional(),
		VITE_MIDTRANS_SNAP_URL: z.url().optional(),
		VITE_IMAGEKIT_PUBLIC_KEY: z.string().optional(),
		VITE_IMAGEKIT_URL_ENDPOINT: z.url().optional(),
	},

	/**
	 * Mapping runtime variables from process.env and import.meta.env.
	 */
	runtimeEnv: {
		NODE_ENV: processEnv.NODE_ENV || importMetaEnv.MODE,
		PORT: processEnv.PORT,
		SERVER_URL: processEnv.SERVER_URL,
		DATABASE_URL: processEnv.DATABASE_URL,
		DATABASE_URL_POOLER:
			processEnv.DATABASE_URL_POOLER || processEnv.DATABASE_URL_POOLED,
		BETTER_AUTH_SECRET: processEnv.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: processEnv.BETTER_AUTH_URL,
		MIDTRANS_IS_PRODUCTION: processEnv.MIDTRANS_IS_PRODUCTION,
		MIDTRANS_SERVER_KEY: processEnv.MIDTRANS_SERVER_KEY,
		MIDTRANS_CLIENT_KEY: processEnv.MIDTRANS_CLIENT_KEY,
		MIDTRANS_SIGNATURE_SECRET_KEY: processEnv.MIDTRANS_SIGNATURE_SECRET_KEY,
		MIDTRANS_SNAP_URL: processEnv.MIDTRANS_SNAP_URL,
		RAJAONGKIR_API_KEY: processEnv.RAJAONGKIR_API_KEY,
		RAJAONGKIR_BASE_URL: processEnv.RAJAONGKIR_BASE_URL,
		RAJAONGKIR_ORIGIN_SUBDISTRICT_ID:
			processEnv.RAJAONGKIR_ORIGIN_SUBDISTRICT_ID,
		RESEND_API_KEY: processEnv.RESEND_API_KEY,
		RESEND_WEBHOOK_SECRET: processEnv.RESEND_WEBHOOK_SECRET,
		IMAGEKIT_PUBLIC_KEY: processEnv.IMAGEKIT_PUBLIC_KEY,
		IMAGEKIT_PRIVATE_KEY: processEnv.IMAGEKIT_PRIVATE_KEY,
		IMAGEKIT_URL_ENDPOINT: processEnv.IMAGEKIT_URL_ENDPOINT,
		VITE_APP_TITLE: importMetaEnv.VITE_APP_TITLE || processEnv.VITE_APP_TITLE,
		VITE_APP_URL: importMetaEnv.VITE_APP_URL || processEnv.VITE_APP_URL,
		VITE_MIDTRANS_CLIENT_KEY:
			importMetaEnv.VITE_MIDTRANS_CLIENT_KEY ||
			processEnv.VITE_MIDTRANS_CLIENT_KEY,
		VITE_MIDTRANS_SNAP_URL:
			importMetaEnv.VITE_MIDTRANS_SNAP_URL || processEnv.VITE_MIDTRANS_SNAP_URL,
		VITE_IMAGEKIT_PUBLIC_KEY:
			importMetaEnv.VITE_IMAGEKIT_PUBLIC_KEY ||
			processEnv.VITE_IMAGEKIT_PUBLIC_KEY,
		VITE_IMAGEKIT_URL_ENDPOINT:
			importMetaEnv.VITE_IMAGEKIT_URL_ENDPOINT ||
			processEnv.VITE_IMAGEKIT_URL_ENDPOINT,
	},

	skipValidation:
		!!processEnv.SKIP_ENV_VALIDATION ||
		processEnv.npm_lifecycle_event === "lint",
	emptyStringAsUndefined: true,
});
