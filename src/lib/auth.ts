import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { ac, roles } from "./auth-access";

export const auth = betterAuth({
	baseURL:
		process.env.BETTER_AUTH_URL ||
		(process.env.NODE_ENV === "production"
			? undefined
			: "http://localhost:3000"),
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		schema,
	}),
	advanced: {
		database: {
			generateId: "uuid",
			// @better-auth/drizzle-adapter passes SQL chunks to db.query.*.findFirst,
			// which throws `Unknown relational filter field: "queryChunks"` on drizzle-orm v1 RQB v2.
			joins: false,
		},
	},
	user: {
		additionalFields: {
			phone: {
				type: "string",
				required: false,
			},
			deletedAt: {
				type: "date",
				required: false,
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			if (
				process.env.NODE_ENV === "development" ||
				!process.env.RESEND_API_KEY
			) {
				console.log(
					`[Better Auth] Reset password link for ${user.email}: ${url}`,
				);
				return;
			}
			// In production with RESEND_API_KEY, transactional email dispatch will be handled
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			if (
				process.env.NODE_ENV === "development" ||
				!process.env.RESEND_API_KEY
			) {
				console.log(
					`[Better Auth] Verification link for ${user.email}: ${url}`,
				);
				return;
			}
			// In production with RESEND_API_KEY, transactional email dispatch will be handled
		},
		sendOnSignUp: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			enabled: Boolean(
				process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
			),
		},
	},
	plugins: [
		admin({
			ac,
			roles,
			defaultRole: "customer",
			adminRoles: ["admin"],
		}),
		tanstackStartCookies(),
	],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
