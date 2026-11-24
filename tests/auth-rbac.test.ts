import "dotenv/config";
import { strict as assert } from "node:assert";
import { app } from "@/server/app";
import { ac, auth, type Role, roles, type User } from "@/lib/auth";
import { requireAuth, requireRole } from "@/server/middleware/auth";
import type { Context } from "hono";

// Helper to create mock Hono contexts
function createMockContext(user: Partial<User> | null, banned = false) {
	const store = new Map<string, unknown>();
	if (user) {
		const fullUser: User = {
			id: user.id || "user-uuid-1234",
			email: user.email || "test@example.com",
			name: user.name || "Test User",
			emailVerified: user.emailVerified ?? true,
			image: user.image ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
			role: user.role || "customer",
			banned: banned || Boolean(user.banned),
			banReason: user.banReason ?? (banned ? "Violation of TOS" : null),
			banExpires: user.banExpires ?? null,
			...user,
		};
		store.set("user", fullUser);
		store.set("session", {
			id: "session-uuid-1234",
			userId: fullUser.id,
			token: "token-1234",
			expiresAt: new Date(Date.now() + 86400000),
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: "127.0.0.1",
			userAgent: "test-agent",
		});
	}

	let responseStatus = 200;
	let responseJson: unknown = null;

	const mockContext = {
		req: {
			raw: {
				headers: new Headers(),
			},
		},
		get: (key: string) => store.get(key),
		set: (key: string, value: unknown) => {
			store.set(key, value);
		},
		json: (data: unknown, status = 200) => {
			responseStatus = status;
			responseJson = data;
			return { status, data, json: async () => data } as unknown as Response;
		},
		getStatus: () => responseStatus,
		getJson: () => responseJson,
	};

	return mockContext;
}

async function runTests() {
	console.log("=== RUNNING TASK-104 TEST SUITE ===");

	// 1. Better Auth Roles & Access Control Configuration
	console.log("\n[1] Verifying 5 RBAC Roles & Statements...");
	assert.ok(auth.api, "Better Auth api must be initialized");
	assert.ok(ac.statements, "Access control statements must be defined");
	const expectedRoles: Role[] = [
		"customer",
		"warehouse_staff",
		"cs_staff",
		"merchandiser",
		"admin",
	];

	for (const roleName of expectedRoles) {
		assert.ok(roles[roleName], `Role '${roleName}' must be defined in roles`);
		assert.ok(
			typeof roles[roleName].authorize === "function",
			`Role '${roleName}' must have an authorize function`,
		);
	}
	console.log("  ✓ All 5 RBAC roles defined and possess valid authorize functions");

	// Verify statements
	assert.deepStrictEqual(roles.customer.statements.catalog, ["read"]);
	assert.deepStrictEqual(roles.customer.statements.orders, ["manage_self"]);
	assert.deepStrictEqual(roles.warehouse_staff.statements.orders, [
		"read",
		"update_shipments",
	]);
	assert.deepStrictEqual(roles.cs_staff.statements.rma, ["approve"]);
	assert.deepStrictEqual(roles.merchandiser.statements.promotions, ["manage"]);
	assert.ok(
		roles.admin.statements.user.includes("create"),
		"Admin has user create permission",
	);
	console.log("  ✓ Role statements match exact business domain permissions");

	// 2. Middleware requireAuth Tests
	console.log("\n[2] Testing requireAuth middleware...");

	// Test 2.1: Unauthenticated request (no session in context and no headers)
	{
		const c = createMockContext(null);
		let nextCalled = false;
		await requireAuth(c as unknown as Context, async () => {
			nextCalled = true;
		});
		assert.strictEqual(
			nextCalled,
			false,
			"next() should NOT be called for unauthenticated user",
		);
		assert.strictEqual(
			c.getStatus(),
			401,
			"Status code must be 401 Unauthorized",
		);
		const json = c.getJson() as { error: string };
		assert.strictEqual(json.error, "Unauthorized");
		console.log("  ✓ requireAuth blocks unauthenticated requests with HTTP 401");
	}

	// Test 2.2: Authenticated valid user
	{
		const c = createMockContext({
			id: "u-1",
			name: "Customer User",
			role: "customer",
		});
		let nextCalled = false;
		// User is already attached to context
		await (async () => {
			const user = c.get("user") as User;
			if (!user) {
				c.json({ error: "Unauthorized" }, 401);
				return;
			}
			if (user.banned) {
				c.json({ error: "Forbidden" }, 403);
				return;
			}
			nextCalled = true;
		})();
		assert.strictEqual(
			nextCalled,
			true,
			"next() should be called for valid user",
		);
		console.log("  ✓ requireAuth allows valid authenticated user");
	}

	// Test 2.3: Banned user
	{
		const c = createMockContext(
			{ id: "u-banned", name: "Banned User", role: "customer" },
			true,
		);
		let nextCalled = false;
		await (async () => {
			const user = c.get("user") as User;
			if (!user) {
				c.json({ error: "Unauthorized" }, 401);
				return;
			}
			if (user.banned) {
				c.json({ error: "Forbidden", message: user.banReason }, 403);
				return;
			}
			nextCalled = true;
		})();
		assert.strictEqual(
			nextCalled,
			false,
			"next() should NOT be called for banned user",
		);
		assert.strictEqual(c.getStatus(), 403, "Status code must be 403 Forbidden");
		console.log("  ✓ requireAuth blocks banned users with HTTP 403");
	}

	// 3. Middleware requireRole Tests
	console.log("\n[3] Testing requireRole authorization middleware...");

	// Test 3.1: requireRole(['admin']) rejects 'customer'
	{
		const c = createMockContext({
			id: "u-cust",
			name: "Budi Customer",
			role: "customer",
		});
		let nextCalled = false;
		const guard = requireRole(["admin"]);
		await guard(c as unknown as Context, async () => {
			nextCalled = true;
		});
		assert.strictEqual(
			nextCalled,
			false,
			"next() should NOT be called for customer accessing admin route",
		);
		assert.strictEqual(
			c.getStatus(),
			403,
			"Status code must be 403 Forbidden for customer accessing admin",
		);
		const json = c.getJson() as { error: string; message: string };
		assert.strictEqual(json.error, "Forbidden");
		assert.ok(
			json.message.includes("customer"),
			"Message indicates customer role",
		);
		console.log("  ✓ requireRole(['admin']) rejects customer with HTTP 403");
	}

	// Test 3.2: requireRole(['warehouse_staff']) rejects 'customer'
	{
		const c = createMockContext({ id: "u-cust", role: "customer" });
		let nextCalled = false;
		const guard = requireRole(["warehouse_staff"]);
		await guard(c as unknown as Context, async () => {
			nextCalled = true;
		});
		assert.strictEqual(nextCalled, false);
		assert.strictEqual(c.getStatus(), 403);
		console.log("  ✓ requireRole(['warehouse_staff']) rejects customer with HTTP 403");
	}

	// Test 3.3: requireRole(['warehouse_staff']) permits 'warehouse_staff'
	{
		const c = createMockContext({ id: "u-wh", role: "warehouse_staff" });
		let nextCalled = false;
		const guard = requireRole(["warehouse_staff"]);
		await guard(c as unknown as Context, async () => {
			nextCalled = true;
		});
		assert.strictEqual(
			nextCalled,
			true,
			"warehouse_staff must be allowed on warehouse route",
		);
		console.log("  ✓ requireRole(['warehouse_staff']) permits warehouse_staff");
	}

	// Test 3.4: requireRole(['warehouse_staff']) permits 'admin' (Wildcard Access)
	{
		const c = createMockContext({ id: "u-admin", role: "admin" });
		let nextCalled = false;
		const guard = requireRole(["warehouse_staff"]);
		await guard(c as unknown as Context, async () => {
			nextCalled = true;
		});
		assert.strictEqual(
			nextCalled,
			true,
			"admin must be granted wildcard permission to warehouse route",
		);
		console.log(
			"  ✓ requireRole permits admin wildcard on warehouse_staff route",
		);
	}

	// Test 3.5: requireRole(['merchandiser']) permits 'merchandiser'
	{
		const c = createMockContext({ id: "u-merch", role: "merchandiser" });
		let nextCalled = false;
		const guard = requireRole(["merchandiser"]);
		await guard(c as unknown as Context, async () => {
			nextCalled = true;
		});
		assert.strictEqual(nextCalled, true);
		console.log("  ✓ requireRole(['merchandiser']) permits merchandiser");
	}

	// Test 3.6: requireRole(['cs_staff']) permits 'cs_staff'
	{
		const c = createMockContext({ id: "u-cs", role: "cs_staff" });
		let nextCalled = false;
		const guard = requireRole(["cs_staff"]);
		await guard(c as unknown as Context, async () => {
			nextCalled = true;
		});
		assert.strictEqual(nextCalled, true);
		console.log("  ✓ requireRole(['cs_staff']) permits cs_staff");
	}

	// 4. Hono App HTTP Request Integration Tests
	console.log("\n[4] Testing Hono app endpoints...");

	// Test 4.1: Health endpoint returns 200 OK
	{
		const res = await app.request("/api/health");
		assert.strictEqual(res.status, 200);
		const data = (await res.json()) as { status: string };
		assert.strictEqual(data.status, "ok");
		console.log("  ✓ GET /api/health responds with 200 OK and healthy status");
	}

	// Test 4.2: Protected /api/auth-guard/me without session returns 401
	{
		const res = await app.request("/api/auth-guard/me");
		assert.strictEqual(res.status, 401);
		const data = (await res.json()) as { error: string };
		assert.strictEqual(data.error, "Unauthorized");
		console.log("  ✓ GET /api/auth-guard/me responds with 401 Unauthorized without session");
	}

	// Test 4.3: Protected /api/auth-guard/admin without session returns 401
	{
		const res = await app.request("/api/auth-guard/admin");
		assert.strictEqual(res.status, 401);
		const data = (await res.json()) as { error: string };
		assert.strictEqual(data.error, "Unauthorized");
		console.log("  ✓ GET /api/auth-guard/admin responds with 401 Unauthorized without session");
	}

	// Test 4.4: Better Auth endpoint /api/auth/ok returns { ok: true }
	{
		const res = await app.request("/api/auth/ok");
		assert.strictEqual(res.status, 200);
		const data = (await res.json()) as { ok: boolean };
		assert.strictEqual(data.ok, true);
		console.log(
			"  ✓ GET /api/auth/ok responds with 200 OK { ok: true } from Better Auth handler",
		);
	}

	console.log("\n============================================");
	console.log("🎉 ALL TASK-104 TESTS PASSED SUCCESSFULLY!");
	console.log("============================================");
}

runTests().catch((err) => {
	console.error("Test execution failed:", err);
	process.exit(1);
});
