import { useEffect, useSyncExternalStore } from "react";
import type { GuestCartItem } from "@/shared/schemas/cart";
import {
	GUEST_CART_STORAGE_KEY,
	guestCartActions,
	selectCartCount,
	useGuestCartStore,
} from "@/store/guest-cart.store";

const EMPTY_CART_ITEMS: readonly GuestCartItem[] = [];

const subscribeGuestCart = (onStoreChange: () => void) =>
	useGuestCartStore.subscribe(onStoreChange);

const getServerCartCount = () => 0;
const getClientCartCount = () => selectCartCount(useGuestCartStore.getState());

const getServerCartItems = (): readonly GuestCartItem[] => EMPTY_CART_ITEMS;
const getClientCartItems = (): readonly GuestCartItem[] =>
	useGuestCartStore.getState().items;

export function useCartCount(): number {
	return useSyncExternalStore(
		subscribeGuestCart,
		getClientCartCount,
		getServerCartCount,
	);
}

export function useGuestCartItems(): readonly GuestCartItem[] {
	return useSyncExternalStore(
		subscribeGuestCart,
		getClientCartItems,
		getServerCartItems,
	);
}

export function useGuestCartHydration(): void {
	useEffect(() => {
		void guestCartActions.rehydrate();

		const handleStorage = (event: StorageEvent) => {
			if (event.key === null || event.key === GUEST_CART_STORAGE_KEY) {
				void guestCartActions.rehydrate();
			}
		};

		window.addEventListener("storage", handleStorage);
		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, []);
}
