import assert from "node:assert/strict";
import test from "node:test";
import {
	applyBatchToVariants,
	buildVariantSku,
	generateVariantMatrix,
	PRESET_COLORS,
	PRESET_SIZES,
	slugifyText,
	suggestParentSku,
} from "@/lib/admin/variant-matrix";

test("TASK-204: slugifyText and suggestParentSku generate clean identifiers", () => {
	assert.equal(
		slugifyText("Double-Breasted Merino Wool Blazer!"),
		"double-breasted-merino-wool-blazer",
	);
	assert.equal(
		suggestParentSku("Double Breasted Merino Blazer"),
		"NOC-DOUB-BREA-MERI",
	);
	assert.equal(
		buildVariantSku("NOC-MERINO-01", "Midnight Navy", "XL"),
		"NOC-MERINO-01-MIDNIGHT-NAV-XL",
	);
});

test("TASK-204: generateVariantMatrix generates 30+ unique SKU combinations and preserves existing edits", () => {
	const colors = PRESET_COLORS.slice(0, 5); // 5 colors
	const sizes = PRESET_SIZES.slice(0, 6); // 6 sizes -> 30 combinations

	const firstPass = generateVariantMatrix({
		parentSku: "NOC-COAT-01",
		basePriceIdr: 890_000,
		colors,
		sizes,
		existingVariants: [],
	});

	assert.equal(firstPass.length, 30);

	const uniqueSkus = new Set(firstPass.map((v) => v.sku));
	assert.equal(uniqueSkus.size, 30);

	// Simulate user editing the first variant's price, SKU, stock, and existing DB id
	const editedFirst = {
		...firstPass[0],
		id: "11111111-1111-4111-8111-111111111111",
		sku: "CUSTOM-COAT-OBS-XS",
		priceIdr: 950_000,
		stockQuantity: 42,
	};

	const regenerated = generateVariantMatrix({
		parentSku: "NOC-COAT-01",
		basePriceIdr: 890_000,
		colors,
		sizes: [...sizes, "28"], // 5 * 7 = 35 variants
		existingVariants: [editedFirst, ...firstPass.slice(1)],
	});

	assert.equal(regenerated.length, 35);
	assert.equal(regenerated[0].id, "11111111-1111-4111-8111-111111111111");
	assert.equal(regenerated[0].sku, "CUSTOM-COAT-OBS-XS");
	assert.equal(regenerated[0].priceIdr, 950_000);
	assert.equal(regenerated[0].stockQuantity, 42);
});

test("TASK-204: applyBatchToVariants applies price and weight across all matrix rows", () => {
	const base = generateVariantMatrix({
		parentSku: "NOC-SHIRT-01",
		basePriceIdr: 450_000,
		colors: PRESET_COLORS.slice(0, 2),
		sizes: ["S", "M", "L"],
		existingVariants: [],
	});

	const updated = applyBatchToVariants(base, {
		priceIdr: 520_000,
		compareAtPriceIdr: 650_000,
		weightGrams: 420,
		lengthCm: 35,
		widthCm: 25,
		heightCm: 5,
	});

	assert.equal(updated.length, 6);
	for (const row of updated) {
		assert.equal(row.priceIdr, 520_000);
		assert.equal(row.compareAtPriceIdr, 650_000);
		assert.equal(row.weightGrams, 420);
		assert.equal(row.lengthCm, 35);
		assert.equal(row.widthCm, 25);
		assert.equal(row.heightCm, 5);
		assert.equal(row.stockQuantity, 10);
	}
});
