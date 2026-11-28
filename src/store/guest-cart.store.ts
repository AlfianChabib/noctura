import { create } from "zustand";
import {
	type PersistStorage,
	persist,
	type StorageValue,
} from "zustand/middleware";
import {
	type GuestCartItem,
	type GuestCartState,
	guestCartItemSchema,
	guestCartStorageSchema,
	MAX_CART_ITEM_QUANTITY,
	MAX_GUEST_CART_ITEMS,
} from "@/shared/schemas/cart";

export const GUEST_CART_STORAGE_KEY = "noctura-guest-cart";
export const GUEST_CART_STORAGE_VERSION = 1;

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

function getBrowserLocalStorage(): StorageLike | null {
	if (typeof window === "undefined") {
		return null;
	}
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function clampQuantity(quantity: number, maxAvailableStock?: number): number {
	const ceiling =
		typeof maxAvailableStock === "number" && Number.isFinite(maxAvailableStock)
			? Math.min(
					MAX_CART_ITEM_QUANTITY,
					Math.max(0, Math.floor(maxAvailableStock)),
				)
			: MAX_CART_ITEM_QUANTITY;
	return Math.min(Math.floor(quantity), ceiling);
}

export function normalizeGuestCartItems(
	items: readonly GuestCartItem[],
): GuestCartItem[] {
	const merged = new Map<string, number>();

	for (const item of items) {
		const parsed = guestCartItemSchema.safeParse(item);
		if (!parsed.success) {
			continue;
		}
		const prevQty = merged.get(parsed.data.variantId) ?? 0;
		const nextQty = clampQuantity(prevQty + parsed.data.quantity);
		if (nextQty > 0) {
			merged.set(parsed.data.variantId, nextQty);
		}
		if (
			merged.size >= MAX_GUEST_CART_ITEMS &&
			!merged.has(parsed.data.variantId)
		) {
			break;
		}
	}

	return Array.from(merged.entries()).map(([variantId, quantity]) => ({
		variantId,
		quantity,
	}));
}

export function createZodGuestCartStorage(
	resolveStorage: () => StorageLike | null = getBrowserLocalStorage,
): PersistStorage<GuestCartState> {
	return {
		getItem(name: string): StorageValue<GuestCartState> | null {
			const storage = resolveStorage();
			if (!storage) {
				return null;
			}

			let raw: string | null = null;
			try {
				raw = storage.getItem(name);
			} catch {
				return null;
			}

			if (raw === null) {
				return null;
			}

			let parsedJson: unknown;
			try {
				parsedJson = JSON.parse(raw);
			} catch {
				try {
					storage.removeItem(name);
				} catch {
					// Ignore storage cleanup failures in restricted browser modes.
				}
				return null;
			}

			const validated = guestCartStorageSchema.safeParse(parsedJson);
			if (!validated.success) {
				try {
					storage.removeItem(name);
				} catch {
					// Ignore storage cleanup failures in restricted browser modes.
				}
				return null;
			}

			return {
				state: {
					items: normalizeGuestCartItems(validated.data.state.items),
				},
				version: validated.data.version ?? GUEST_CART_STORAGE_VERSION,
			};
		},

		setItem(name: string, value: StorageValue<GuestCartState>): void {
			const storage = resolveStorage();
			if (!storage) {
				return;
			}

			const sanitized: StorageValue<GuestCartState> = {
				state: {
					items: normalizeGuestCartItems(value.state.items),
				},
				version: value.version ?? GUEST_CART_STORAGE_VERSION,
			};

			const validated = guestCartStorageSchema.safeParse(sanitized);
			if (!validated.success) {
				return;
			}

			try {
				storage.setItem(name, JSON.stringify(validated.data));
			} catch {
				// Ignore quota/security errors in restricted browser contexts.
			}
		},

		removeItem(name: string): void {
			const storage = resolveStorage();
			if (!storage) {
				return;
			}
			try {
				storage.removeItem(name);
			} catch {
				// Ignore storage cleanup failures in restricted browser contexts.
			}
		},
	};
}

const initialState: GuestCartState = {
	items: [],
};

export const useGuestCartStore = create<GuestCartState>()(
	persist(() => initialState, {
		name: GUEST_CART_STORAGE_KEY,
		version: GUEST_CART_STORAGE_VERSION,
		storage: createZodGuestCartStorage(),
		skipHydration: true,
		partialize: (state) => ({ items: state.items }),
	}),
);

export function selectCartCount(state: GuestCartState): number {
	return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectCartItemQuantity(
	state: GuestCartState,
	variantId: string,
): number {
	return (
		state.items.find((item) => item.variantId === variantId)?.quantity ?? 0
	);
}

export const guestCartActions = {
	addItem(
		variantId: string,
		quantity = 1,
		maxAvailableStock?: number,
	): boolean {
		const validated = guestCartItemSchema.safeParse({ variantId, quantity });
		if (!validated.success) {
			return false;
		}
		if (
			typeof maxAvailableStock === "number" &&
			Math.floor(maxAvailableStock) <= 0
		) {
			return false;
		}

		let changed = false;

		useGuestCartStore.setState((state) => {
			const existingIndex = state.items.findIndex(
				(item) => item.variantId === validated.data.variantId,
			);

			if (existingIndex >= 0) {
				const existing = state.items[existingIndex];
				const nextQty = clampQuantity(
					existing.quantity + validated.data.quantity,
					maxAvailableStock,
				);
				if (nextQty <= existing.quantity) {
					return state;
				}
				changed = true;
				return {
					items: state.items.map((item, idx) =>
						idx === existingIndex ? { ...item, quantity: nextQty } : item,
					),
				};
			}

			if (state.items.length >= MAX_GUEST_CART_ITEMS) {
				return state;
			}

			const nextQty = clampQuantity(validated.data.quantity, maxAvailableStock);
			if (nextQty <= 0) {
				return state;
			}

			changed = true;
			return {
				items: [
					...state.items,
					{ variantId: validated.data.variantId, quantity: nextQty },
				],
			};
		});

		return changed;
	},

	setItemQuantity(
		variantId: string,
		quantity: number,
		maxAvailableStock?: number,
	): void {
		if (!Number.isFinite(quantity) || Math.floor(quantity) <= 0) {
			guestCartActions.removeItem(variantId);
			return;
		}

		const nextQty = clampQuantity(quantity, maxAvailableStock);
		if (nextQty <= 0) {
			guestCartActions.removeItem(variantId);
			return;
		}

		const validated = guestCartItemSchema.safeParse({
			variantId,
			quantity: nextQty,
		});
		if (!validated.success) {
			return;
		}

		useGuestCartStore.setState((state) => {
			const exists = state.items.some(
				(item) => item.variantId === validated.data.variantId,
			);
			if (!exists) {
				if (state.items.length >= MAX_GUEST_CART_ITEMS) {
					return state;
				}
				return {
					items: [...state.items, validated.data],
				};
			}
			return {
				items: state.items.map((item) =>
					item.variantId === validated.data.variantId
						? { ...item, quantity: validated.data.quantity }
						: item,
				),
			};
		});
	},

	updateItemQuantity(
		variantId: string,
		delta: number,
		maxAvailableStock?: number,
	): void {
		if (!Number.isFinite(delta) || delta === 0) {
			return;
		}

		const current = selectCartItemQuantity(
			useGuestCartStore.getState(),
			variantId,
		);
		if (current === 0 && delta < 0) {
			return;
		}
		guestCartActions.setItemQuantity(
			variantId,
			current + Math.trunc(delta),
			maxAvailableStock,
		);
	},

	removeItem(variantId: string): void {
		useGuestCartStore.setState((state) => {
			const nextItems = state.items.filter(
				(item) => item.variantId !== variantId,
			);
			if (nextItems.length === state.items.length) {
				return state;
			}
			return { items: nextItems };
		});
	},

	clearCart(): void {
		useGuestCartStore.setState({ items: [] });
	},

	rehydrate(): Promise<void> | void {
		return useGuestCartStore.persist.rehydrate();
	},
};
