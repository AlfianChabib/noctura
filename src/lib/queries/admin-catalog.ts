import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
	getApiErrorMessage,
	getIsomorphicApi,
} from "@/lib/queries/isomorphic-api";
import type { AdminCatalogFilter } from "@/shared/schemas/catalog";

export { getApiErrorMessage };

export const adminCatalogKeys = {
	all: ["admin", "catalog"] as const,
	lists: () => [...adminCatalogKeys.all, "list"] as const,
	list: (filter: AdminCatalogFilter) =>
		[...adminCatalogKeys.lists(), filter] as const,
	details: () => [...adminCatalogKeys.all, "detail"] as const,
	detail: (id: string) => [...adminCatalogKeys.details(), id] as const,
	categories: () => ["catalog", "categories"] as const,
	collections: () => ["catalog", "collections"] as const,
	sizeGuides: () => ["catalog", "size-guides"] as const,
};

function toAdminQueryParams(filter: AdminCatalogFilter) {
	return {
		page: String(filter.page),
		limit: String(filter.limit),
		sort: filter.sort,
		...(filter.search ? { search: filter.search } : {}),
		...(filter.category ? { category: filter.category } : {}),
		...(filter.status ? { status: filter.status } : {}),
	};
}

export function adminProductsQueryOptions(filter: AdminCatalogFilter) {
	return queryOptions({
		queryKey: adminCatalogKeys.list(filter),
		queryFn: async () => {
			const client = await getIsomorphicApi();
			const res = await client.admin.products.$get({
				query: toAdminQueryParams(filter),
			});
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Gagal memuat daftar produk admin"),
				);
			}
			return res.json();
		},
	});
}

export function adminProductDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: adminCatalogKeys.detail(id),
		queryFn: async () => {
			const client = await getIsomorphicApi();
			const res = await client.admin.products[":id"].$get({
				param: { id },
			});
			if ((res.status as number) === 404) {
				return null;
			}
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Gagal memuat detail produk"),
				);
			}
			return res.json();
		},
	});
}

export function categoriesQueryOptions() {
	return queryOptions({
		queryKey: adminCatalogKeys.categories(),
		staleTime: 5 * 60_000,
		queryFn: async () => {
			const client = await getIsomorphicApi();
			const res = await client.categories.$get();
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Gagal memuat daftar kategori"),
				);
			}
			return res.json();
		},
	});
}

export function collectionsQueryOptions() {
	return queryOptions({
		queryKey: adminCatalogKeys.collections(),
		staleTime: 5 * 60_000,
		queryFn: async () => {
			const client = await getIsomorphicApi();
			const res = await client.collections.$get();
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Gagal memuat daftar koleksi"),
				);
			}
			return res.json();
		},
	});
}

export function sizeGuidesQueryOptions() {
	return queryOptions({
		queryKey: adminCatalogKeys.sizeGuides(),
		staleTime: 5 * 60_000,
		queryFn: async () => {
			const client = await getIsomorphicApi();
			const res = await client["size-guides"].$get();
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Gagal memuat daftar panduan ukuran"),
				);
			}
			return res.json();
		},
	});
}

export async function checkVariantSkuAvailability(
	sku: string,
	excludeProductId?: string,
): Promise<{ sku: string; available: boolean }> {
	const res = await api.admin.products["check-sku"].$get({
		query: {
			sku,
			...(excludeProductId ? { excludeProductId } : {}),
		},
	});
	if (!res.ok) {
		throw new Error(
			await getApiErrorMessage(res, "Gagal memvalidasi keunikan SKU"),
		);
	}
	return res.json();
}

export type AdminProductsData = Awaited<
	ReturnType<
		NonNullable<ReturnType<typeof adminProductsQueryOptions>["queryFn"]>
	>
>;
export type AdminProductRow = AdminProductsData["items"][number];
export type AdminProductDetail = NonNullable<
	Awaited<
		ReturnType<
			NonNullable<ReturnType<typeof adminProductDetailQueryOptions>["queryFn"]>
		>
	>
>;
export type CategoryOption = Awaited<
	ReturnType<NonNullable<ReturnType<typeof categoriesQueryOptions>["queryFn"]>>
>["categories"][number];
export type CollectionOption = Awaited<
	ReturnType<NonNullable<ReturnType<typeof collectionsQueryOptions>["queryFn"]>>
>["collections"][number];
export type SizeGuideOption = Awaited<
	ReturnType<NonNullable<ReturnType<typeof sizeGuidesQueryOptions>["queryFn"]>>
>["sizeGuides"][number];
