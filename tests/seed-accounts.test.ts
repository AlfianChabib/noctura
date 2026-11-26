import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { auth } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/auth-access";
import {
	DEFAULT_DEV_SEED_PASSWORD,
	ROLE_SEED_ACCOUNTS,
	resolveSeedPassword,
	seedRoleAccounts,
} from "../scripts/seed-accounts";

test("resolveSeedPassword enforces production guard and password length", () => {
	assert.equal(
		resolveSeedPassword(undefined, "development"),
		DEFAULT_DEV_SEED_PASSWORD,
	);
	assert.throws(() => resolveSeedPassword(undefined, "production"), /Refusing/);
	assert.throws(() => resolveSeedPassword("short", "development"), /8/);
	assert.equal(
		resolveSeedPassword("CustomSecret#2026", "production"),
		"CustomSecret#2026",
	);
});

test("seedRoleAccounts covers all 5 RBAC roles, is idempotent, and authenticates via Better Auth", async () => {
	const allExpectedRoles = new Set(["customer", ...STAFF_ROLES]);
	assert.equal(ROLE_SEED_ACCOUNTS.length, allExpectedRoles.size);
	for (const entry of ROLE_SEED_ACCOUNTS) {
		assert.ok(allExpectedRoles.has(entry.role));
	}

	const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
	const testPassword = "SeedTestPassword!2026";
	const testAccounts = ROLE_SEED_ACCOUNTS.map((entry) => ({
		...entry,
		email: `${entry.role}-${suffix}@noctura.test`,
	}));

	const createdIds: string[] = [];

	try {
		// 1. First run creates all 5 accounts
		const firstRun = await seedRoleAccounts({
			db,
			password: testPassword,
			accounts: testAccounts,
		});
		assert.equal(firstRun.length, 5);
		for (const row of firstRun) {
			assert.equal(row.action, "created");
			createdIds.push(row.id);
		}

		// 2. Second run updates idempotently without duplicating rows
		const secondRun = await seedRoleAccounts({
			db,
			password: testPassword,
			accounts: testAccounts,
		});
		assert.equal(secondRun.length, 5);
		for (const row of secondRun) {
			assert.equal(row.action, "updated");
		}

		// 3. Every seeded role account can sign in via Better Auth and retains its role
		for (const row of firstRun) {
			const signInResult = await auth.api.signInEmail({
				body: {
					email: row.email,
					password: testPassword,
				},
			});
			assert.equal(signInResult.user.email, row.email);
			assert.equal(signInResult.user.role, row.role);
			assert.equal(signInResult.user.emailVerified, true);
		}
	} finally {
		if (createdIds.length > 0) {
			await db.delete(users).where(inArray(users.id, createdIds));
		}
	}
});
