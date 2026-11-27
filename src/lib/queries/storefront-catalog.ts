import { queryOptions } from "@tanstack/react-query";
import {
	getApiErrorMessage,
	getIsomorphicApi,
} from "@/lib/queries/isomorphic-api";
import type {
	CatalogFacetsResponse,
	ProductListResponse,
} from "@/server/services/catalog.service";
import type { CatalogFilter } from "@/shared/schemas/catalog";

export const storefrontCatalogKeys = {
	all: ["storefront", "catalog"] as const,
	lists: () => [...storefrontCatalogKeys.all, "list"] as const,
	list: (filter: CatalogFilter) =>
		[...storefrontCatalogKeys.lists(), filter] as const,
	facets: () => [...storefrontCatalogKeys.all, "facets"] as const,
};

function toStorefrontQueryParams(filter: CatalogFilter) {
	return {
		page: String(filter.page),
		limit: String(filter.limit),
		sort: filter.sort,
		...(filter.search ? { search: filter.search } : {}),
		...(filter.category ? { category: filter.category } : {}),
		...(filter.collection ? { collection: filter.collection } : {}),
		...(filter.genderAudience ? { genderAudience: filter.genderAudience } : {}),
		...(filter.size && filter.size.length > 0 ? { size: filter.size } : {}),
		...(filter.color && filter.color.length > 0 ? { color: filter.color } : {}),
		...(filter.minPrice !== undefined ? { minPrice: filter.minPrice } : {}),
		...(filter.maxPrice !== undefined ? { maxPrice: filter.maxPrice } : {}),
		...(filter.inStock === true ? { inStock: true } : {}),
	};
}

export function productsQueryOptions(filter: CatalogFilter) {
	return queryOptions({
		queryKey: storefrontCatalogKeys.list(filter),
		queryFn: async (): Promise<ProductListResponse> => {
			const client = await getIsomorphicApi();
			const res = await client.products.$get({
				query: toStorefrontQueryParams(filter),
			});
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Failed to load product catalog"),
				);
			}
			return res.json();
		},
	});
}

export function catalogFacetsQueryOptions() {
	return queryOptions({
		queryKey: storefrontCatalogKeys.facets(),
		staleTime: 60_000,
		queryFn: async (): Promise<CatalogFacetsResponse> => {
			const client = await getIsomorphicApi();
			const res = await client.products.facets.$get();
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Failed to load catalog facets"),
				);
			}
			return res.json();
		},
	});
}
