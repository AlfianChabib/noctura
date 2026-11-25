import "dotenv/config";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { testClient } from "hono/testing";
import { api } from "@/lib/api-client";
import type { Role } from "@/lib/auth-access";
import {
	buildFashionImageUrl,
	buildFashionLqipUrl,
	buildFashionSrcSet,
	FASHION_DEFAULT_TRANSFORM,
	isSafeImageUrl,
} from "@/lib/imagekit";
import { type AppType, app } from "@/server/app";
import type { AuthEnv } from "@/server/middleware/auth";
import { errorHandler } from "@/server/middleware/error-handler";
import { createMediaRoute } from "@/server/routes/media";
import { createMediaService } from "@/server/services/media.service";
import {
	MAX_IMAGE_SIZE_BYTES,
	uploadSignatureRequestSchema,
	validateImageFile,
} from "@/shared/schemas/media";

test("Zod v4 media schemas & validateImageFile enforce MIME, extension, 5MB limit, and folder safety", () => {
	// Valid product upload file
	assert.deepEqual(
		validateImageFile({
			name: "wool-coat-front.webp",
			type: "image/webp",
			size: 1024 * 500,
		}),
		{ ok: true },
	);

	// Exact 5MB boundary passes
	assert.deepEqual(
		validateImageFile({
			name: "max-boundary.jpg",
			type: "image/jpeg",
			size: MAX_IMAGE_SIZE_BYTES,
		}),
		{ ok: true },
	);

	// Over 5MB rejected
	const oversized = validateImageFile({
		name: "huge.png",
		type: "image/png",
		size: MAX_IMAGE_SIZE_BYTES + 1,
	});
	assert.equal(oversized.ok, false);

	// SVG & PDF rejected
	const svgAttempt = validateImageFile({
		name: "xss.svg",
		type: "image/svg+xml",
		size: 512,
	});
	assert.equal(svgAttempt.ok, false);

	// Spoofed MIME with .svg extension rejected
	const spoofedExt = validateImageFile({
		name: "payload.svg",
		type: "image/png",
		size: 512,
	});
	assert.equal(spoofedExt.ok, false);

	// Path traversal in categorySlug rejected
	const traversal = uploadSignatureRequestSchema.safeParse({
		purpose: "product",
		categorySlug: "../admin-secrets",
		fileName: "coat.jpg",
		mimeType: "image/jpeg",
		fileSize: 2048,
	});
	assert.equal(traversal.success, false);

	// Non-UUID orderId rejected for evidence
	const badOrderId = uploadSignatureRequestSchema.safeParse({
		purpose: "evidence",
		orderId: "../../etc/passwd",
		fileName: "tag.jpg",
		mimeType: "image/jpeg",
		fileSize: 2048,
	});
	assert.equal(badOrderId.success, false);

	// TTL outside 10-30 min window rejected
	const shortTtl = uploadSignatureRequestSchema.safeParse({
		purpose: "product",
		categorySlug: "outerwear",
		fileName: "coat.jpg",
		mimeType: "image/jpeg",
		fileSize: 2048,
		expiresInSeconds: 120,
	});
	assert.equal(shortTtl.success, false);
});

test("ImageKit URL helpers generate 3:4 WebP/AVIF URLs, LQIP placeholders, responsive srcSet, and sanitize unsafe schemes", () => {
	const rawUrl = "https://ik.imagekit.io/noctura/products/outerwear/coat.jpg";

	assert.equal(
		buildFashionImageUrl(rawUrl),
		`${rawUrl}?tr=${FASHION_DEFAULT_TRANSFORM}`,
	);

	// Replaces previous tr param cleanly while preserving unrelated query params
	const withExistingParams = buildFashionImageUrl(`${rawUrl}?tr=w-200&v=2`, {
		width: 800,
	});
	assert.equal(
		withExistingParams,
		`${rawUrl}?v=2&tr=w-800,ar-3-4,c-maintain_ratio,f-auto,q-80`,
	);

	// LQIP URL
	const lqip = buildFashionLqipUrl(rawUrl);
	assert.equal(
		lqip,
		`${rawUrl}?tr=w-40,ar-3-4,c-maintain_ratio,bl-30,f-auto,q-20`,
	);

	// SrcSet
	const srcSet = buildFashionSrcSet(rawUrl, [400, 800]);
	assert.equal(
		srcSet,
		`${rawUrl}?tr=w-400,ar-3-4,c-maintain_ratio,f-auto,q-80 400w, ${rawUrl}?tr=w-800,ar-3-4,c-maintain_ratio,f-auto,q-80 800w`,
	);

	// Local static asset left untouched
	assert.equal(
		buildFashionImageUrl("/assets/images/coat.jpg"),
		"/assets/images/coat.jpg",
	);

	// Unsafe URI protocols rejected
	assert.equal(isSafeImageUrl("javascript:alert(1)"), false);
	assert.equal(buildFashionImageUrl("javascript:alert(1)"), "");
	assert.equal(buildFashionImageUrl("//evil.example.com/a.jpg"), "");
});

test("media.service.ts generates ImageKit-compliant HMAC-SHA1 signatures and enforces RBAC & folder rules", async () => {
	const fixedToken = "11111111-2222-4333-8444-555555555555";
	const fixedNow = 1_760_000_000;
	const testPrivateKey = "private_test_secret_key_123";

	const svc = createMediaService({
		getConfig: () => ({
			publicKey: "public_test_key_123",
			privateKey: testPrivateKey,
			urlEndpoint: "https://ik.imagekit.io/noctura/",
		}),
		nowSeconds: () => fixedNow,
		createToken: () => fixedToken,
		verifyOrderOwnership: async (orderId, actor) => {
			if (orderId === "00000000-0000-4000-8000-000000000099") {
				throw new HTTPException(404, { message: "Not found" });
			}
			if (actor.role === "customer" && actor.id !== "owner-user-1") {
				throw new HTTPException(403, { message: "Forbidden" });
			}
		},
	});

	// 1. Merchandiser product signature
	const productSig = await svc.generateUploadSignature(
		{
			purpose: "product",
			categorySlug: "tailored-trousers",
			fileName: "../../My Wool Trousers (Front).WEBP",
			mimeType: "image/webp",
			fileSize: 250_000,
		},
		{ id: "merch-1", role: "merchandiser" },
	);

	const expectedExpire = fixedNow + 900;
	const expectedHmac = createHmac("sha1", testPrivateKey)
		.update(`${fixedToken}${expectedExpire}`)
		.digest("hex");

	assert.equal(productSig.token, fixedToken);
	assert.equal(productSig.expire, expectedExpire);
	assert.equal(productSig.signature, expectedHmac);
	assert.equal(productSig.folder, "/products/tailored-trousers/");
	assert.equal(productSig.urlEndpoint, "https://ik.imagekit.io/noctura");
	assert.equal(productSig.sanitizedFileName, "my-wool-trousers-front.webp");

	// 2. Customer forbidden from /products/
	await assert.rejects(
		() =>
			svc.generateUploadSignature(
				{
					purpose: "product",
					categorySlug: "tailored-trousers",
					fileName: "photo.jpg",
					mimeType: "image/jpeg",
					fileSize: 1024,
				},
				{ id: "cust-1", role: "customer" },
			),
		(err: unknown) => err instanceof HTTPException && err.status === 403,
	);

	// 3. Customer owner allowed for /evidence/{orderId}/
	const evidenceSig = await svc.generateUploadSignature(
		{
			purpose: "evidence",
			orderId: "00000000-0000-4000-8000-000000000001",
			fileName: "hangtag.png",
			mimeType: "image/png",
			fileSize: 512_000,
			expiresInSeconds: 1800,
		},
		{ id: "owner-user-1", role: "customer" },
	);
	assert.equal(
		evidenceSig.folder,
		"/evidence/00000000-0000-4000-8000-000000000001/",
	);
	assert.equal(evidenceSig.expire, fixedNow + 1800);

	// 4. Another customer blocked from foreign orderId (IDOR protection)
	await assert.rejects(
		() =>
			svc.generateUploadSignature(
				{
					purpose: "evidence",
					orderId: "00000000-0000-4000-8000-000000000001",
					fileName: "hangtag.png",
					mimeType: "image/png",
					fileSize: 512_000,
				},
				{ id: "other-user-2", role: "customer" },
			),
		(err: unknown) => err instanceof HTTPException && err.status === 403,
	);
});

test("Hono POST /api/media/upload-signature enforces auth, Zod validation, RBAC, and RPC typing", async () => {
	// 1. Live app rejects unauthenticated caller with 401
	const unauthRes = await app.request("/api/media/upload-signature", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			purpose: "product",
			categorySlug: "knitwear",
			fileName: "sweater.jpg",
			mimeType: "image/jpeg",
			fileSize: 1024,
		}),
	});
	assert.equal(unauthRes.status, 401);

	// 2. Verify RPC client exposes api.media["upload-signature"].$post
	assert.equal(typeof api.media["upload-signature"].$post, "function");

	// 3. Test mounted route behavior with injected actor & deterministic service
	const svc = createMediaService({
		getConfig: () => ({
			publicKey: "public_test_123",
			privateKey: "private_test_123",
			urlEndpoint: "https://ik.imagekit.io/noctura",
		}),
		verifyOrderOwnership: async () => {},
	});

	let currentActor: { id: string; role: Role } = {
		id: "merch-1",
		role: "merchandiser",
	};

	const mockAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
		c.set("user", {
			id: currentActor.id,
			role: currentActor.role,
		} as AuthEnv["Variables"]["user"]);
		await next();
	};

	const testApp = new Hono()
		.onError(errorHandler)
		.route(
			"/api/media",
			createMediaRoute({ service: svc, authMiddleware: mockAuth }),
		);

	// Valid merchandiser request -> 200
	const okRes = await testApp.request("/api/media/upload-signature", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			purpose: "product",
			categorySlug: "knitwear",
			fileName: "cashmere-knit.webp",
			mimeType: "image/webp",
			fileSize: 1_200_000,
		}),
	});
	assert.equal(okRes.status, 200);
	const okJson = (await okRes.json()) as {
		folder: string;
		signature: string;
		token: string;
		expire: number;
	};
	assert.equal(okJson.folder, "/products/knitwear/");
	assert.match(okJson.signature, /^[0-9a-f]{40}$/);

	// Invalid file size (>5MB) -> 400
	const badSizeRes = await testApp.request("/api/media/upload-signature", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			purpose: "product",
			categorySlug: "knitwear",
			fileName: "cashmere-knit.webp",
			mimeType: "image/webp",
			fileSize: MAX_IMAGE_SIZE_BYTES + 100,
		}),
	});
	assert.equal(badSizeRes.status, 400);

	// Customer attempting product upload -> 403
	currentActor = { id: "cust-1", role: "customer" };
	const forbiddenRes = await testApp.request("/api/media/upload-signature", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			purpose: "product",
			categorySlug: "knitwear",
			fileName: "cashmere-knit.webp",
			mimeType: "image/webp",
			fileSize: 100_000,
		}),
	});
	assert.equal(forbiddenRes.status, 403);

	// Typed testClient check on real AppType shape
	const tClient = testClient<AppType>(app);
	assert.equal(typeof tClient.api.media["upload-signature"].$post, "function");
});
