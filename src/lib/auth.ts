import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import * as schema from "@/db/schema";

export type Role =
	| "customer"
	| "warehouse_staff"
	| "cs_staff"
	| "merchandiser"
	| "admin";

/**
 * Access Control Statements for Noctura Fashion Store.
 * Merges internal admin resources (user, session) with business domain resources.
 */
export const statements = {
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"impersonate-admins",
		"delete",
		"set-password",
		"set-email",
		"set-phone",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
	catalog: ["read", "manage"],
	orders: ["read", "manage_self", "update_shipments"],
	qc: ["manage"],
	rma: ["approve"],
	dsr: ["read"],
	profile: ["manage_self"],
	promotions: ["manage"],
} as const;

export const ac = createAccessControl(statements);

export const roles = {
	customer: ac.newRole({
		catalog: ["read"],
		orders: ["manage_self"],
		profile: ["manage_self"],
	}),
	warehouse_staff: ac.newRole({
		orders: ["read", "update_shipments"],
		qc: ["manage"],
	}),
	cs_staff: ac.newRole({
		orders: ["read"],
		rma: ["approve"],
		dsr: ["read"],
	}),
	merchandiser: ac.newRole({
		catalog: ["read", "manage"],
		promotions: ["manage"],
	}),
	admin: ac.newRole({
		user: [
			"create",
			"list",
			"set-role",
			"ban",
			"impersonate",
			"impersonate-admins",
			"delete",
			"set-password",
			"set-email",
			"set-phone",
			"get",
			"update",
		],
		session: ["list", "revoke", "delete"],
		catalog: ["read", "manage"],
		orders: ["read", "manage_self", "update_shipments"],
		qc: ["manage"],
		rma: ["approve"],
		dsr: ["read"],
		profile: ["manage_self"],
		promotions: ["manage"],
	}),
};

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
			joins: true,
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
		tanstackStartCookies(), // WAJIB DI URUTAN TERAKHIR
	],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
