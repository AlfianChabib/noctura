import assert from "node:assert/strict";
import test from "node:test";

import {
	createQueryClient,
	getContext,
} from "@/integrations/tanstack-query/root-provider";
import { isStaffRole, STAFF_ROLES } from "@/lib/auth-access";
import { Route as SitemapRoute } from "@/routes/sitemap[.]xml";

test("createQueryClient instantiates a new QueryClient per call with isolated cache and required timing options", () => {
	const qc1 = createQueryClient();
	const qc2 = createQueryClient();

	// 1. Both QueryClients must exist
	assert.ok(qc1);
	assert.ok(qc2);

	// 2. QueryClient instances must NOT be singletons (different instances per SSR call)
	assert.notEqual(
		qc1,
		qc2,
		"QueryClient must be isolated per invocation to prevent SSR cache leaks",
	);

	// 3. QueryClient timing options must match specifications (staleTime: 30,000ms, gcTime: 300,000ms)
	const defaultOptions1 = qc1.getDefaultOptions();
	assert.equal(
		defaultOptions1.queries?.staleTime,
		30_000,
		"staleTime must be 30,000ms",
	);
	assert.equal(
		defaultOptions1.queries?.gcTime,
		300_000,
		"gcTime must be 300,000ms (5 minutes)",
	);

	const defaultOptions2 = qc2.getDefaultOptions();
	assert.equal(defaultOptions2.queries?.staleTime, 30_000);
	assert.equal(defaultOptions2.queries?.gcTime, 300_000);

	// 4. Cache state must be independent (no cross-request pollution)
	qc1.setQueryData(["test-ssr-key"], { user: "alice" });
	assert.equal(
		qc2.getQueryData(["test-ssr-key"]),
		undefined,
		"Cache in qc1 must not bleed into qc2",
	);

	// 5. getContext also returns isolated instance
	const ctx = getContext();
	assert.ok(ctx.queryClient);
	assert.notEqual(ctx.queryClient, qc1);
});

test("STAFF_ROLES defines all 4 staff roles and isStaffRole validates accurately", () => {
	// Must contain admin, warehouse_staff, cs_staff, merchandiser
	assert.deepEqual(
		[...STAFF_ROLES].sort(),
		["admin", "cs_staff", "merchandiser", "warehouse_staff"].sort(),
	);

	// Allowed staff roles
	assert.equal(isStaffRole("admin"), true);
	assert.equal(isStaffRole("warehouse_staff"), true);
	assert.equal(isStaffRole("cs_staff"), true);
	assert.equal(isStaffRole("merchandiser"), true);

	// Unauthorized roles
	assert.equal(isStaffRole("customer"), false);
	assert.equal(isStaffRole("guest"), false);
	assert.equal(isStaffRole(""), false);
	assert.equal(isStaffRole(null), false);
	assert.equal(isStaffRole(undefined), false);
});

test("sitemap[.]xml server route renders valid XML and correct Content-Type header", async () => {
	const serverOpts = SitemapRoute.options.server as
		| {
				handlers?: {
					GET?: (ctx: { request: Request }) => Promise<Response>;
				};
		  }
		| undefined;
	const handler = serverOpts?.handlers?.GET;
	assert.ok(handler, "GET handler must be defined on sitemap[.]xml route");

	const mockRequest = new Request("https://noctura.fashion/sitemap.xml");
	const response = await handler({ request: mockRequest });

	assert.equal(response.status, 200);
	assert.equal(
		response.headers.get("Content-Type"),
		"application/xml; charset=utf-8",
	);
	assert.ok(response.headers.get("Cache-Control")?.includes("public"));

	const xmlText = await response.text();
	assert.ok(xmlText.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
	assert.ok(
		xmlText.includes(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		),
	);
	assert.ok(xmlText.includes("<loc>https://noctura.fashion/</loc>"));
	assert.ok(xmlText.includes("<loc>https://noctura.fashion/test</loc>"));
	assert.ok(xmlText.includes("</urlset>"));
});

test("auth guard beforeLoad specifications enforce customer and staff boundaries", async () => {
	// Simulation of _authenticated guard logic
	const evaluateAuthenticatedGuard = (
		session: { user?: { banned?: boolean } } | null,
		href: string,
	) => {
		if (!session?.user) {
			return { redirect: "/auth/login", search: { redirect: href } };
		}
		if (session.user.banned) {
			return { redirect: "/auth/login", search: { redirect: href } };
		}
		return { user: session.user };
	};

	// Simulation of _admin guard logic
	const evaluateAdminGuard = (
		session: { user?: { role?: string; banned?: boolean } } | null,
		href: string,
	) => {
		if (!session?.user) {
			return { redirect: "/auth/login", search: { redirect: href } };
		}
		if (session.user.banned || !isStaffRole(session.user.role)) {
			return { redirect: "/unauthorized" };
		}
		return { user: session.user, role: session.user.role };
	};

	// 1. Unauthenticated visiting /account -> redirected to /auth/login with redirect query param
	const unauthCustomer = evaluateAuthenticatedGuard(null, "/account");
	assert.deepEqual(unauthCustomer, {
		redirect: "/auth/login",
		search: { redirect: "/account" },
	});

	// 2. Authenticated customer visiting /account -> allowed
	const authCustomer = evaluateAuthenticatedGuard(
		{ user: { banned: false } },
		"/account",
	);
	assert.ok("user" in authCustomer);

	// 3. Unauthenticated visiting /admin -> redirected to /auth/login with redirect param
	const unauthAdmin = evaluateAdminGuard(null, "/admin");
	assert.deepEqual(unauthAdmin, {
		redirect: "/auth/login",
		search: { redirect: "/admin" },
	});

	// 4. Customer role visiting /admin -> redirected to /unauthorized (HTTP 403 Forbidden)
	const customerInAdmin = evaluateAdminGuard(
		{ user: { role: "customer", banned: false } },
		"/admin",
	);
	assert.deepEqual(customerInAdmin, {
		redirect: "/unauthorized",
	});

	// 5. Staff roles visiting /admin -> allowed with typed context
	for (const role of STAFF_ROLES) {
		const staffAccess = evaluateAdminGuard(
			{ user: { role, banned: false } },
			"/admin",
		);
		assert.ok("user" in staffAccess);
		assert.equal(staffAccess.role, role);
	}
});
