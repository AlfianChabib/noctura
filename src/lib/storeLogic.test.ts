import assert from "node:assert/strict";
import test from "node:test";
import { CATALOG_PRODUCTS } from "@/data/catalog";
import {
	addItemToBag,
	computeBagSummary,
	FREE_SHIPPING_THRESHOLD,
	filterAndSortProducts,
	filterAndSortProductsWithFacets,
	formatCurrency,
	formatLocalizedPrice,
	getProductMaterial,
	removeBagItem,
	STANDARD_SHIPPING_FEE,
	SUPPORTED_COUNTRIES,
	toggleWishlistId,
	updateBagItemQuantity,
} from "./storeLogic";
import { DESIGN_SYSTEM_RADIUS, HSL_TOKENS } from "./tokens";

test("design system tokens enforce zero border radius and complete light/dark pairs", () => {
	assert.equal(DESIGN_SYSTEM_RADIUS, "0rem");
	assert.ok(HSL_TOKENS.length >= 6);
	for (const token of HSL_TOKENS) {
		assert.ok(token.variable.startsWith("--"));
		assert.ok(token.lightHsl.length > 0);
		assert.ok(token.darkHsl.length > 0);
	}
});

test("filterAndSortProducts filters by category and search query accurately", () => {
	const outerwear = filterAndSortProducts(
		CATALOG_PRODUCTS,
		"Outerwear",
		"",
		"featured",
	);
	assert.equal(outerwear.length, 2);
	assert.ok(outerwear.every((p) => p.tags.includes("Outerwear")));

	const cashmereSearch = filterAndSortProducts(
		CATALOG_PRODUCTS,
		"All",
		"cashmere",
		"featured",
	);
	assert.equal(cashmereSearch.length, 1);
	assert.equal(cashmereSearch[0].id, "heavy-ribbed-cashmere-crewneck");

	const emptySearch = filterAndSortProducts(
		CATALOG_PRODUCTS,
		"All",
		"nonexistent-garment",
		"featured",
	);
	assert.equal(emptySearch.length, 0);
});

test("filterAndSortProducts sorts ascending and descending by price", () => {
	const asc = filterAndSortProducts(CATALOG_PRODUCTS, "All", "", "price-asc");
	for (let i = 1; i < asc.length; i++) {
		assert.ok(asc[i].price >= asc[i - 1].price);
	}

	const desc = filterAndSortProducts(CATALOG_PRODUCTS, "All", "", "price-desc");
	for (let i = 1; i < desc.length; i++) {
		assert.ok(desc[i].price <= desc[i - 1].price);
	}
});

test("shopping bag deduplicates matching variant SKU+color+size and keeps distinct variants separate", () => {
	const shirt = CATALOG_PRODUCTS.find(
		(p) => p.id === "architectural-poplin-shirt",
	);
	assert.ok(shirt, "shirt product should exist");
	let bag = addItemToBag([], shirt, "Optic White", "#FAFAFA", "M");
	bag = addItemToBag(bag, shirt, "Optic White", "#FAFAFA", "M");
	bag = addItemToBag(bag, shirt, "Optic White", "#FAFAFA", "L");

	assert.equal(bag.length, 2);
	assert.equal(bag[0].quantity, 2);
	assert.equal(bag[1].quantity, 1);

	const summary = computeBagSummary(bag);
	assert.equal(summary.itemCount, 3);
	assert.equal(summary.subtotal, 345);
	assert.equal(summary.shipping, 0);
	assert.equal(summary.total, 345);
});

test("shopping bag applies shipping fee below threshold and removes items at zero quantity", () => {
	const shirt = CATALOG_PRODUCTS.find(
		(p) => p.id === "architectural-poplin-shirt",
	);
	assert.ok(shirt, "shirt product should exist");
	let bag = addItemToBag([], shirt, "Optic White", "#FAFAFA", "S");

	const summaryBelow = computeBagSummary(bag);
	assert.equal(summaryBelow.subtotal, 115);
	assert.equal(summaryBelow.shipping, STANDARD_SHIPPING_FEE);
	assert.equal(
		summaryBelow.amountUntilFreeShipping,
		FREE_SHIPPING_THRESHOLD - 115,
	);
	assert.equal(summaryBelow.total, 130);

	bag = updateBagItemQuantity(bag, bag[0].key, -1);
	assert.equal(bag.length, 0);

	const emptySummary = computeBagSummary(bag);
	assert.equal(emptySummary.itemCount, 0);
	assert.equal(emptySummary.shipping, 0);
	assert.equal(emptySummary.total, 0);
});

test("removeBagItem and toggleWishlistId behave deterministically", () => {
	const coat = CATALOG_PRODUCTS[0];
	let bag = addItemToBag([], coat, "Black", "#121212", "M");
	bag = removeBagItem(bag, bag[0].key);
	assert.equal(bag.length, 0);

	let saved = toggleWishlistId([], coat.id);
	assert.deepEqual(saved, [coat.id]);
	saved = toggleWishlistId(saved, coat.id);
	assert.deepEqual(saved, []);
	assert.equal(formatCurrency(1250), "$1,250");
});

test("filterAndSortProductsWithFacets filters by multiple facets accurately", () => {
	// Material detection
	assert.equal(getProductMaterial("100% RWS Wool"), "Virgin Wool");
	assert.equal(getProductMaterial("100% GCS Cashmere"), "Cashmere");
	assert.equal(
		getProductMaterial("100% Organic Cotton Poplin"),
		"Organic Cotton",
	);
	assert.equal(getProductMaterial("Smooth calfskin leather"), "Leather");

	// Material facet filter
	const cashmereProducts = filterAndSortProductsWithFacets(
		CATALOG_PRODUCTS,
		{ materials: ["Cashmere"] },
		"",
		"featured",
	);
	assert.equal(cashmereProducts.length, 1);
	assert.equal(cashmereProducts[0].id, "heavy-ribbed-cashmere-crewneck");

	// Size facet filter
	const xlProducts = filterAndSortProductsWithFacets(
		CATALOG_PRODUCTS,
		{ sizes: ["XL"] },
		"",
		"featured",
	);
	assert.ok(xlProducts.length >= 2);
	assert.ok(xlProducts.every((p) => p.sizes.includes("XL")));

	// Price range filter
	const budgetProducts = filterAndSortProductsWithFacets(
		CATALOG_PRODUCTS,
		{ minPrice: 100, maxPrice: 200 },
		"",
		"price-asc",
	);
	assert.ok(budgetProducts.length >= 2);
	assert.ok(budgetProducts.every((p) => p.price >= 100 && p.price <= 200));

	// Newest sort
	const newestSorted = filterAndSortProductsWithFacets(
		CATALOG_PRODUCTS,
		{},
		"",
		"newest",
	);
	assert.equal(newestSorted[0].editorialLabel, "New Arrival");
});

test("formatLocalizedPrice formats localized currencies accurately", () => {
	const uk = SUPPORTED_COUNTRIES.find((c) => c.code === "GB");
	assert.ok(uk);
	assert.equal(formatLocalizedPrice(100, uk), "£79");

	const japan = SUPPORTED_COUNTRIES.find((c) => c.code === "JP");
	assert.ok(japan);
	assert.equal(formatLocalizedPrice(100, japan), "¥15,500");

	const euro = SUPPORTED_COUNTRIES.find((c) => c.code === "DE");
	assert.ok(euro);
	assert.equal(formatLocalizedPrice(100, euro), "€92");

	const us = SUPPORTED_COUNTRIES.find((c) => c.code === "US");
	assert.ok(us);
	assert.equal(formatLocalizedPrice(100, us), "$100");
});
