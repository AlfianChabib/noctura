import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useCartCount } from "@/hooks/use-cart-count";
import { createCatalogRoute } from "@/server/routes/catalog";
import type { CatalogService } from "@/server/services/catalog.service";
import {
	guestCartStorageSchema,
	resolveCartVariantsQuerySchema,
} from "@/shared/schemas/cart";
import {
	createZodGuestCartStorage,
	GUEST_CART_STORAGE_KEY,
	guestCartActions,
	type StorageLike,
	selectCartCount,
	useGuestCartStore,
} from "@/store/guest-cart.store";
import { uiActions, useUiStore } from "@/store/ui.store";

function createMemoryStorage(
	initial: Record<string, string> = {},
): StorageLike {
	const store = new Map<string, string>(Object.entries(initial));
	return {
		getItem(key) {
			return store.get(key) ?? null;
		},
		setItem(key, value) {
			store.set(key, value);
		},
		removeItem(key) {
			store.delete(key);
		},
	};
}

const VARIANT_A = "11111111-1111-4111-8111-111111111111";
const VARIANT_B = "22222222-2222-4222-8222-222222222222";

function BadgeProbe() {
	const count = useCartCount();
	return createElement("span", null, `Bag (${count})`);
}

test("createZodGuestCartStorage resets malformed JSON, invalid values, and price-tampered entries", () => {
	const corruptedJsonStorage = createMemoryStorage({
		[GUEST_CART_STORAGE_KEY]: "{not-valid-json",
	});
	const adapter1 = createZodGuestCartStorage(() => corruptedJsonStorage);
	assert.equal(adapter1.getItem(GUEST_CART_STORAGE_KEY), null);
	assert.equal(corruptedJsonStorage.getItem(GUEST_CART_STORAGE_KEY), null);

	const tamperedPriceStorage = createMemoryStorage({
		[GUEST_CART_STORAGE_KEY]: JSON.stringify({
			state: {
				items: [{ variantId: VARIANT_A, quantity: 2, priceIdr: 1 }],
			},
			version: 1,
		}),
	});
	const adapter2 = createZodGuestCartStorage(() => tamperedPriceStorage);
	assert.equal(adapter2.getItem(GUEST_CART_STORAGE_KEY), null);
	assert.equal(tamperedPriceStorage.getItem(GUEST_CART_STORAGE_KEY), null);

	const invalidUuidStorage = createMemoryStorage({
		[GUEST_CART_STORAGE_KEY]: JSON.stringify({
			state: {
				items: [{ variantId: "not-a-uuid", quantity: 1 }],
			},
			version: 1,
		}),
	});
	const adapter3 = createZodGuestCartStorage(() => invalidUuidStorage);
	assert.equal(adapter3.getItem(GUEST_CART_STORAGE_KEY), null);
	assert.equal(invalidUuidStorage.getItem(GUEST_CART_STORAGE_KEY), null);
});

test("createZodGuestCartStorage deduplicates repeated variantIds and validates storage schema", () => {
	const storage = createMemoryStorage({
		[GUEST_CART_STORAGE_KEY]: JSON.stringify({
			state: {
				items: [
					{ variantId: VARIANT_A, quantity: 2 },
					{ variantId: VARIANT_A, quantity: 3 },
					{ variantId: VARIANT_B, quantity: 1 },
				],
			},
			version: 1,
		}),
	});
	const adapter = createZodGuestCartStorage(() => storage);
	const hydrated = adapter.getItem(GUEST_CART_STORAGE_KEY);
	assert.deepEqual(hydrated, {
		state: {
			items: [
				{ variantId: VARIANT_A, quantity: 5 },
				{ variantId: VARIANT_B, quantity: 1 },
			],
		},
		version: 1,
	});
});

test("guestCartActions isolate pure state, persist only variantId/quantity, and respect skipHydration", async () => {
	const memoryStorage = createMemoryStorage({
		[GUEST_CART_STORAGE_KEY]: JSON.stringify({
			state: {
				items: [{ variantId: VARIANT_B, quantity: 2 }],
			},
			version: 1,
		}),
	});

	const originalWindow = (globalThis as { window?: unknown }).window;
	(globalThis as { window?: unknown }).window = {
		localStorage: memoryStorage,
	};

	try {
		guestCartActions.clearCart();
		assert.deepEqual(useGuestCartStore.getState().items, []);
		assert.equal(
			typeof (useGuestCartStore.getState() as Record<string, unknown>).addItem,
			"undefined",
		);

		// Restore pre-populated localStorage after clearCart and verify rehydrate loads it.
		memoryStorage.setItem(
			GUEST_CART_STORAGE_KEY,
			JSON.stringify({
				state: { items: [{ variantId: VARIANT_B, quantity: 2 }] },
				version: 1,
			}),
		);
		await guestCartActions.rehydrate();
		assert.deepEqual(useGuestCartStore.getState().items, [
			{ variantId: VARIANT_B, quantity: 2 },
		]);

		// Adding items respects stock ceiling and merges duplicate variantId.
		assert.equal(guestCartActions.addItem(VARIANT_A, 1, 2), true);
		assert.equal(guestCartActions.addItem(VARIANT_A, 1, 2), true);
		assert.equal(guestCartActions.addItem(VARIANT_A, 1, 2), false);
		assert.equal(selectCartCount(useGuestCartStore.getState()), 4);

		// Decrementing below 1 removes the item.
		guestCartActions.updateItemQuantity(VARIANT_A, -2, 2);
		assert.deepEqual(useGuestCartStore.getState().items, [
			{ variantId: VARIANT_B, quantity: 2 },
		]);

		const persistedRaw = memoryStorage.getItem(GUEST_CART_STORAGE_KEY);
		assert.ok(persistedRaw);
		const persistedJson = JSON.parse(persistedRaw);
		const parsed = guestCartStorageSchema.safeParse(persistedJson);
		assert.equal(parsed.success, true);
		assert.equal(
			Object.keys(persistedJson.state.items[0]).sort().join(","),
			"quantity,variantId",
		);

		guestCartActions.clearCart();
		assert.equal(selectCartCount(useGuestCartStore.getState()), 0);
	} finally {
		guestCartActions.clearCart();
		if (originalWindow === undefined) {
			delete (globalThis as { window?: unknown }).window;
		} else {
			(globalThis as { window?: unknown }).window = originalWindow;
		}
	}
});

test("useCartCount always renders 0 during SSR via useSyncExternalStore", () => {
	guestCartActions.clearCart();
	guestCartActions.addItem(VARIANT_A, 3);
	assert.equal(selectCartCount(useGuestCartStore.getState()), 3);

	const ssrHtml = renderToString(createElement(BadgeProbe));
	assert.equal(ssrHtml, "<span>Bag (0)</span>");

	guestCartActions.clearCart();
});

test("uiActions manage cart drawer, size guide modal, and mobile menu cleanly", () => {
	uiActions.resetUiState();
	assert.deepEqual(useUiStore.getState(), {
		isCartDrawerOpen: false,
		isSizeGuideOpen: false,
		isMobileMenuOpen: false,
	});

	uiActions.openMobileMenu();
	assert.equal(useUiStore.getState().isMobileMenuOpen, true);

	uiActions.openCartDrawer();
	assert.equal(useUiStore.getState().isCartDrawerOpen, true);
	assert.equal(useUiStore.getState().isMobileMenuOpen, false);

	uiActions.openSizeGuide();
	assert.equal(useUiStore.getState().isSizeGuideOpen, true);

	uiActions.closeSizeGuide();
	uiActions.closeCartDrawer();
	assert.deepEqual(useUiStore.getState(), {
		isCartDrawerOpen: false,
		isSizeGuideOpen: false,
		isMobileMenuOpen: false,
	});
});

test("GET /api/products/variants validates UUIDs and returns authoritative catalog data", async () => {
	const parsedEmpty = resolveCartVariantsQuerySchema.safeParse({ ids: "" });
	assert.equal(parsedEmpty.success, true);
	assert.deepEqual(parsedEmpty.data.ids, []);

	let receivedIds: readonly string[] = [];
	const mockService = {
		resolveVariantsByIds: async (ids: readonly string[]) => {
			receivedIds = ids;
			return [
				{
					id: VARIANT_A,
					productId: "33333333-3333-4333-8333-333333333333",
					productSlug: "architectural-wool-overcoat",
					productName: "Architectural Wool Overcoat",
					brand: "NOCTURA",
					sku: "NOC-OW-001-BLK-M",
					colorName: "Obsidian Black",
					colorHex: "#121212",
					sizeLabel: "M",
					priceIdr: 2_890_000,
					compareAtPriceIdr: null,
					availableQuantity: 4,
					weightGrams: 1100,
					imageUrl:
						"https://ik.imagekit.io/noctura/products/outerwear/coat.jpg",
					imageAlt: "Architectural Wool Overcoat",
				},
			];
		},
	} as unknown as CatalogService;

	const route = createCatalogRoute({ service: mockService });

	const invalidRes = await route.request("/products/variants?ids=bad-id");
	assert.equal(invalidRes.status, 400);

	const validRes = await route.request(
		`/products/variants?ids=${VARIANT_A},${VARIANT_A}`,
	);
	assert.equal(validRes.status, 200);
	const body = (await validRes.json()) as {
		items: Array<{ id: string; priceIdr: number }>;
	};
	assert.deepEqual(receivedIds, [VARIANT_A]);
	assert.equal(body.items.length, 1);
	assert.equal(body.items[0].priceIdr, 2_890_000);
});
