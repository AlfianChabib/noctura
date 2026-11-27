import assert from "node:assert/strict";
import test from "node:test";
import {
	buildActiveFilterChips,
	countActiveStorefrontFilters,
	toStorefrontCatalogFilter,
	validateStorefrontProductsSearch,
} from "@/lib/params/catalog-products";

test("validateStorefrontProductsSearch parses nuqs query params and falls back safely on invalid values", () => {
	const parsed = validateStorefrontProductsSearch({
		search: "wool coat",
		category: "outerwear",
		genderAudience: "women",
		size: "S,M",
		color: ["Obsidian Black", "Sage"],
		minPrice: "500000",
		maxPrice: "2500000",
		inStock: "true",
		sort: "price_asc",
		page: "2",
		limit: "24",
	});

	const filter = toStorefrontCatalogFilter(parsed);
	assert.equal(filter.search, "wool coat");
	assert.equal(filter.category, "outerwear");
	assert.equal(filter.genderAudience, "women");
	assert.deepEqual(filter.size, ["S", "M"]);
	assert.deepEqual(filter.color, ["Obsidian Black", "Sage"]);
	assert.equal(filter.minPrice, 500_000);
	assert.equal(filter.maxPrice, 2_500_000);
	assert.equal(filter.inStock, true);
	assert.equal(filter.sort, "price_asc");
	assert.equal(filter.page, 2);
	assert.equal(filter.limit, 24);

	// Malformed URL params degrade cleanly without throwing
	const malformed = validateStorefrontProductsSearch({
		genderAudience: "aliens",
		minPrice: "not-a-number",
		maxPrice: "-100",
		inStock: "maybe",
		sort: "bogus",
		page: "abc",
		limit: "500",
	});
	const safeFilter = toStorefrontCatalogFilter(malformed);
	assert.equal(safeFilter.genderAudience, undefined);
	assert.equal(safeFilter.minPrice, undefined);
	assert.equal(safeFilter.maxPrice, undefined);
	assert.equal(safeFilter.inStock, undefined);
	assert.equal(safeFilter.sort, "newest");
	assert.equal(safeFilter.page, 1);
	assert.equal(safeFilter.limit, 100);
});

test("toStorefrontCatalogFilter normalizes swapped prices, empty strings, duplicate facets, and out-of-range pagination", () => {
	const filter = toStorefrontCatalogFilter({
		search: "   ",
		category: "",
		collection: "   ",
		size: ["M", "m", "L", ""],
		color: ["Black", "black"],
		minPrice: 2_500_000,
		maxPrice: 900_000,
		inStock: false,
		page: -3,
		limit: 999,
	});

	assert.equal(filter.search, undefined);
	assert.equal(filter.category, undefined);
	assert.equal(filter.collection, undefined);
	assert.deepEqual(filter.size, ["M", "L"]);
	assert.deepEqual(filter.color, ["Black"]);
	assert.equal(filter.minPrice, 900_000);
	assert.equal(filter.maxPrice, 2_500_000);
	assert.equal(filter.inStock, undefined);
	assert.equal(filter.page, 1);
	assert.equal(filter.limit, 100);
});

test("buildActiveFilterChips and countActiveStorefrontFilters reflect active URL facets accurately", () => {
	const state = {
		search: "trench",
		category: "outerwear",
		collection: "",
		genderAudience: "women" as const,
		size: ["M", "L"],
		color: ["Sage"],
		minPrice: 500_000,
		maxPrice: null,
		inStock: true,
		sort: "newest" as const,
		page: 1,
		limit: 24,
	};

	const chips = buildActiveFilterChips(state, {
		categoryNameBySlug: new Map([["outerwear", "Outerwear"]]),
	});

	assert.equal(countActiveStorefrontFilters(state), 8);
	assert.equal(chips.length, 8);
	assert.equal(chips.find((c) => c.kind === "category")?.label, "Outerwear");
	assert.equal(chips.find((c) => c.kind === "genderAudience")?.label, "Women");
	assert.equal(chips.find((c) => c.kind === "inStock")?.label, "Ready Stock");
});
