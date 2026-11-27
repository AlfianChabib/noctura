import {
	type inferParserType,
	parseAsArrayOf,
	parseAsBoolean,
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";
import { formatIdr } from "@/lib/format";
import {
	CATALOG_SORT_OPTIONS,
	type CatalogFilter,
	GENDER_AUDIENCES,
	type GenderAudience,
} from "@/shared/schemas/catalog";

export const DEFAULT_STOREFRONT_PRODUCTS_LIMIT = 24;
export const MAX_STOREFRONT_PRODUCTS_LIMIT = 100;

export const storefrontProductsSearchParsers = {
	search: parseAsString.withDefault(""),
	category: parseAsString.withDefault(""),
	collection: parseAsString.withDefault(""),
	genderAudience: parseAsStringLiteral(GENDER_AUDIENCES),
	size: parseAsArrayOf(parseAsString).withDefault([]),
	color: parseAsArrayOf(parseAsString).withDefault([]),
	minPrice: parseAsInteger,
	maxPrice: parseAsInteger,
	inStock: parseAsBoolean.withDefault(false),
	sort: parseAsStringLiteral(CATALOG_SORT_OPTIONS).withDefault("newest"),
	page: parseAsInteger.withDefault(1),
	limit: parseAsInteger.withDefault(DEFAULT_STOREFRONT_PRODUCTS_LIMIT),
};

export type StorefrontProductsSearchState = inferParserType<
	typeof storefrontProductsSearchParsers
>;

function normalizeStringArray(
	values: readonly string[] | undefined,
): string[] | undefined {
	if (!values || values.length === 0) {
		return undefined;
	}
	const deduped = new Map<string, string>();
	for (const raw of values) {
		const trimmed = raw.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (!deduped.has(key)) {
			deduped.set(key, trimmed);
		}
	}
	return deduped.size > 0 ? Array.from(deduped.values()) : undefined;
}

function parseFacetArrayParam(raw: unknown): string[] | undefined {
	if (raw === undefined || raw === null || raw === "") {
		return undefined;
	}
	const rawList = Array.isArray(raw) ? raw : [raw];
	const expanded = rawList.flatMap((entry) => {
		if (typeof entry !== "string") return [];
		return entry.split(",");
	});
	return normalizeStringArray(expanded);
}

function parseOptionalStringParam(raw: unknown): string | undefined {
	if (typeof raw !== "string") return undefined;
	const trimmed = raw.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function parseIntegerParam(raw: unknown): number | undefined {
	if (typeof raw === "number") {
		return Number.isInteger(raw) ? raw : undefined;
	}
	if (typeof raw === "string") {
		const parsed = storefrontProductsSearchParsers.minPrice.parse(raw.trim());
		return parsed ?? undefined;
	}
	return undefined;
}

function parseBooleanParam(raw: unknown): boolean | undefined {
	if (typeof raw === "boolean") return raw;
	if (typeof raw === "string") {
		const parsed = storefrontProductsSearchParsers.inStock.parse(
			raw.trim().toLowerCase(),
		);
		return parsed ?? undefined;
	}
	return undefined;
}

/**
 * TanStack Router `validateSearch` function backed by `nuqs` parsers.
 * Safely accepts both raw URL strings (`?size=S,M`, `?size=S&size=M`, `?inStock=true`)
 * and typed `<Link search={...}>` objects, falling back gracefully on malformed params.
 */
export function validateStorefrontProductsSearch(
	search: Record<string, unknown>,
): Partial<StorefrontProductsSearchState> {
	const result: Partial<StorefrontProductsSearchState> = {};

	const searchStr = parseOptionalStringParam(search.search);
	if (searchStr !== undefined) result.search = searchStr;

	const category = parseOptionalStringParam(search.category);
	if (category !== undefined) result.category = category;

	const collection = parseOptionalStringParam(search.collection);
	if (collection !== undefined) result.collection = collection;

	if (typeof search.genderAudience === "string") {
		const gender = storefrontProductsSearchParsers.genderAudience.parse(
			search.genderAudience.trim(),
		);
		if (gender) result.genderAudience = gender;
	}

	const size = parseFacetArrayParam(search.size);
	if (size) result.size = size;

	const color = parseFacetArrayParam(search.color);
	if (color) result.color = color;

	const minPrice = parseIntegerParam(search.minPrice);
	if (minPrice !== undefined && minPrice >= 0) result.minPrice = minPrice;

	const maxPrice = parseIntegerParam(search.maxPrice);
	if (maxPrice !== undefined && maxPrice >= 0) result.maxPrice = maxPrice;

	const inStock = parseBooleanParam(search.inStock);
	if (inStock === true) result.inStock = true;

	if (typeof search.sort === "string") {
		const sort = storefrontProductsSearchParsers.sort.parse(search.sort.trim());
		if (sort && sort !== "newest") result.sort = sort;
	}

	const page = parseIntegerParam(search.page);
	if (page !== undefined && page >= 1 && page !== 1) result.page = page;

	const limit = parseIntegerParam(search.limit);
	if (
		limit !== undefined &&
		limit >= 1 &&
		limit !== DEFAULT_STOREFRONT_PRODUCTS_LIMIT
	) {
		result.limit = Math.min(MAX_STOREFRONT_PRODUCTS_LIMIT, limit);
	}

	return result;
}

/**
 * Converts `nuqs` URL search state into a clean, API-safe `CatalogFilter`.
 * Clamps invalid pagination/price bounds so manually edited URLs never break SSR.
 */
export function toStorefrontCatalogFilter(
	params: Partial<StorefrontProductsSearchState>,
): CatalogFilter {
	const rawSearch = params.search?.trim();
	const rawCategory = params.category?.trim();
	const rawCollection = params.collection?.trim();

	const page =
		typeof params.page === "number" &&
		Number.isInteger(params.page) &&
		params.page >= 1
			? params.page
			: 1;

	const limit =
		typeof params.limit === "number" && Number.isInteger(params.limit)
			? Math.min(MAX_STOREFRONT_PRODUCTS_LIMIT, Math.max(1, params.limit))
			: DEFAULT_STOREFRONT_PRODUCTS_LIMIT;

	let minPrice =
		typeof params.minPrice === "number" &&
		Number.isInteger(params.minPrice) &&
		params.minPrice >= 0
			? params.minPrice
			: undefined;

	let maxPrice =
		typeof params.maxPrice === "number" &&
		Number.isInteger(params.maxPrice) &&
		params.maxPrice >= 0
			? params.maxPrice
			: undefined;

	if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
		[minPrice, maxPrice] = [maxPrice, minPrice];
	}

	return {
		search: rawSearch ? rawSearch.slice(0, 120) : undefined,
		category: rawCategory ? rawCategory.slice(0, 120) : undefined,
		collection: rawCollection ? rawCollection.slice(0, 140) : undefined,
		genderAudience: params.genderAudience ?? undefined,
		size: normalizeStringArray(params.size),
		color: normalizeStringArray(params.color),
		minPrice,
		maxPrice,
		inStock: params.inStock === true ? true : undefined,
		sort: params.sort ?? "newest",
		page,
		limit,
	};
}

export type ActiveFilterChipKind =
	| "search"
	| "category"
	| "collection"
	| "genderAudience"
	| "size"
	| "color"
	| "price"
	| "inStock";

export interface ActiveFilterChip {
	id: string;
	kind: ActiveFilterChipKind;
	label: string;
	value?: string;
}

const GENDER_LABELS: Record<GenderAudience, string> = {
	women: "Women",
	men: "Men",
	unisex: "Unisex",
	kids: "Kids",
};

export function getGenderAudienceLabel(audience: GenderAudience): string {
	return GENDER_LABELS[audience];
}

export function buildActiveFilterChips(
	params: StorefrontProductsSearchState,
	options?: {
		categoryNameBySlug?: ReadonlyMap<string, string>;
		collectionNameBySlug?: ReadonlyMap<string, string>;
	},
): ActiveFilterChip[] {
	const chips: ActiveFilterChip[] = [];

	if (params.search.trim()) {
		chips.push({
			id: "search",
			kind: "search",
			label: `"${params.search.trim()}"`,
		});
	}

	if (params.category.trim()) {
		const slug = params.category.trim();
		const label = options?.categoryNameBySlug?.get(slug) ?? slug;
		chips.push({
			id: `category:${slug}`,
			kind: "category",
			label,
			value: slug,
		});
	}

	if (params.collection.trim()) {
		const slug = params.collection.trim();
		const label = options?.collectionNameBySlug?.get(slug) ?? slug;
		chips.push({
			id: `collection:${slug}`,
			kind: "collection",
			label,
			value: slug,
		});
	}

	if (params.genderAudience) {
		chips.push({
			id: `gender:${params.genderAudience}`,
			kind: "genderAudience",
			label: GENDER_LABELS[params.genderAudience],
			value: params.genderAudience,
		});
	}

	for (const size of params.size) {
		chips.push({
			id: `size:${size}`,
			kind: "size",
			label: `Size ${size}`,
			value: size,
		});
	}

	for (const color of params.color) {
		chips.push({
			id: `color:${color}`,
			kind: "color",
			label: color,
			value: color,
		});
	}

	if (params.minPrice !== null || params.maxPrice !== null) {
		const minLabel =
			params.minPrice !== null ? formatIdr(params.minPrice) : "Rp 0";
		const maxLabel =
			params.maxPrice !== null ? formatIdr(params.maxPrice) : "Max";
		chips.push({
			id: "price",
			kind: "price",
			label: `${minLabel} – ${maxLabel}`,
		});
	}

	if (params.inStock) {
		chips.push({
			id: "inStock",
			kind: "inStock",
			label: "Ready Stock",
		});
	}

	return chips;
}

export function countActiveStorefrontFilters(
	params: StorefrontProductsSearchState,
): number {
	return (
		(params.search.trim() ? 1 : 0) +
		(params.category.trim() ? 1 : 0) +
		(params.collection.trim() ? 1 : 0) +
		(params.genderAudience ? 1 : 0) +
		params.size.length +
		params.color.length +
		(params.minPrice !== null || params.maxPrice !== null ? 1 : 0) +
		(params.inStock ? 1 : 0)
	);
}
