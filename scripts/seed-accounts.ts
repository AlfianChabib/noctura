import { pathToFileURL } from "node:url";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { accounts, users } from "@/db/schema/auth";
import type { Role } from "@/lib/auth-access";

export interface SeedAccountDefinition {
	role: Role;
	name: string;
	email: string;
	phone: string;
}

export const ROLE_SEED_ACCOUNTS: readonly SeedAccountDefinition[] = [
	{
		role: "admin",
		name: "Noctura Super Admin",
		email: "admin@noctura.id",
		phone: "+628110000001",
	},
	{
		role: "merchandiser",
		name: "Noctura Merchandiser",
		email: "merchandiser@noctura.id",
		phone: "+628110000002",
	},
	{
		role: "warehouse_staff",
		name: "Noctura Warehouse Staff",
		email: "warehouse@noctura.id",
		phone: "+628110000003",
	},
	{
		role: "cs_staff",
		name: "Noctura CS Staff",
		email: "cs@noctura.id",
		phone: "+628110000004",
	},
	{
		role: "customer",
		name: "Noctura Customer",
		email: "customer@noctura.id",
		phone: "+628110000005",
	},
] as const;

export const DEFAULT_DEV_SEED_PASSWORD = "NocturaDev!2026";

export interface SeedAccountResult {
	id: string;
	role: Role;
	name: string;
	email: string;
	action: "created" | "updated";
}

export interface SeedRoleAccountsOptions {
	db: Database;
	password?: string;
	accounts?: readonly SeedAccountDefinition[];
}

export function resolveSeedPassword(
	explicitPassword?: string,
	nodeEnv = process.env.NODE_ENV || "development",
): string {
	const candidate = explicitPassword ?? process.env.SEED_DEFAULT_PASSWORD;
	if (candidate && candidate.length >= 8) {
		return candidate;
	}
	if (candidate && candidate.length < 8) {
		throw new Error(
			"SEED_DEFAULT_PASSWORD must be at least 8 characters for Better Auth.",
		);
	}
	if (nodeEnv === "production") {
		throw new Error(
			"Refusing to use default dev password in production. Set SEED_DEFAULT_PASSWORD explicitly.",
		);
	}
	return DEFAULT_DEV_SEED_PASSWORD;
}

/**
 * Idempotently creates or updates one verified credential account for each RBAC role.
 */
export async function seedRoleAccounts({
	db,
	password,
	accounts: targetAccounts = ROLE_SEED_ACCOUNTS,
}: SeedRoleAccountsOptions): Promise<SeedAccountResult[]> {
	const resolvedPassword = resolveSeedPassword(password);
	const hashedPassword = await hashPassword(resolvedPassword);

	return db.transaction(async (tx) => {
		const results: SeedAccountResult[] = [];

		for (const account of targetAccounts) {
			const normalizedEmail = account.email.trim().toLowerCase();
			const now = new Date();

			const [existingUser] = await tx
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, normalizedEmail))
				.limit(1);

			let userId: string;
			let action: "created" | "updated";

			if (existingUser) {
				await tx
					.update(users)
					.set({
						name: account.name,
						phone: account.phone,
						role: account.role,
						emailVerified: true,
						banned: false,
						banReason: null,
						banExpires: null,
						deletedAt: null,
						updatedAt: now,
					})
					.where(eq(users.id, existingUser.id));

				userId = existingUser.id;
				action = "updated";
			} else {
				const [insertedUser] = await tx
					.insert(users)
					.values({
						name: account.name,
						email: normalizedEmail,
						emailVerified: true,
						phone: account.phone,
						role: account.role,
						banned: false,
					})
					.returning({ id: users.id });

				userId = insertedUser.id;
				action = "created";
			}

			const [existingCredential] = await tx
				.select({ id: accounts.id })
				.from(accounts)
				.where(
					and(
						eq(accounts.userId, userId),
						eq(accounts.providerId, "credential"),
					),
				)
				.limit(1);

			if (existingCredential) {
				await tx
					.update(accounts)
					.set({
						accountId: userId,
						password: hashedPassword,
						updatedAt: now,
					})
					.where(eq(accounts.id, existingCredential.id));
			} else {
				await tx.insert(accounts).values({
					userId,
					accountId: userId,
					providerId: "credential",
					password: hashedPassword,
				});
			}

			results.push({
				id: userId,
				role: account.role,
				name: account.name,
				email: normalizedEmail,
				action,
			});
		}

		return results;
	});
}

function loadEnvCascade() {
	const mode = process.env.APP_ENV || process.env.NODE_ENV || "development";
	config({
		path: [`.env.${mode}.local`, `.env.${mode}`, ".env.local", ".env"],
	});
}

async function runCli() {
	loadEnvCascade();
	const { db } = await import("@/db");
	const results = await seedRoleAccounts({ db });
	const usingCustomPassword = Boolean(process.env.SEED_DEFAULT_PASSWORD);

	console.log("Seeded Noctura RBAC accounts:");
	console.table(
		results.map((r) => ({
			role: r.role,
			email: r.email,
			name: r.name,
			action: r.action,
			id: r.id,
		})),
	);

	if (usingCustomPassword) {
		console.log("Password set from SEED_DEFAULT_PASSWORD.");
	} else {
		console.log(
			`Default dev password: ${DEFAULT_DEV_SEED_PASSWORD} (override via SEED_DEFAULT_PASSWORD)`,
		);
	}
}

const isDirectExecution =
	typeof process !== "undefined" &&
	Boolean(process.argv[1]) &&
	import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
	runCli()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error("Failed to seed role accounts:", err);
			process.exit(1);
		});
}
