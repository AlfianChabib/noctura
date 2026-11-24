import assert from "node:assert/strict";
import { app, type AppType } from "../src/server/app";
import { testClient } from "hono/testing";
import { api, client } from "../src/lib/api-client";

type HealthResponse = {
	status: "ok" | "error";
	timestamp: string;
	uptime: number;
	env: string;
}

async function runTests() {
	console.log("▶ Running TASK-102 Hono API and RPC verification tests...\n");

	{
		console.log("Test 1: GET /api/health in-process request");
		const res = await app.request("/api/health");
		assert.equal(res.status, 200, "Health endpoint should return 200 OK");

		const responseTimeHeader = res.headers.get("X-Response-Time");
		assert.ok(
			responseTimeHeader,
			"X-Response-Time header must be present from timing middleware",
		);
		console.log(`  ✓ X-Response-Time header: ${responseTimeHeader}`);

		const body = (await res.json()) as HealthResponse
		assert.equal(body.status, "ok", 'body.status must be "ok"');
		assert.ok(body.timestamp, "body.timestamp must be present");
		assert.ok(typeof body.uptime === "number", "body.uptime must be a number");
		console.log("  ✓ Status:", body.status);
		console.log("  ✓ Timestamp:", body.timestamp);
		console.log("  ✓ Uptime:", body.uptime);
		console.log("  ✓ Environment:", body.env);
		console.log("  ✓ Passed!\n");
	}

	{
		console.log("Test 2: GET /api/unknown 404 handler");
		const res = await app.request("/api/nonexistent-route");
		assert.equal(res.status, 404, "Unknown endpoint must return 404");

		const body = (await res.json()) as {
			success: boolean;
			error: { message: string; status: number };
		};
		assert.equal(body.success, false, "body.success must be false");
		assert.equal(body.error.status, 404, "body.error.status must be 404");
		assert.ok(
			body.error.message.includes("Route not found"),
			"body.error.message must indicate route not found",
		);
		console.log("  ✓ 404 response payload:", JSON.stringify(body));
		console.log("  ✓ Passed!\n");
	}

	{
		console.log("Test 3: Hono RPC client (testClient) invocation");
		const tClient = testClient<AppType>(app);
		const res = await tClient.api.health.$get();
		assert.equal(res.status, 200, "RPC client should return 200 OK");

		const data = await res.json();
		assert.equal(data.status, "ok", 'RPC data.status must be "ok"');
		console.log("  ✓ RPC client returned status:", data.status);
		console.log("  ✓ Passed!\n");
	}

	{
		console.log("Test 4: Verify singleton api client structure");
		assert.ok(api, "api export must exist");
		assert.ok(api.health, "api.health route must exist");
		assert.equal(typeof api.health.$get, "function", "api.health.$get must be a function");
		assert.ok(client, "client export must exist");
		assert.ok(client.api, "client.api must exist");
		console.log("  ✓ api.health.$get is fully defined as an RPC callable function");
		console.log("  ✓ Passed!\n");
	}

	console.log("🎉 All TASK-102 tests passed successfully!");
}

runTests().catch((err) => {
	console.error("❌ Test suite failed:", err);
	process.exit(1);
});
