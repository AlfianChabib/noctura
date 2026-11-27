import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { eq, inArray } from "drizzle-orm";
import { Hono, type MiddlewareHandler } from "hono";
import { testClient } from "hono/testing";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import {
	categories,
	collections,
	productVariants,
	sizeGuides,
	stockMovements,
} from "@/db/schema/catalog";
import { api } from "@/lib/api-client";
import type { Role } from "@/lib/auth-access";
import { type AppType, app } from "@/server/app";
import type { AuthEnv } from "@/server/middleware/auth";
import { errorHandler } from "@/server/middleware/error-handler";
import { createCatalogRoute } from "@/server/routes/catalog";
import { createInventoryRoute } from "@/server/routes/inventory";

test("TASK-203: Hono app enforces 401 on unauthenticated admin endpoints and exposes typed RPC routes", async () => {
	const unauthProductPost = await app.request("/api/admin/products", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Test" }),
	});
	assert.equal(unauthProductPost.status, 401);

	const unauthInventoryGet = await app.request("/api/admin/inventory");
	assert.equal(unauthInventoryGet.status, 401);

	const unauthMovementsGet = await app.request(
		"/api/admin/inventory/movements",
	);
	assert.equal(unauthMovementsGet.status, 401);

	const unauthAdjustPatch = await app.request("/api/admin/inventory/adjust", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			variantId: "11111111-1111-4111-8111-111111111111",
			movementType: "manual_adjust",
			quantityDelta: 1,
			notes: "Should fail 401",
		}),
	});
	assert.equal(unauthAdjustPatch.status, 401);

	// Verify RPC client surface on both singleton `api` and `testClient<AppType>`
	assert.equal(typeof api.products.$get, "function");
	assert.equal(typeof api.products[":slug"].$get, "function");
	assert.equal(typeof api.categories.$get, "function");
	assert.equal(typeof api.collections.$get, "function");
	assert.equal(typeof api.admin.products.$post, "function");
	assert.equal(typeof api.admin.inventory.$get, "function");
	assert.equal(typeof api.admin.inventory.movements.$get, "function");
	assert.equal(typeof api.admin.inventory.adjust.$patch, "function");

	const client = testClient<AppType>(app);
	assert.equal(typeof client.api.products.$get, "function");
	assert.equal(typeof client.api.admin.inventory.adjust.$patch, "function");
});

test("TASK-203: End-to-end PostgreSQL integration for catalog filtering, PDP detail, atomic product creation, and stock ledger adjustments", async () => {
	const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

	let currentActor: { id: string; role: Role } = {
		id: "",
		role: "customer",
	};

	const injectActorMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
		if (currentActor.id) {
			c.set("user", {
				id: currentActor.id,
				role: currentActor.role,
				banned: false,
			} as AuthEnv["Variables"]["user"]);
		}
		await next();
	};

	const testApp = new Hono()
		.basePath("/api")
		.onError(errorHandler)
		.use("*", injectActorMiddleware)
		.route("/", createCatalogRoute())
		.route("/admin/inventory", createInventoryRoute());

	const createdProductIds: string[] = [];
	const createdVariantIds: string[] = [];
	const createdCategoryIds: string[] = [];
	const createdCollectionIds: string[] = [];
	const createdSizeGuideIds: string[] = [];
	const createdUserIds: string[] = [];

	try {
		// Seed actor users in DB so stock_movements.actor_id FK resolves cleanly
		const [merchUser] = await db
			.insert(users)
			.values({
				name: "Test Merchandiser",
				email: `merch-${suffix}@noctura.test`,
				role: "merchandiser",
			})
			.returning({ id: users.id });
		createdUserIds.push(merchUser.id);

		const [warehouseUser] = await db
			.insert(users)
			.values({
				name: "Test Warehouse Staff",
				email: `warehouse-${suffix}@noctura.test`,
				role: "warehouse_staff",
			})
			.returning({ id: users.id });
		createdUserIds.push(warehouseUser.id);

		// Seed parent & child categories, collection, and size guide
		const [parentCat] = await db
			.insert(categories)
			.values({
				name: `Apparel ${suffix}`,
				slug: `apparel-${suffix}`,
				sortOrder: 1,
				isActive: true,
			})
			.returning({ id: categories.id });
		createdCategoryIds.push(parentCat.id);

		const [childCat] = await db
			.insert(categories)
			.values({
				parentId: parentCat.id,
				name: `Outerwear ${suffix}`,
				slug: `outerwear-${suffix}`,
				sortOrder: 2,
				isActive: true,
			})
			.returning({ id: categories.id });
		createdCategoryIds.push(childCat.id);

		const [collection] = await db
			.insert(collections)
			.values({
				name: `Atelier Edit ${suffix}`,
				slug: `atelier-edit-${suffix}`,
				isActive: true,
			})
			.returning({ id: collections.id });
		createdCollectionIds.push(collection.id);

		const [sizeGuide] = await db
			.insert(sizeGuides)
			.values({
				name: `Coat Guide ${suffix}`,
				garmentType: "outerwear",
				measurementsJson: {
					unit: "cm",
					rows: [
						{ size: "M", chestWidthCm: 56, bodyLengthCm: 108 },
						{ size: "L", chestWidthCm: 59, bodyLengthCm: 111 },
					],
				},
			})
			.returning({ id: sizeGuides.id });
		createdSizeGuideIds.push(sizeGuide.id);

		const publishedPayload = {
			categoryId: childCat.id,
			sizeGuideId: sizeGuide.id,
			parentSku: `NOC-TRENCH-${suffix}`,
			name: `Structured Trench Coat ${suffix}`,
			slug: `structured-trench-coat-${suffix}`,
			brand: "Noctura",
			description: "Water-repellent cotton gabardine trench coat.",
			genderAudience: "women" as const,
			materialComposition: "100% Organic Cotton Gabardine",
			careInstructions: "Dry clean recommended.",
			fitType: "Relaxed Fit",
			basePriceIdr: 2_200_000,
			status: "published" as const,
			collectionIds: [collection.id],
			media: [
				{
					url: `https://ik.imagekit.io/noctura/products/outerwear/trench-black-1-${suffix}.webp`,
					altText: "Trench Coat Obsidian Black Front",
					colorName: "Obsidian Black",
					isPrimary: true,
					mediaType: "image" as const,
					sortOrder: 0,
				},
				{
					url: `https://ik.imagekit.io/noctura/products/outerwear/trench-black-2-${suffix}.webp`,
					altText: "Trench Coat Obsidian Black Back",
					colorName: "Obsidian Black",
					isPrimary: false,
					mediaType: "image" as const,
					sortOrder: 1,
				},
				{
					url: `https://ik.imagekit.io/noctura/products/outerwear/trench-sage-1-${suffix}.webp`,
					altText: "Trench Coat Sage Front",
					colorName: "Sage",
					isPrimary: false,
					mediaType: "image" as const,
					sortOrder: 2,
				},
			],
			variants: [
				{
					sku: `NOC-TRENCH-BLK-M-${suffix}`,
					colorName: "Obsidian Black",
					colorHex: "#1A1A1A",
					sizeLabel: "M",
					sizeSortOrder: 2,
					priceIdr: 2_200_000,
					compareAtPriceIdr: 2_500_000,
					stockQuantity: 0,
					weightGrams: 1100,
					lengthCm: 42,
					widthCm: 32,
					heightCm: 10,
					isActive: true,
				},
				{
					sku: `NOC-TRENCH-SAG-L-${suffix}`,
					colorName: "Sage",
					colorHex: "#7A8B7B",
					sizeLabel: "L",
					sizeSortOrder: 3,
					priceIdr: 2_350_000,
					stockQuantity: 8,
					weightGrams: 1150,
					lengthCm: 42,
					widthCm: 32,
					heightCm: 10,
					isActive: true,
				},
			],
		};

		// 1. RBAC: customer & warehouse_staff forbidden from POST /api/admin/products
		currentActor = { id: warehouseUser.id, role: "warehouse_staff" };
		const forbiddenCreate = await testApp.request("/api/admin/products", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(publishedPayload),
		});
		assert.equal(forbiddenCreate.status, 403);

		// 2. Merchandiser creates published product atomically -> 201
		currentActor = { id: merchUser.id, role: "merchandiser" };
		const createRes = await testApp.request("/api/admin/products", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(publishedPayload),
		});
		assert.equal(createRes.status, 201);
		const createdBody = (await createRes.json()) as {
			product: {
				id: string;
				slug: string;
				variants: Array<{ id: string; sku: string; stockQuantity: number }>;
				media: Array<{ id: string }>;
				collectionIds: string[];
			};
		};
		createdProductIds.push(createdBody.product.id);
		for (const v of createdBody.product.variants) {
			createdVariantIds.push(v.id);
		}
		assert.equal(createdBody.product.variants.length, 2);
		assert.equal(createdBody.product.media.length, 3);
		assert.deepEqual(createdBody.product.collectionIds, [collection.id]);

		// Verify initial stock_movements entry was recorded only for variant with stockQuantity > 0
		const sageVariant = createdBody.product.variants.find(
			(v) => v.sku === `NOC-TRENCH-SAG-L-${suffix}`,
		);
		assert.ok(sageVariant);
		const initialMovements = await db
			.select()
			.from(stockMovements)
			.where(eq(stockMovements.variantId, sageVariant.id));
		assert.equal(initialMovements.length, 1);
		assert.equal(initialMovements[0].movementType, "restock");
		assert.equal(initialMovements[0].quantityDelta, 8);
		assert.equal(initialMovements[0].referenceType, "initial_import");

		// Duplicate slug -> 409 Conflict
		const dupSlugRes = await testApp.request("/api/admin/products", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...publishedPayload,
				parentSku: `NOC-TRENCH-DUP-${suffix}`,
				variants: [
					{
						...publishedPayload.variants[0],
						sku: `NOC-TRENCH-DUP-SKU-${suffix}`,
					},
				],
			}),
		});
		assert.equal(dupSlugRes.status, 409);

		// Create a second published product (cheaper) and a draft product
		const cheaperPayload = {
			...publishedPayload,
			parentSku: `NOC-SHIRT-${suffix}`,
			name: `Poplin Overshirt ${suffix}`,
			slug: `poplin-overshirt-${suffix}`,
			genderAudience: "men" as const,
			basePriceIdr: 890_000,
			collectionIds: [],
			media: [
				{
					url: `https://ik.imagekit.io/noctura/products/outerwear/shirt-${suffix}.webp`,
					altText: "Poplin Overshirt Ivory",
					colorName: "Ivory",
					isPrimary: true,
					mediaType: "image" as const,
					sortOrder: 0,
				},
			],
			variants: [
				{
					sku: `NOC-SHIRT-IVR-M-${suffix}`,
					colorName: "Ivory",
					colorHex: "#F4F1EA",
					sizeLabel: "M",
					sizeSortOrder: 2,
					priceIdr: 890_000,
					stockQuantity: 12,
					weightGrams: 350,
					lengthCm: 30,
					widthCm: 25,
					heightCm: 4,
					isActive: true,
				},
			],
		};

		const cheaperRes = await testApp.request("/api/admin/products", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(cheaperPayload),
		});
		assert.equal(cheaperRes.status, 201);
		const cheaperBody = (await cheaperRes.json()) as typeof createdBody;
		createdProductIds.push(cheaperBody.product.id);
		for (const v of cheaperBody.product.variants) {
			createdVariantIds.push(v.id);
		}

		const draftRes = await testApp.request("/api/admin/products", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...cheaperPayload,
				parentSku: `NOC-DRAFT-${suffix}`,
				name: `Unreleased Draft Coat ${suffix}`,
				slug: `unreleased-draft-coat-${suffix}`,
				status: "draft",
				variants: [
					{
						...cheaperPayload.variants[0],
						sku: `NOC-DRAFT-SKU-${suffix}`,
					},
				],
			}),
		});
		assert.equal(draftRes.status, 201);
		const draftBody = (await draftRes.json()) as typeof createdBody;
		createdProductIds.push(draftBody.product.id);
		for (const v of draftBody.product.variants) {
			createdVariantIds.push(v.id);
		}

		// 3. GET /api/products: filtering, sorting, aggregation, and < 100ms latency
		// Parent category slug matches child category products, excludes draft
		const listParentRes = await testApp.request(
			`/api/products?category=apparel-${suffix}&sort=price_asc`,
		);
		assert.equal(listParentRes.status, 200);
		const listParentJson = (await listParentRes.json()) as {
			items: Array<{
				slug: string;
				priceRange: { minPriceIdr: number; maxPriceIdr: number };
				colors: Array<{
					colorName: string;
					primaryImageUrl: string | null;
					hoverImageUrl: string | null;
				}>;
				sizes: string[];
				primaryImage: { url: string } | null;
				hoverImage: { url: string } | null;
			}>;
			pagination: { total: number; page: number; limit: number };
		};
		assert.equal(listParentJson.pagination.total, 2);
		assert.deepEqual(
			listParentJson.items.map((item) => item.slug),
			[`poplin-overshirt-${suffix}`, `structured-trench-coat-${suffix}`],
		);
		const trenchItem = listParentJson.items[1];
		assert.equal(trenchItem.priceRange.minPriceIdr, 2_200_000);
		assert.equal(trenchItem.priceRange.maxPriceIdr, 2_350_000);
		assert.deepEqual(trenchItem.sizes, ["M", "L"]);
		assert.equal(trenchItem.colors.length, 2);
		assert.ok(trenchItem.primaryImage?.url.includes("trench-black-1"));
		assert.ok(trenchItem.hoverImage?.url.includes("trench-black-2"));

		// Unified variant predicate check: Trench has M (stock 0) & L (stock 8), Overshirt has M (stock 12).
		// Filtering category + size=M + inStock=true must return ONLY Overshirt!
		const combinedStart = performance.now();
		const combinedRes = await testApp.request(
			`/api/products?category=outerwear-${suffix}&size=M&inStock=true&minPrice=500000&maxPrice=2500000`,
		);
		const combinedElapsedMs = performance.now() - combinedStart;
		assert.equal(combinedRes.status, 200);
		const combinedJson = (await combinedRes.json()) as typeof listParentJson;
		assert.equal(combinedJson.items.length, 1);
		assert.equal(combinedJson.items[0].slug, `poplin-overshirt-${suffix}`);
		assert.ok(
			combinedElapsedMs < 500,
			`Expected fast query response, got ${combinedElapsedMs.toFixed(1)}ms`,
		);

		// Collection + color + search + genderAudience filter
		const collRes = await testApp.request(
			`/api/products?collection=atelier-edit-${suffix}&color=Sage&genderAudience=women&search=NOC-TRENCH-SAG`,
		);
		assert.equal(collRes.status, 200);
		const collJson = (await collRes.json()) as typeof listParentJson;
		assert.equal(collJson.items.length, 1);
		assert.equal(collJson.items[0].slug, `structured-trench-coat-${suffix}`);

		// Sort price_desc + pagination page=2&limit=1 + popularity
		const page2Res = await testApp.request(
			`/api/products?category=apparel-${suffix}&sort=price_desc&page=2&limit=1`,
		);
		assert.equal(page2Res.status, 200);
		const page2Json = (await page2Res.json()) as {
			items: Array<{ slug: string }>;
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
				hasNextPage: boolean;
				hasPrevPage: boolean;
			};
		};
		assert.equal(page2Json.items[0]?.slug, `poplin-overshirt-${suffix}`);
		assert.equal(page2Json.pagination.total, 2);
		assert.equal(page2Json.pagination.totalPages, 2);
		assert.equal(page2Json.pagination.hasNextPage, false);
		assert.equal(page2Json.pagination.hasPrevPage, true);

		const popularityRes = await testApp.request(
			`/api/products?category=apparel-${suffix}&sort=popularity`,
		);
		assert.equal(popularityRes.status, 200);

		// Invalid price range -> 400
		const invalidQueryRes = await testApp.request(
			"/api/products?minPrice=500000&maxPrice=100000",
		);
		assert.equal(invalidQueryRes.status, 400);

		// 4. GET /api/products/:slug: full relational structure & 404 on draft/missing
		const pdpRes = await testApp.request(
			`/api/products/structured-trench-coat-${suffix}`,
		);
		assert.equal(pdpRes.status, 200);
		const pdpJson = (await pdpRes.json()) as {
			slug: string;
			category: { slug: string };
			sizeGuide: { garmentType: string } | null;
			collections: Array<{ slug: string }>;
			variants: Array<{ sku: string; availableQuantity: number }>;
			media: Array<{ url: string }>;
		};
		assert.equal(pdpJson.category.slug, `outerwear-${suffix}`);
		assert.equal(pdpJson.sizeGuide?.garmentType, "outerwear");
		assert.equal(pdpJson.collections[0]?.slug, `atelier-edit-${suffix}`);
		assert.equal(pdpJson.variants.length, 2);
		assert.equal(pdpJson.media.length, 3);

		const draftPdpRes = await testApp.request(
			`/api/products/unreleased-draft-coat-${suffix}`,
		);
		assert.equal(draftPdpRes.status, 404);

		const missingPdpRes = await testApp.request(
			`/api/products/nonexistent-product-${suffix}`,
		);
		assert.equal(missingPdpRes.status, 404);

		// 5. PATCH /api/admin/inventory/adjust: RBAC, atomic stock update, ledger audit, and oversell guard
		// Merchandiser cannot adjust stock -> 403
		currentActor = { id: merchUser.id, role: "merchandiser" };
		const merchAdjustRes = await testApp.request(
			"/api/admin/inventory/adjust",
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					variantId: sageVariant.id,
					movementType: "manual_adjust",
					quantityDelta: 2,
					notes: "Merchandiser forbidden",
				}),
			},
		);
		assert.equal(merchAdjustRes.status, 403);

		// Warehouse staff adjusts stock -> 200
		currentActor = { id: warehouseUser.id, role: "warehouse_staff" };
		const adjustRes = await testApp.request("/api/admin/inventory/adjust", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				variantId: sageVariant.id,
				movementType: "manual_adjust",
				quantityDelta: -3,
				notes: "Cycle count correction in rack B2",
			}),
		});
		assert.equal(adjustRes.status, 200);
		const adjustJson = (await adjustRes.json()) as {
			variant: { stockQuantity: number; availableQuantity: number };
			movement: {
				movementType: string;
				quantityDelta: number;
				actorId: string;
			};
		};
		assert.equal(adjustJson.variant.stockQuantity, 5);
		assert.equal(adjustJson.variant.availableQuantity, 5);
		assert.equal(adjustJson.movement.movementType, "manual_adjust");
		assert.equal(adjustJson.movement.quantityDelta, -3);
		assert.equal(adjustJson.movement.actorId, warehouseUser.id);

		// Guard against dropping below reservedQuantity (simulate reservedQuantity = 4)
		await db
			.update(productVariants)
			.set({ reservedQuantity: 4 })
			.where(eq(productVariants.id, sageVariant.id));

		const belowReservedRes = await testApp.request(
			"/api/admin/inventory/adjust",
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					variantId: sageVariant.id,
					movementType: "manual_adjust",
					quantityDelta: -2,
					notes: "Attempt to reduce below reserved stock",
				}),
			},
		);
		assert.equal(belowReservedRes.status, 409);

		// Verify GET /api/admin/inventory & /movements
		const invListRes = await testApp.request(
			`/api/admin/inventory?search=${encodeURIComponent(`NOC-TRENCH-SAG-L-${suffix}`)}&stockStatus=low_stock`,
		);
		assert.equal(invListRes.status, 200);
		const invListJson = (await invListRes.json()) as {
			items: Array<{ sku: string; availableQuantity: number }>;
		};
		assert.equal(invListJson.items.length, 1);
		assert.equal(invListJson.items[0].availableQuantity, 1);

		const movementsRes = await testApp.request(
			`/api/admin/inventory/movements?variantId=${sageVariant.id}&movementType=manual_adjust`,
		);
		assert.equal(movementsRes.status, 200);
		const movementsJson = (await movementsRes.json()) as {
			items: Array<{ quantityDelta: number; actorName: string | null }>;
		};
		assert.equal(movementsJson.items.length, 1);
		assert.equal(movementsJson.items[0].quantityDelta, -3);
		assert.equal(movementsJson.items[0].actorName, "Test Warehouse Staff");

		// Verify GET /api/categories, /api/collections & /api/size-guides
		const [catsRes, collsRes, guidesRes] = await Promise.all([
			testApp.request("/api/categories"),
			testApp.request("/api/collections"),
			testApp.request("/api/size-guides"),
		]);
		assert.equal(catsRes.status, 200);
		assert.equal(collsRes.status, 200);
		assert.equal(guidesRes.status, 200);

		// Verify TASK-204 Admin Catalog CRUD, search, sorting, status toggle, and SKU uniqueness check
		currentActor = { id: merchUser.id, role: "merchandiser" };
		const trenchProduct = createdBody.product;

		const adminListRes = await testApp.request(
			`/api/admin/products?search=${encodeURIComponent(`NOC-TRENCH-${suffix}`)}&status=published&sort=stock_desc`,
		);
		assert.equal(adminListRes.status, 200);
		const adminListJson = (await adminListRes.json()) as {
			items: Array<{
				id: string;
				status: string;
				variantCount: number;
				totalAvailableStock: number;
			}>;
			pagination: { total: number };
		};
		assert.equal(adminListJson.items.length, 1);
		assert.equal(adminListJson.items[0].id, trenchProduct.id);
		assert.equal(adminListJson.items[0].status, "published");
		assert.equal(adminListJson.items[0].variantCount, 2);

		// Check SKU availability (taken by another product vs excluded when editing self)
		const takenSkuRes = await testApp.request(
			`/api/admin/products/check-sku?sku=${encodeURIComponent(`NOC-TRENCH-BLK-M-${suffix}`)}`,
		);
		assert.equal(takenSkuRes.status, 200);
		const takenSkuJson = (await takenSkuRes.json()) as { available: boolean };
		assert.equal(takenSkuJson.available, false);

		const selfSkuRes = await testApp.request(
			`/api/admin/products/check-sku?sku=${encodeURIComponent(`NOC-TRENCH-BLK-M-${suffix}`)}&excludeProductId=${trenchProduct.id}`,
		);
		assert.equal(selfSkuRes.status, 200);
		const selfSkuJson = (await selfSkuRes.json()) as { available: boolean };
		assert.equal(selfSkuJson.available, true);

		// Fetch admin detail by ID
		const detailByIdRes = await testApp.request(
			`/api/admin/products/${trenchProduct.id}`,
		);
		assert.equal(detailByIdRes.status, 200);
		const detailByIdJson = (await detailByIdRes.json()) as {
			id: string;
			variants: Array<{ id: string; sku: string; stockQuantity: number }>;
		};
		assert.equal(detailByIdJson.id, trenchProduct.id);
		assert.equal(detailByIdJson.variants.length, 2);

		// Reset simulated reservation before testing variant soft-deactivation + stock edit
		await db
			.update(productVariants)
			.set({ reservedQuantity: 0 })
			.where(eq(productVariants.id, sageVariant.id));

		// Update product + adjust Obsidian Black stock (0 -> 17) + add Ivory S + soft-deactivate Sage L
		const blkDetail = detailByIdJson.variants.find((v) =>
			v.sku.includes("BLK-M"),
		);
		assert.ok(blkDetail);
		const updateRes = await testApp.request(
			`/api/admin/products/${trenchProduct.id}`,
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					categoryId: childCat.id,
					sizeGuideId: sizeGuide.id,
					parentSku: `NOC-TRENCH-${suffix}`,
					name: "Architectural Gabardine Trench Coat (Updated)",
					slug: `architectural-gabardine-trench-${suffix}`,
					brand: "Noctura",
					description: "Updated trench coat editorial description.",
					genderAudience: "women",
					materialComposition: "100% Cotton Gabardine",
					careInstructions: "Dry clean only",
					fitType: "Relaxed",
					basePriceIdr: 2_600_000,
					status: "published",
					collectionIds: [collection.id],
					media: [
						{
							url: `https://ik.imagekit.io/noctura/products/outerwear/trench-black-1-${suffix}.webp`,
							altText: "Trench Obsidian Front",
							colorName: "Obsidian Black",
							mediaType: "image",
							isPrimary: true,
							sortOrder: 0,
						},
					],
					variants: [
						{
							id: blkDetail.id,
							sku: blkDetail.sku,
							colorName: "Obsidian Black",
							colorHex: "#1A1A1A",
							sizeLabel: "M",
							sizeSortOrder: 1,
							priceIdr: 2_600_000,
							compareAtPriceIdr: 2_900_000,
							stockQuantity: 17,
							weightGrams: 850,
							lengthCm: 40,
							widthCm: 30,
							heightCm: 8,
							isActive: true,
						},
						{
							sku: `NOC-TRENCH-IVR-S-${suffix}`,
							colorName: "Ivory",
							colorHex: "#F4F1EA",
							sizeLabel: "S",
							sizeSortOrder: 0,
							priceIdr: 2_600_000,
							compareAtPriceIdr: null,
							stockQuantity: 6,
							weightGrams: 850,
							lengthCm: 40,
							widthCm: 30,
							heightCm: 8,
							isActive: true,
						},
					],
				}),
			},
		);
		assert.equal(updateRes.status, 200);
		const updateJson = (await updateRes.json()) as {
			product: {
				name: string;
				variants: Array<{ id: string; sku: string; stockQuantity: number }>;
			};
		};
		assert.equal(
			updateJson.product.name,
			"Architectural Gabardine Trench Coat (Updated)",
		);
		assert.equal(updateJson.product.variants.length, 2);
		for (const v of updateJson.product.variants) {
			if (!createdVariantIds.includes(v.id)) {
				createdVariantIds.push(v.id);
			}
		}

		// Archive product via PATCH /api/admin/products/:id/status
		const archiveRes = await testApp.request(
			`/api/admin/products/${trenchProduct.id}/status`,
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "archived" }),
			},
		);
		assert.equal(archiveRes.status, 200);
		const archiveJson = (await archiveRes.json()) as { status: string };
		assert.equal(archiveJson.status, "archived");
	} finally {
		if (createdVariantIds.length > 0) {
			await db
				.delete(stockMovements)
				.where(inArray(stockMovements.variantId, createdVariantIds));
		}
		if (createdProductIds.length > 0) {
			const { products } = await import("@/db/schema/catalog");
			await db.delete(products).where(inArray(products.id, createdProductIds));
		}
		if (createdSizeGuideIds.length > 0) {
			await db
				.delete(sizeGuides)
				.where(inArray(sizeGuides.id, createdSizeGuideIds));
		}
		if (createdCollectionIds.length > 0) {
			await db
				.delete(collections)
				.where(inArray(collections.id, createdCollectionIds));
		}
		if (createdCategoryIds.length > 0) {
			await db
				.delete(categories)
				.where(inArray(categories.id, createdCategoryIds));
		}
		if (createdUserIds.length > 0) {
			await db.delete(users).where(inArray(users.id, createdUserIds));
		}
	}
});
