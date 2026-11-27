import {
	createStandardSchemaV1,
	type inferParserType,
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";
import {
	ADMIN_PRODUCT_SORT_OPTIONS,
	type AdminCatalogFilter,
	PRODUCT_STATUSES,
} from "@/shared/schemas/catalog";

export const DEFAULT_ADMIN_PRODUCTS_LIMIT = 20;
export const MAX_ADMIN_PRODUCTS_LIMIT = 100;

export const adminProductsSearchParsers = {
	search: parseAsString.withDefault(""),
	category: parseAsString.withDefault(""),
	status: parseAsStringLiteral(PRODUCT_STATUSES),
	sort: parseAsStringLiteral(ADMIN_PRODUCT_SORT_OPTIONS).withDefault(
		"updated_desc",
	),
	page: parseAsInteger.withDefault(1),
	limit: parseAsInteger.withDefault(DEFAULT_ADMIN_PRODUCTS_LIMIT),
};

export const validateAdminProductsSearch = createStandardSchemaV1(
	adminProductsSearchParsers,
	{ partialOutput: true },
);

export type AdminProductsSearchState = inferParserType<
	typeof adminProductsSearchParsers
>;

export function toAdminCatalogFilter(
	params: Partial<AdminProductsSearchState>,
): AdminCatalogFilter {
	const rawSearch = params.search?.trim();
	const rawCategory = params.category?.trim();
	const page =
		typeof params.page === "number" &&
		Number.isInteger(params.page) &&
		params.page >= 1
			? params.page
			: 1;
	const limit =
		typeof params.limit === "number" && Number.isInteger(params.limit)
			? Math.min(MAX_ADMIN_PRODUCTS_LIMIT, Math.max(1, params.limit))
			: DEFAULT_ADMIN_PRODUCTS_LIMIT;

	return {
		search: rawSearch ? rawSearch.slice(0, 120) : undefined,
		category: rawCategory ? rawCategory.slice(0, 120) : undefined,
		status: params.status ?? undefined,
		sort: params.sort ?? "updated_desc",
		page,
		limit,
	};
}
