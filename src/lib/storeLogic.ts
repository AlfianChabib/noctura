import type { Product, ProductCategory } from "@/data/catalog";

export type SortOption = "featured" | "price-asc" | "price-desc";

export interface BagItem {
	key: string;
	productId: string;
	sku: string;
	title: string;
	price: number;
	image: string;
	colorName: string;
	colorHex: string;
	size: string;
	quantity: number;
}

export interface BagSummary {
	itemCount: number;
	subtotal: number;
	shipping: number;
	freeShippingThreshold: number;
	amountUntilFreeShipping: number;
	freeShippingProgress: number;
	total: number;
}

export const FREE_SHIPPING_THRESHOLD = 250;
export const STANDARD_SHIPPING_FEE = 15;

export function buildBagItemKey(
	productId: string,
	colorName: string,
	size: string,
): string {
	return `${productId}__${colorName.toLowerCase()}__${size.toLowerCase()}`;
}

export function filterAndSortProducts(
	products: Product[],
	category: ProductCategory,
	searchQuery: string,
	sortBy: SortOption,
): Product[] {
	const normalizedQuery = searchQuery.trim().toLowerCase();

	const filtered = products.filter((product) => {
		const matchesCategory =
			category === "All" ||
			product.category === category ||
			product.tags.includes(category);

		if (!matchesCategory) return false;
		if (!normalizedQuery) return true;

		const searchableText = [
			product.title,
			product.subtitle,
			product.category,
			product.composition,
			...product.colors.map((c) => c.name),
		]
			.join(" ")
			.toLowerCase();

		return searchableText.includes(normalizedQuery);
	});

	const sorted = [...filtered];
	if (sortBy === "price-asc") {
		sorted.sort((a, b) => a.price - b.price || a.featuredRank - b.featuredRank);
	} else if (sortBy === "price-desc") {
		sorted.sort((a, b) => b.price - a.price || a.featuredRank - b.featuredRank);
	} else {
		sorted.sort((a, b) => a.featuredRank - b.featuredRank);
	}

	return sorted;
}

export function addItemToBag(
	items: BagItem[],
	product: Product,
	colorName: string,
	colorHex: string,
	size: string,
): BagItem[] {
	const key = buildBagItemKey(product.id, colorName, size);
	const existingIndex = items.findIndex((item) => item.key === key);

	if (existingIndex >= 0) {
		return items.map((item, idx) =>
			idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
		);
	}

	return [
		...items,
		{
			key,
			productId: product.id,
			sku: product.sku,
			title: product.title,
			price: product.price,
			image: product.image,
			colorName,
			colorHex,
			size,
			quantity: 1,
		},
	];
}

export function updateBagItemQuantity(
	items: BagItem[],
	key: string,
	delta: number,
): BagItem[] {
	return items
		.map((item) =>
			item.key === key ? { ...item, quantity: item.quantity + delta } : item,
		)
		.filter((item) => item.quantity > 0);
}

export function removeBagItem(items: BagItem[], key: string): BagItem[] {
	return items.filter((item) => item.key !== key);
}

export function computeBagSummary(items: BagItem[]): BagSummary {
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);
	const shipping =
		subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
			? 0
			: STANDARD_SHIPPING_FEE;
	const amountUntilFreeShipping = Math.max(
		0,
		FREE_SHIPPING_THRESHOLD - subtotal,
	);
	const freeShippingProgress = Math.min(
		100,
		Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100),
	);

	return {
		itemCount,
		subtotal,
		shipping,
		freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
		amountUntilFreeShipping,
		freeShippingProgress,
		total: subtotal + shipping,
	};
}

export function toggleWishlistId(
	wishlist: string[],
	productId: string,
): string[] {
	if (wishlist.includes(productId)) {
		return wishlist.filter((id) => id !== productId);
	}
	return [...wishlist, productId];
}

export function formatCurrency(amount: number): string {
	return `$${amount.toLocaleString("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	})}`;
}
