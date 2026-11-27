import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	createColumnHelper,
	flexRender,
	type PaginationState,
	rowPaginationFeature,
	rowSortingFeature,
	type SortingState,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import {
	Archive,
	ArrowUpDown,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Edit3,
	Loader2,
	Package,
	Plus,
	Search,
} from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatIdr } from "@/lib/admin/variant-matrix";
import { api } from "@/lib/api-client";
import { buildFashionImageUrl } from "@/lib/imagekit";
import {
	adminProductsSearchParsers,
	toAdminCatalogFilter,
	validateAdminProductsSearch,
} from "@/lib/params/admin-products";
import {
	type AdminProductRow,
	adminCatalogKeys,
	adminProductsQueryOptions,
	categoriesQueryOptions,
	getApiErrorMessage,
} from "@/lib/queries/admin-catalog";
import { cn } from "@/lib/utils";
import {
	type AdminProductSortOption,
	PRODUCT_STATUSES,
	type ProductStatus,
} from "@/shared/schemas/catalog";

const adminTableFeatures = tableFeatures({
	rowSortingFeature,
	rowPaginationFeature,
});

const columnHelper = createColumnHelper<
	typeof adminTableFeatures,
	AdminProductRow
>();

function sortToTableSorting(sort: AdminProductSortOption): SortingState {
	switch (sort) {
		case "price_asc":
			return [{ id: "price", desc: false }];
		case "price_desc":
			return [{ id: "price", desc: true }];
		case "stock_asc":
			return [{ id: "stock", desc: false }];
		case "stock_desc":
			return [{ id: "stock", desc: true }];
		case "newest":
			return [{ id: "updatedAt", desc: false }];
		default:
			return [{ id: "updatedAt", desc: true }];
	}
}

function tableSortingToApiSort(sorting: SortingState): AdminProductSortOption {
	const first = sorting[0];
	if (!first) return "updated_desc";
	if (first.id === "price") {
		return first.desc ? "price_desc" : "price_asc";
	}
	if (first.id === "stock") {
		return first.desc ? "stock_desc" : "stock_asc";
	}
	return first.desc ? "updated_desc" : "newest";
}

function statusBadgeVariant(status: ProductStatus) {
	if (status === "published") return "success";
	if (status === "draft") return "warning";
	return "muted";
}

export const Route = createFileRoute("/_admin/admin/products/")({
	validateSearch: validateAdminProductsSearch,
	loaderDeps: ({ search }) => ({ filter: toAdminCatalogFilter(search) }),
	loader: async ({ context, deps }) => {
		await Promise.all([
			context.queryClient.query({
				...adminProductsQueryOptions(deps.filter),
				staleTime: "static",
			}),
			context.queryClient.query({
				...categoriesQueryOptions(),
				staleTime: "static",
			}),
		]);
	},
	component: AdminProductsPage,
});

function AdminProductsPage() {
	const { filter } = Route.useLoaderDeps();
	const queryClient = useQueryClient();

	const [params, setParams] = useQueryStates(adminProductsSearchParsers, {
		history: "replace",
	});
	const [actionError, setActionError] = useState<string | null>(null);

	const productsQuery = useQuery({
		...adminProductsQueryOptions(filter),
		placeholderData: keepPreviousData,
	});

	const categoriesQuery = useQuery(categoriesQueryOptions());

	const statusMutation = useMutation({
		mutationFn: async ({
			id,
			status,
		}: {
			id: string;
			status: ProductStatus;
		}) => {
			const res = await api.admin.products[":id"].status.$patch({
				param: { id },
				json: { status },
			});
			if (!res.ok) {
				throw new Error(
					await getApiErrorMessage(res, "Gagal mengubah status produk"),
				);
			}
			return res.json();
		},
		onSuccess: async () => {
			setActionError(null);
			await queryClient.invalidateQueries({
				queryKey: adminCatalogKeys.all,
			});
		},
		onError: (err) => {
			setActionError(
				err instanceof Error ? err.message : "Gagal memperbarui status produk.",
			);
		},
	});

	const data = useMemo(
		() => productsQuery.data?.items ?? [],
		[productsQuery.data?.items],
	);

	const paginationMeta = productsQuery.data?.pagination ?? {
		page: filter.page,
		limit: filter.limit,
		total: 0,
		totalPages: 1,
		hasNextPage: false,
		hasPrevPage: false,
	};

	const sortingState = useMemo(
		() => sortToTableSorting(filter.sort),
		[filter.sort],
	);

	const paginationState = useMemo<PaginationState>(
		() => ({
			pageIndex: Math.max(0, filter.page - 1),
			pageSize: filter.limit,
		}),
		[filter.page, filter.limit],
	);

	const columns = useMemo(
		() =>
			columnHelper.columns([
				columnHelper.accessor("name", {
					id: "product",
					header: "Produk & Parent SKU",
					enableSorting: false,
					cell: ({ row }) => {
						const item = row.original;
						const thumbUrl = item.primaryImage
							? buildFashionImageUrl(item.primaryImage.url, { width: 160 })
							: null;

						return (
							<div className="flex items-center gap-3 min-w-60">
								<div className="h-14 w-11 shrink-0 border border-border bg-studio overflow-hidden flex items-center justify-center">
									{thumbUrl ? (
										<img
											src={thumbUrl}
											alt={item.primaryImage?.altText || item.name}
											className="h-full w-full object-cover object-top"
										/>
									) : (
										<Package className="h-4 w-4 text-muted-foreground" />
									)}
								</div>
								<div className="min-w-0">
									<Link
										to="/admin/products/$id/edit"
										params={{ id: item.id }}
										className="text-sm font-medium text-foreground hover:underline block truncate"
									>
										{item.name}
									</Link>
									<p className="text-[11px] font-mono text-muted-foreground mt-0.5">
										{item.parentSku} · {item.brand}
									</p>
								</div>
							</div>
						);
					},
				}),
				columnHelper.accessor((row) => row.category.name, {
					id: "category",
					header: "Kategori",
					enableSorting: false,
					cell: ({ row }) => (
						<span className="text-xs text-foreground">
							{row.original.category.name}
						</span>
					),
				}),
				columnHelper.accessor((row) => row.priceRange.minPriceIdr, {
					id: "price",
					header: "Harga",
					enableSorting: true,
					cell: ({ row }) => {
						const { minPriceIdr, maxPriceIdr } = row.original.priceRange;
						return (
							<div className="font-mono text-xs whitespace-nowrap">
								{minPriceIdr === maxPriceIdr
									? formatIdr(minPriceIdr)
									: `${formatIdr(minPriceIdr)} – ${formatIdr(maxPriceIdr)}`}
							</div>
						);
					},
				}),
				columnHelper.accessor("totalAvailableStock", {
					id: "stock",
					header: "Stok & SKU",
					enableSorting: true,
					cell: ({ row }) => {
						const item = row.original;
						return (
							<div className="space-y-0.5 whitespace-nowrap">
								<p
									className={cn(
										"font-mono text-xs font-medium",
										item.totalAvailableStock <= 0
											? "text-destructive"
											: item.totalAvailableStock < 10
												? "text-amber-700 dark:text-amber-400"
												: "text-foreground",
									)}
								>
									{item.totalAvailableStock} pcs
								</p>
								<p className="font-mono text-[10px] text-muted-foreground">
									{item.variantCount} varian
								</p>
							</div>
						);
					},
				}),
				columnHelper.accessor("status", {
					id: "status",
					header: "Status",
					enableSorting: false,
					cell: ({ row }) => (
						<Badge variant={statusBadgeVariant(row.original.status)} size="sm">
							{row.original.status}
						</Badge>
					),
				}),
				columnHelper.accessor("updatedAt", {
					id: "updatedAt",
					header: "Diperbarui",
					enableSorting: true,
					cell: ({ row }) => (
						<span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
							{new Date(row.original.updatedAt).toLocaleDateString("id-ID", {
								day: "2-digit",
								month: "short",
								year: "numeric",
							})}
						</span>
					),
				}),
				columnHelper.display({
					id: "actions",
					header: () => <span className="sr-only">Aksi</span>,
					cell: ({ row }) => {
						const item = row.original;
						const isToggling =
							statusMutation.isPending &&
							statusMutation.variables?.id === item.id;
						const isArchived = item.status === "archived";

						return (
							<div className="flex items-center justify-end gap-1.5">
								<Button
									variant="outline"
									size="sm"
									className="h-8 px-2.5 text-xs"
									asChild
								>
									<Link to="/admin/products/$id/edit" params={{ id: item.id }}>
										<Edit3 className="h-3.5 w-3.5" />
										Edit
									</Link>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={isToggling}
									onClick={() =>
										statusMutation.mutate({
											id: item.id,
											status: isArchived ? "published" : "archived",
										})
									}
									className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
								>
									{isToggling ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : isArchived ? (
										<CheckCircle2 className="h-3.5 w-3.5" />
									) : (
										<Archive className="h-3.5 w-3.5" />
									)}
									{isArchived ? "Publish" : "Archive"}
								</Button>
							</div>
						);
					},
				}),
			]),
		[statusMutation],
	);

	const table = useTable({
		features: adminTableFeatures,
		data,
		columns,
		getRowId: (row) => row.id,
		manualSorting: true,
		manualPagination: true,
		pageCount: paginationMeta.totalPages,
		rowCount: paginationMeta.total,
		state: {
			sorting: sortingState,
			pagination: paginationState,
		},
		onSortingChange: (updater) => {
			const nextSorting =
				typeof updater === "function" ? updater(sortingState) : updater;
			void setParams({
				sort: tableSortingToApiSort(nextSorting),
				page: 1,
			});
		},
		onPaginationChange: (updater) => {
			const nextPagination =
				typeof updater === "function" ? updater(paginationState) : updater;
			void setParams({
				page: nextPagination.pageIndex + 1,
				limit: nextPagination.pageSize,
			});
		},
	});

	const categories = categoriesQuery.data?.categories ?? [];

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
						Catalog &amp; SKU Matrix Management
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Kelola produk fashion, galeri warna, dan stok varian SKU dengan
						pagination server-side.
					</p>
				</div>
				<Button size="sm" asChild>
					<Link to="/admin/products/new">
						<Plus className="h-4 w-4" />
						Tambah Produk
					</Link>
				</Button>
			</div>

			{/* Filter Toolbar */}
			<div className="border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-3">
				<div className="relative flex-1">
					<Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
					<Input
						value={params.search}
						onChange={(e) => {
							const nextSearch = e.target.value;
							void setParams(
								{ search: nextSearch, page: 1 },
								{ limitUrlUpdates: nextSearch ? debounce(300) : undefined },
							);
						}}
						placeholder="Cari nama produk, Parent SKU, brand, atau kode SKU varian..."
						aria-label="Cari produk admin"
						className="pl-9"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Select
						value={params.category || "__all__"}
						onValueChange={(val) =>
							void setParams({
								category: val === "__all__" ? "" : val,
								page: 1,
							})
						}
					>
						<SelectTrigger className="w-48" aria-label="Filter kategori">
							<SelectValue placeholder="Semua Kategori" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">Semua Kategori</SelectItem>
							{categories.map((cat) => (
								<SelectItem key={cat.id} value={cat.slug}>
									{cat.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={params.status ?? "__all__"}
						onValueChange={(val) =>
							void setParams({
								status: val === "__all__" ? null : (val as ProductStatus),
								page: 1,
							})
						}
					>
						<SelectTrigger className="w-40" aria-label="Filter status">
							<SelectValue placeholder="Semua Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">Semua Status</SelectItem>
							{PRODUCT_STATUSES.map((statusOption) => (
								<SelectItem key={statusOption} value={statusOption}>
									{statusOption.toUpperCase()}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{actionError && (
				<div
					role="alert"
					className="border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-xs text-destructive"
				>
					{actionError}
				</div>
			)}

			{/* Data Table */}
			<div className="border border-border bg-background overflow-x-auto">
				<table className="w-full text-left border-collapse">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="border-b border-border bg-secondary/40 text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
							>
								{headerGroup.headers.map((header) => {
									const canSort = header.column.getCanSort();
									const sorted = header.column.getIsSorted();
									return (
										<th key={header.id} className="py-3 px-4 font-medium">
											{header.isPlaceholder ? null : canSort ? (
												<button
													type="button"
													onClick={header.column.getToggleSortingHandler()}
													className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors uppercase"
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													<ArrowUpDown
														className={cn(
															"h-3 w-3",
															sorted ? "text-foreground" : "opacity-50",
														)}
													/>
													{sorted === "asc" && <span>↑</span>}
													{sorted === "desc" && <span>↓</span>}
												</button>
											) : (
												flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-border">
						{productsQuery.isLoading ? (
							<tr>
								<td
									colSpan={columns.length}
									className="py-16 text-center text-xs text-muted-foreground"
								>
									<span className="inline-flex items-center gap-2">
										<Loader2 className="h-4 w-4 animate-spin" />
										Memuat katalog produk...
									</span>
								</td>
							</tr>
						) : productsQuery.isError ? (
							<tr>
								<td
									colSpan={columns.length}
									className="py-12 text-center text-xs text-destructive"
								>
									{productsQuery.error instanceof Error
										? productsQuery.error.message
										: "Gagal memuat katalog produk."}
								</td>
							</tr>
						) : table.getRowModel().rows.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="py-16 text-center text-xs text-muted-foreground"
								>
									Tidak ada produk yang cocok dengan filter pencarian.
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className={cn(
										"hover:bg-secondary/15 transition-colors",
										productsQuery.isFetching && "opacity-75",
									)}
								>
									{row.getAllCells().map((cell) => (
										<td key={cell.id} className="py-3.5 px-4 align-middle">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Server-Side Pagination Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-border bg-card px-4 py-3 text-xs">
				<div className="font-mono text-muted-foreground">
					Total{" "}
					<span className="text-foreground font-medium">
						{paginationMeta.total}
					</span>{" "}
					produk · Halaman{" "}
					<span className="text-foreground font-medium">
						{paginationMeta.page}
					</span>{" "}
					dari{" "}
					<span className="text-foreground font-medium">
						{Math.max(1, paginationMeta.totalPages)}
					</span>
				</div>

				<div className="flex items-center gap-3">
					<Select
						value={String(params.limit)}
						onValueChange={(val) =>
							void setParams({
								limit: Number.parseInt(val, 10),
								page: 1,
							})
						}
					>
						<SelectTrigger size="sm" className="w-28 font-mono text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[10, 20, 50].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size} / hal
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="flex items-center gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={!paginationMeta.hasPrevPage}
							onClick={() => table.previousPage()}
							className="h-8 px-2.5 text-xs"
						>
							<ChevronLeft className="h-3.5 w-3.5" />
							Prev
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={!paginationMeta.hasNextPage}
							onClick={() => table.nextPage()}
							className="h-8 px-2.5 text-xs"
						>
							Next
							<ChevronRight className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
