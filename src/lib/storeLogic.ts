import type { Product, ProductCategory } from "@/data/catalog";

export type SortOption = "featured" | "newest" | "price-asc" | "price-desc";

export type GridDensity = "2" | "3" | "4" | "minimal";

export interface FacetFilterOptions {
	category?: ProductCategory | "All";
	categories?: string[];
	materials?: string[];
	sizes?: string[];
	colors?: string[];
	minPrice?: number;
	maxPrice?: number;
}

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

export function getProductMaterial(composition: string): string {
	const lower = composition.toLowerCase();
	if (lower.includes("cashmere")) return "Cashmere";
	if (lower.includes("wool")) return "Virgin Wool";
	if (lower.includes("leather") || lower.includes("calfskin")) return "Leather";
	if (lower.includes("gabardine")) return "Cotton Gabardine";
	if (lower.includes("cotton")) return "Organic Cotton";
	return "Other";
}

export function filterAndSortProductsWithFacets(
	products: Product[],
	facets: FacetFilterOptions,
	searchQuery: string,
	sortBy: SortOption = "featured",
): Product[] {
	const normalizedQuery = searchQuery.trim().toLowerCase();

	const filtered = products.filter((product) => {
		if (facets.category && facets.category !== "All") {
			const matchesCategory =
				product.category === facets.category ||
				product.tags.includes(facets.category);
			if (!matchesCategory) return false;
		}

		if (facets.categories && facets.categories.length > 0) {
			const matchesAny = facets.categories.some(
				(cat) =>
					cat === "All" ||
					product.category === cat ||
					product.tags.includes(cat as ProductCategory),
			);
			if (!matchesAny) return false;
		}

		if (facets.materials && facets.materials.length > 0) {
			const productMaterial = getProductMaterial(product.composition);
			const matchesMaterial = facets.materials.includes(productMaterial);
			if (!matchesMaterial) return false;
		}

		if (facets.sizes && facets.sizes.length > 0) {
			const matchesSize = facets.sizes.some((size) =>
				product.sizes.includes(size),
			);
			if (!matchesSize) return false;
		}

		if (facets.colors && facets.colors.length > 0) {
			const matchesColor = product.colors.some((color) =>
				facets.colors?.some(
					(c) =>
						color.name.toLowerCase().includes(c.toLowerCase()) ||
						c.toLowerCase().includes(color.name.toLowerCase()),
				),
			);
			if (!matchesColor) return false;
		}

		if (facets.minPrice !== undefined && product.price < facets.minPrice) {
			return false;
		}
		if (facets.maxPrice !== undefined && product.price > facets.maxPrice) {
			return false;
		}

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
	} else if (sortBy === "newest") {
		sorted.sort((a, b) => {
			const aIsNew = a.editorialLabel === "New Arrival" ? 1 : 0;
			const bIsNew = b.editorialLabel === "New Arrival" ? 1 : 0;
			if (aIsNew !== bIsNew) return bIsNew - aIsNew;
			return a.featuredRank - b.featuredRank;
		});
	} else {
		sorted.sort((a, b) => a.featuredRank - b.featuredRank);
	}

	return sorted;
}

export function filterAndSortProducts(
	products: Product[],
	category: ProductCategory,
	searchQuery: string,
	sortBy: SortOption,
): Product[] {
	return filterAndSortProductsWithFacets(
		products,
		{ category },
		searchQuery,
		sortBy,
	);
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

export interface CountryConfig {
	code: string;
	name: string;
	region: "Asia Pacific" | "Europe" | "North America" | "Middle East";
	currency: string;
	currencySymbol: string;
	rate: number;
	flag: string;
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
	{
		code: "ID",
		name: "Indonesia",
		region: "Asia Pacific",
		currency: "USD",
		currencySymbol: "$",
		rate: 1.0,
		flag: "🇮🇩",
	},
	{
		code: "SG",
		name: "Singapore",
		region: "Asia Pacific",
		currency: "SGD",
		currencySymbol: "S$",
		rate: 1.35,
		flag: "🇸🇬",
	},
	{
		code: "JP",
		name: "Japan",
		region: "Asia Pacific",
		currency: "JPY",
		currencySymbol: "¥",
		rate: 155,
		flag: "🇯🇵",
	},
	{
		code: "GB",
		name: "United Kingdom",
		region: "Europe",
		currency: "GBP",
		currencySymbol: "£",
		rate: 0.79,
		flag: "🇬🇧",
	},
	{
		code: "DE",
		name: "Germany",
		region: "Europe",
		currency: "EUR",
		currencySymbol: "€",
		rate: 0.92,
		flag: "🇩🇪",
	},
	{
		code: "FR",
		name: "France",
		region: "Europe",
		currency: "EUR",
		currencySymbol: "€",
		rate: 0.92,
		flag: "🇫🇷",
	},
	{
		code: "US",
		name: "United States",
		region: "North America",
		currency: "USD",
		currencySymbol: "$",
		rate: 1.0,
		flag: "🇺🇸",
	},
	{
		code: "AE",
		name: "United Arab Emirates",
		region: "Middle East",
		currency: "AED",
		currencySymbol: "AED",
		rate: 3.67,
		flag: "🇦🇪",
	},
];

export function formatLocalizedPrice(
	amountInUSD: number,
	country: CountryConfig = SUPPORTED_COUNTRIES[0],
): string {
	const converted = Math.round(amountInUSD * country.rate);
	if (country.currency === "USD") {
		return `$${converted.toLocaleString("en-US")}`;
	}
	if (country.currency === "GBP") {
		return `£${converted.toLocaleString("en-US")}`;
	}
	if (country.currency === "EUR") {
		return `€${converted.toLocaleString("en-US")}`;
	}
	if (country.currency === "JPY") {
		return `¥${converted.toLocaleString("en-US")}`;
	}
	return `${country.currencySymbol} ${converted.toLocaleString("en-US")}`;
}

export function formatCurrency(amount: number): string {
	return formatLocalizedPrice(amount, SUPPORTED_COUNTRIES[0]);
}
