import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { z } from "zod";
import type {
	categories,
	collections,
	products,
	productVariants,
	sizeGuides,
	stockMovements,
} from "@/db/schema/catalog";
import {
	toAdminCatalogFilter,
	validateAdminProductsSearch,
} from "@/lib/params/admin-products";
import { zodValidator } from "@/server/middleware/validate";
import {
	adminCatalogFilterSchema,
	adminProductStatusUpdateSchema,
	catalogFilterSchema,
	categoryInputSchema,
	categoryUpdateSchema,
	collectionInputSchema,
	type ProductInput,
	type ProductVariantInput,
	productAdminUpdateSchema,
	productInputSchema,
	productUpdateSchema,
	productVariantSchema,
	type SizeGuideInput,
	sizeGuideInputSchema,
	skuAvailabilityQuerySchema,
} from "@/shared/schemas/catalog";
import {
	inventoryFilterSchema,
	stockAdjustmentSchema,
	stockMovementCreateSchema,
	stockMovementFilterSchema,
} from "@/shared/schemas/inventory";

const VALID_CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
const VALID_SIZE_GUIDE_ID = "22222222-2222-4222-8222-222222222222";
const VALID_COLLECTION_ID = "33333333-3333-4333-8333-333333333333";
const VALID_VARIANT_ID = "44444444-4444-4444-8444-444444444444";

function makeValidVariant(
	overrides: Partial<ProductVariantInput> = {},
): ProductVariantInput {
	return {
		sku: "NOC-COAT-BLK-M",
		colorName: "Obsidian Black",
		colorHex: "#1A1A1A",
		sizeLabel: "M",
		sizeSortOrder: 2,
		priceIdr: 1_850_000,
		compareAtPriceIdr: 2_100_000,
		stockQuantity: 15,
		weightGrams: 950,
		lengthCm: 40,
		widthCm: 32,
		heightCm: 8,
		isActive: true,
		...overrides,
	};
}

function makeValidProduct(overrides: Partial<ProductInput> = {}): ProductInput {
	return {
		categoryId: VALID_CATEGORY_ID,
		sizeGuideId: VALID_SIZE_GUIDE_ID,
		parentSku: "NOC-WOOL-COAT-01",
		name: "Tailored Virgin Wool Overcoat",
		slug: "tailored-virgin-wool-overcoat",
		brand: "Noctura",
		description: "Double-breasted structured overcoat in brushed virgin wool.",
		genderAudience: "unisex",
		materialComposition: "80% Virgin Wool, 20% Cashmere",
		careInstructions: "Dry clean only.",
		fitType: "Relaxed Fit",
		basePriceIdr: 1_850_000,
		status: "published",
		collectionIds: [VALID_COLLECTION_ID],
		media: [
			{
				url: "https://ik.imagekit.io/noctura/products/outerwear/coat-black.webp",
				altText: "Tailored Virgin Wool Overcoat in Obsidian Black",
				colorName: "Obsidian Black",
				isPrimary: true,
				mediaType: "image",
				sortOrder: 0,
			},
		],
		variants: [
			makeValidVariant(),
			makeValidVariant({
				sku: "NOC-COAT-BLK-L",
				sizeLabel: "L",
				sizeSortOrder: 3,
			}),
		],
		...overrides,
	};
}

test("categoryInputSchema and collectionInputSchema enforce slugs, defaults, and date range invariants", () => {
	const catParsed = categoryInputSchema.safeParse({
		name: "  Outerwear & Coats ",
		slug: "outerwear-coats",
	});
	assert.equal(catParsed.success, true);
	if (catParsed.success) {
		assert.equal(catParsed.data.name, "Outerwear & Coats");
		assert.equal(catParsed.data.sortOrder, 0);
		assert.equal(catParsed.data.isActive, true);

		// Compile-time check: parsed output maps cleanly to Drizzle category insert
		const dbCategoryInsert: typeof categories.$inferInsert = {
			name: catParsed.data.name,
			slug: catParsed.data.slug,
			description: catParsed.data.description,
			imageUrl: catParsed.data.imageUrl,
			parentId: catParsed.data.parentId,
			sortOrder: catParsed.data.sortOrder,
			isActive: catParsed.data.isActive,
		};
		assert.equal(dbCategoryInsert.slug, "outerwear-coats");
	}

	const badSlug = categoryInputSchema.safeParse({
		name: "Outerwear",
		slug: "Outerwear_Coats!",
	});
	assert.equal(badSlug.success, false);

	const partialCat = categoryUpdateSchema.safeParse({ isActive: false });
	assert.equal(partialCat.success, true);

	const validColl = collectionInputSchema.safeParse({
		name: "Raya 2027",
		slug: "raya-2027",
		startsAt: "2027-03-01T00:00:00Z",
		endsAt: "2027-04-30T23:59:59Z",
	});
	assert.equal(validColl.success, true);
	if (validColl.success) {
		const dbCollectionInsert: Omit<
			typeof collections.$inferInsert,
			"startsAt" | "endsAt"
		> = {
			name: validColl.data.name,
			slug: validColl.data.slug,
			subtitle: validColl.data.subtitle,
			bannerUrl: validColl.data.bannerUrl,
			isActive: validColl.data.isActive,
		};
		assert.equal(dbCollectionInsert.slug, "raya-2027");
	}

	const invalidDateRange = collectionInputSchema.safeParse({
		name: "Raya 2027",
		slug: "raya-2027",
		startsAt: "2027-04-30T00:00:00Z",
		endsAt: "2027-03-01T00:00:00Z",
	});
	assert.equal(invalidDateRange.success, false);
	if (!invalidDateRange.success) {
		const flat = z.flattenError(invalidDateRange.error);
		assert.ok(flat.fieldErrors.endsAt);
	}
});

test("sizeGuideInputSchema matches Drizzle SizeGuideMatrix and rejects duplicate sizes", () => {
	const validGuide: SizeGuideInput = {
		name: "Unisex Coat Size Guide",
		garmentType: "outerwear",
		measurementsJson: {
			unit: "cm",
			rows: [
				{
					size: "S",
					chestWidthCm: 54,
					bodyLengthCm: 108,
					shoulderWidthCm: 46,
				},
				{
					size: "M",
					chestWidthCm: 57,
					bodyLengthCm: 111,
					shoulderWidthCm: 48,
				},
			],
		},
		modelNote: "Model is 182 cm wearing size M.",
	};

	const parsed = sizeGuideInputSchema.safeParse(validGuide);
	assert.equal(parsed.success, true);
	if (parsed.success) {
		const dbSizeGuideInsert: typeof sizeGuides.$inferInsert = {
			name: parsed.data.name,
			garmentType: parsed.data.garmentType,
			measurementsJson: parsed.data.measurementsJson,
			modelNote: parsed.data.modelNote,
		};
		assert.equal(dbSizeGuideInsert.measurementsJson.rows.length, 2);
	}

	const duplicateSize = sizeGuideInputSchema.safeParse({
		name: "Dup Guide",
		garmentType: "tops",
		measurementsJson: {
			unit: "cm",
			rows: [
				{ size: "M", chestWidthCm: 52 },
				{ size: "m", chestWidthCm: 54 },
			],
		},
	});
	assert.equal(duplicateSize.success, false);
});

test("productVariantSchema validates SKU bounds, colorHex, integer IDR/dimensions, and compareAtPrice", () => {
	const valid = productVariantSchema.safeParse(makeValidVariant());
	assert.equal(valid.success, true);

	// Boundary minimum values pass
	const boundaryMin = productVariantSchema.safeParse({
		sku: "ABC",
		colorName: "Iv",
		colorHex: "#ffffff",
		sizeLabel: "28",
		priceIdr: 1,
		stockQuantity: 0,
		weightGrams: 1,
		lengthCm: 1,
		widthCm: 1,
		heightCm: 1,
	});
	assert.equal(boundaryMin.success, true);
	if (boundaryMin.success) {
		const dbVariantInsert: typeof productVariants.$inferInsert = {
			productId: VALID_CATEGORY_ID,
			...boundaryMin.data,
		};
		assert.equal(dbVariantInsert.stockQuantity, 0);
	}

	// Short SKU (< 3 chars) rejected
	assert.equal(
		productVariantSchema.safeParse(makeValidVariant({ sku: "AB" })).success,
		false,
	);

	// Invalid colorHex rejected
	assert.equal(
		productVariantSchema.safeParse(makeValidVariant({ colorHex: "1A1A1A" }))
			.success,
		false,
	);
	assert.equal(
		productVariantSchema.safeParse(makeValidVariant({ colorHex: "#GGG000" }))
			.success,
		false,
	);

	// Non-integer price or 0 weight rejected
	assert.equal(
		productVariantSchema.safeParse(makeValidVariant({ priceIdr: 100.5 }))
			.success,
		false,
	);
	assert.equal(
		productVariantSchema.safeParse(makeValidVariant({ weightGrams: 0 }))
			.success,
		false,
	);

	// compareAtPriceIdr lower than priceIdr rejected
	const badComparePrice = productVariantSchema.safeParse(
		makeValidVariant({ priceIdr: 500_000, compareAtPriceIdr: 450_000 }),
	);
	assert.equal(badComparePrice.success, false);
});

test("productInputSchema enforces uniqueness of SKUs and (colorName, sizeLabel) pairs", () => {
	const valid = productInputSchema.safeParse(makeValidProduct());
	assert.equal(valid.success, true);
	if (valid.success) {
		const dbProductInsert: typeof products.$inferInsert = {
			categoryId: valid.data.categoryId,
			sizeGuideId: valid.data.sizeGuideId,
			parentSku: valid.data.parentSku,
			name: valid.data.name,
			slug: valid.data.slug,
			brand: valid.data.brand,
			description: valid.data.description,
			genderAudience: valid.data.genderAudience,
			materialComposition: valid.data.materialComposition,
			careInstructions: valid.data.careInstructions,
			fitType: valid.data.fitType,
			basePriceIdr: valid.data.basePriceIdr,
			status: valid.data.status,
		};
		assert.equal(dbProductInsert.brand, "Noctura");
	}

	// Duplicate SKU across variants rejected (case-insensitive)
	const dupSku = productInputSchema.safeParse(
		makeValidProduct({
			variants: [
				makeValidVariant({ sku: "NOC-COAT-BLK-M", sizeLabel: "M" }),
				makeValidVariant({ sku: "noc-coat-blk-m", sizeLabel: "L" }),
			],
		}),
	);
	assert.equal(dupSku.success, false);

	// Duplicate (colorName, sizeLabel) pair rejected
	const dupColorSize = productInputSchema.safeParse(
		makeValidProduct({
			variants: [
				makeValidVariant({
					sku: "NOC-COAT-1",
					colorName: "Sage",
					sizeLabel: "M",
				}),
				makeValidVariant({
					sku: "NOC-COAT-2",
					colorName: "sage",
					sizeLabel: "m",
				}),
			],
		}),
	);
	assert.equal(dupColorSize.success, false);

	// Empty variants rejected
	assert.equal(
		productInputSchema.safeParse(makeValidProduct({ variants: [] })).success,
		false,
	);

	// Partial product update works cleanly
	assert.equal(
		productUpdateSchema.safeParse({ status: "archived" }).success,
		true,
	);
});

test("catalogFilterSchema normalizes query strings, arrays, stringbools, defaults, and price bounds", () => {
	const defaults = catalogFilterSchema.safeParse({});
	assert.equal(defaults.success, true);
	if (defaults.success) {
		assert.equal(defaults.data.sort, "newest");
		assert.equal(defaults.data.page, 1);
		assert.equal(defaults.data.limit, 24);
	}

	// Single string & comma-separated arrays + stringbool
	const fromRawQuery = catalogFilterSchema.safeParse({
		category: "outerwear",
		size: "M",
		color: "Obsidian Black, Sage",
		minPrice: "150000",
		maxPrice: "2500000",
		inStock: "true",
		sort: "price_asc",
		page: "2",
		limit: "12",
	});
	assert.equal(fromRawQuery.success, true);
	if (fromRawQuery.success) {
		assert.deepEqual(fromRawQuery.data.size, ["M"]);
		assert.deepEqual(fromRawQuery.data.color, ["Obsidian Black", "Sage"]);
		assert.equal(fromRawQuery.data.minPrice, 150_000);
		assert.equal(fromRawQuery.data.maxPrice, 2_500_000);
		assert.equal(fromRawQuery.data.inStock, true);
		assert.equal(fromRawQuery.data.page, 2);
		assert.equal(fromRawQuery.data.limit, 12);
	}

	// Native boolean & string array (from TanStack Router JSON search params)
	const fromRouterSearch = catalogFilterSchema.safeParse({
		size: ["S", "M"],
		inStock: false,
		minPrice: "",
		page: "",
		limit: "",
	});
	assert.equal(fromRouterSearch.success, true);
	if (fromRouterSearch.success) {
		assert.deepEqual(fromRouterSearch.data.size, ["S", "M"]);
		assert.equal(fromRouterSearch.data.inStock, false);
		assert.equal(fromRouterSearch.data.minPrice, undefined);
		assert.equal(fromRouterSearch.data.page, 1);
		assert.equal(fromRouterSearch.data.limit, 24);
	}

	// Rejects invalid stringbool, out-of-range limit, and minPrice > maxPrice
	assert.equal(
		catalogFilterSchema.safeParse({ inStock: "maybe" }).success,
		false,
	);
	assert.equal(catalogFilterSchema.safeParse({ limit: "250" }).success, false);
	assert.equal(
		catalogFilterSchema.safeParse({ minPrice: 500_000, maxPrice: 200_000 })
			.success,
		false,
	);
});

test("inventory schemas validate stock adjustments, ledger entries, and filters", () => {
	const validRestock = stockAdjustmentSchema.safeParse({
		variantId: VALID_VARIANT_ID,
		movementType: "restock",
		quantityDelta: 20,
		notes: "Restock shipment from Bandung atelier",
	});
	assert.equal(validRestock.success, true);

	// Negative delta allowed on manual_adjust
	const validManualNeg = stockAdjustmentSchema.safeParse({
		variantId: VALID_VARIANT_ID,
		movementType: "manual_adjust",
		quantityDelta: -2,
		notes: "Damaged during warehouse inspection",
	});
	assert.equal(validManualNeg.success, true);

	// Zero delta rejected
	assert.equal(
		stockAdjustmentSchema.safeParse({
			variantId: VALID_VARIANT_ID,
			movementType: "manual_adjust",
			quantityDelta: 0,
			notes: "No change",
		}).success,
		false,
	);

	// Negative delta rejected for restock & return_restock
	assert.equal(
		stockAdjustmentSchema.safeParse({
			variantId: VALID_VARIANT_ID,
			movementType: "restock",
			quantityDelta: -5,
			notes: "Invalid negative restock",
		}).success,
		false,
	);
	assert.equal(
		stockAdjustmentSchema.safeParse({
			variantId: VALID_VARIANT_ID,
			movementType: "return_restock",
			quantityDelta: -1,
			notes: "Invalid negative return restock",
		}).success,
		false,
	);

	// Ledger entry aligns with Drizzle stockMovements insert
	const ledgerParsed = stockMovementCreateSchema.safeParse({
		variantId: VALID_VARIANT_ID,
		movementType: "reserve",
		quantityDelta: -1,
		referenceType: "order",
		referenceId: VALID_CATEGORY_ID,
		notes: "Reserved at checkout",
	});
	assert.equal(ledgerParsed.success, true);
	if (ledgerParsed.success) {
		const dbMovementInsert: typeof stockMovements.$inferInsert =
			ledgerParsed.data;
		assert.equal(dbMovementInsert.movementType, "reserve");
	}

	// Filters default cleanly
	const invFilter = inventoryFilterSchema.safeParse({});
	assert.equal(invFilter.success, true);
	if (invFilter.success) {
		assert.equal(invFilter.data.stockStatus, "all");
		assert.equal(invFilter.data.page, 1);
		assert.equal(invFilter.data.limit, 25);
	}

	const movFilter = stockMovementFilterSchema.safeParse({
		variantId: VALID_VARIANT_ID,
		movementType: "commit",
	});
	assert.equal(movFilter.success, true);
});

test("zodValidator integrates seamlessly with catalog & inventory schemas in Hono", async () => {
	const testApp = new Hono()
		.get("/products", zodValidator("query", catalogFilterSchema), (c) => {
			return c.json(c.req.valid("query"), 200);
		})
		.post("/admin/products", zodValidator("json", productInputSchema), (c) => {
			return c.json({ ok: true, product: c.req.valid("json") }, 201);
		})
		.patch(
			"/admin/inventory/adjust",
			zodValidator("json", stockAdjustmentSchema),
			(c) => {
				return c.json({ ok: true, adjustment: c.req.valid("json") }, 200);
			},
		);

	// Single query param ?size=M and repeated ?color=Black&color=Sage
	const queryRes = await testApp.request(
		"/products?size=M&color=Black&color=Sage&inStock=true&page=2",
	);
	assert.equal(queryRes.status, 200);
	const queryJson = (await queryRes.json()) as {
		size?: string[];
		color?: string[];
		inStock?: boolean;
		page: number;
		sort: string;
	};
	assert.deepEqual(queryJson.size, ["M"]);
	assert.deepEqual(queryJson.color, ["Black", "Sage"]);
	assert.equal(queryJson.inStock, true);
	assert.equal(queryJson.page, 2);
	assert.equal(queryJson.sort, "newest");

	// Valid product JSON payload
	const validProdRes = await testApp.request("/admin/products", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(makeValidProduct()),
	});
	assert.equal(validProdRes.status, 201);

	// Invalid product payload returns 400 VALIDATION_ERROR
	const badProdRes = await testApp.request("/admin/products", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "x" }),
	});
	assert.equal(badProdRes.status, 400);

	// Valid stock adjustment
	const adjRes = await testApp.request("/admin/inventory/adjust", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			variantId: VALID_VARIANT_ID,
			movementType: "restock",
			quantityDelta: 10,
			notes: "Restock batch #12",
		}),
	});
	assert.equal(adjRes.status, 200);
});

test("admin catalog schemas validate filters, status updates, SKU checks, and variant IDs", () => {
	const defaultFilter = adminCatalogFilterSchema.parse({});
	assert.equal(defaultFilter.sort, "updated_desc");
	assert.equal(defaultFilter.page, 1);
	assert.equal(defaultFilter.limit, 20);

	const filtered = adminCatalogFilterSchema.parse({
		search: "blazer",
		status: "draft",
		sort: "stock_asc",
		page: "3",
		limit: "50",
	});
	assert.equal(filtered.status, "draft");
	assert.equal(filtered.sort, "stock_asc");
	assert.equal(filtered.page, 3);
	assert.equal(filtered.limit, 50);

	const emptyStatus = adminCatalogFilterSchema.parse({ status: "" });
	assert.equal(emptyStatus.status, undefined);

	assert.equal(
		adminProductStatusUpdateSchema.safeParse({ status: "archived" }).success,
		true,
	);
	assert.equal(
		skuAvailabilityQuerySchema.safeParse({
			sku: "NOC-01-M",
			excludeProductId: VALID_CATEGORY_ID,
		}).success,
		true,
	);

	const validUpdate = productAdminUpdateSchema.safeParse({
		...makeValidProduct(),
		variants: [
			{
				...makeValidProduct().variants[0],
				id: VALID_VARIANT_ID,
			},
		],
	});
	assert.equal(validUpdate.success, true);
});

test("nuqs admin-products params schema parses, omits defaults, and normalizes filters", async () => {
	const emptyResult = await validateAdminProductsSearch["~standard"].validate(
		{},
	);
	assert.equal("value" in emptyResult, true);
	if ("value" in emptyResult) {
		assert.deepEqual(emptyResult.value, {});
		assert.deepEqual(toAdminCatalogFilter(emptyResult.value), {
			search: undefined,
			category: undefined,
			status: undefined,
			sort: "updated_desc",
			page: 1,
			limit: 20,
		});
	}

	const populatedResult = await validateAdminProductsSearch[
		"~standard"
	].validate({
		search: " blazer ",
		category: "outerwear",
		status: "draft",
		sort: "price_asc",
		page: "2",
		limit: "50",
	});
	assert.equal("value" in populatedResult, true);
	if ("value" in populatedResult) {
		assert.deepEqual(toAdminCatalogFilter(populatedResult.value), {
			search: "blazer",
			category: "outerwear",
			status: "draft",
			sort: "price_asc",
			page: 2,
			limit: 50,
		});
	}

	// Out-of-bounds page & limit clamp cleanly
	assert.deepEqual(toAdminCatalogFilter({ page: -3, limit: 500 }), {
		search: undefined,
		category: undefined,
		status: undefined,
		sort: "updated_desc",
		page: 1,
		limit: 100,
	});
});
