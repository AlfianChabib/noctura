import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import {
	type CategoryPillItem,
	CategoryPillsNav,
} from "@/components/CategoryPillsNav";
import {
	FilterDrawerSheet,
	FilterSidebar,
	type StorefrontSearchUpdater,
} from "@/components/catalog/filter-sidebar";
import { CatalogProductCard } from "@/components/catalog/product-card";
import { SortDropdown } from "@/components/catalog/sort-dropdown";
import { StorefrontShell } from "@/components/catalog/storefront-shell";
import { GridDensitySwitch } from "@/components/GridDensitySwitch";
import { LoadMorePagination } from "@/components/LoadMorePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api-client";
import { buildFashionImageUrl } from "@/lib/imagekit";
import {
	type ActiveFilterChip,
	buildActiveFilterChips,
	countActiveStorefrontFilters,
	getGenderAudienceLabel,
	storefrontProductsSearchParsers,
	toStorefrontCatalogFilter,
	validateStorefrontProductsSearch,
} from "@/lib/params/catalog-products";
import {
	catalogFacetsQueryOptions,
	productsQueryOptions,
} from "@/lib/queries/storefront-catalog";
import type { GridDensity } from "@/lib/storeLogic";
import { cn } from "@/lib/utils";
import type { CatalogFilter } from "@/shared/schemas/catalog";

const PLP_SKELETON_KEYS = [
	"sk-1",
	"sk-2",
	"sk-3",
	"sk-4",
	"sk-5",
	"sk-6",
] as const;

function resolvePlpHeading(
	filter: CatalogFilter,
	categoryNameBySlug: ReadonlyMap<string, string>,
	collectionNameBySlug: ReadonlyMap<string, string>,
): string {
	if (filter.collection) {
		return collectionNameBySlug.get(filter.collection) ?? filter.collection;
	}
	if (filter.category) {
		const categoryName =
			categoryNameBySlug.get(filter.category) ?? filter.category;
		return filter.genderAudience
			? `${getGenderAudienceLabel(filter.genderAudience)}'s ${categoryName}`
			: categoryName;
	}
	if (filter.genderAudience) {
		return `${getGenderAudienceLabel(filter.genderAudience)}'s Collection`;
	}
	if (filter.search) {
		return `Search: ${filter.search}`;
	}
	return "All Collections";
}

export const Route = createFileRoute("/products/")({
	validateSearch: validateStorefrontProductsSearch,
	loaderDeps: ({ search }) => ({
		filter: toStorefrontCatalogFilter(search),
	}),
	loader: async ({ context, deps }) => {
		const [productsData, facetsData] = await Promise.all([
			context.queryClient.query({
				...productsQueryOptions(deps.filter),
				staleTime: "static",
			}),
			context.queryClient.query({
				...catalogFacetsQueryOptions(),
				staleTime: "static",
			}),
		]);
		return {
			productsData,
			facetsData,
			filter: deps.filter,
		};
	},
	head: ({ loaderData }) => {
		const filter = loaderData?.filter ?? toStorefrontCatalogFilter({});
		const facets = loaderData?.facetsData;
		const categoryMap = new Map(
			(facets?.categories ?? []).map((c) => [c.slug, c.name]),
		);
		const collectionMap = new Map(
			(facets?.collections ?? []).map((c) => [c.slug, c.name]),
		);

		const heading = resolvePlpHeading(filter, categoryMap, collectionMap);
		const total = loaderData?.productsData.pagination.total ?? 0;
		const title = `${heading} | NOCTURA`;
		const description = `Explore ${total > 0 ? `${total} ` : ""}architectural ${heading.toLowerCase()} pieces crafted by NOCTURA. Filter by size, colour, stock availability, and IDR price range.`;

		const origin = getBaseUrl().replace(/\/+$/, "");
		const canonicalParams = new URLSearchParams();
		if (filter.category) canonicalParams.set("category", filter.category);
		if (filter.collection) canonicalParams.set("collection", filter.collection);
		if (filter.genderAudience) {
			canonicalParams.set("genderAudience", filter.genderAudience);
		}
		const canonicalQuery = canonicalParams.toString();
		const canonicalUrl = `${origin}/products${canonicalQuery ? `?${canonicalQuery}` : ""}`;

		const leadImageRaw = loaderData?.productsData.items[0]?.primaryImage?.url;
		const ogImage = leadImageRaw
			? buildFashionImageUrl(leadImageRaw, { width: 1200 })
			: undefined;

		const breadcrumbItems = [
			{
				"@type": "ListItem",
				position: 1,
				name: "Home",
				item: origin,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Products",
				item: `${origin}/products`,
			},
		];
		if (filter.category || filter.collection || filter.genderAudience) {
			breadcrumbItems.push({
				"@type": "ListItem",
				position: 3,
				name: heading,
				item: canonicalUrl,
			});
		}

		const jsonLd = [
			{
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: heading,
				description,
				url: canonicalUrl,
			},
			{
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				itemListElement: breadcrumbItems,
			},
		];

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ property: "og:site_name", content: "NOCTURA" },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:url", content: canonicalUrl },
				{ property: "og:type", content: "website" },
				...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
				{
					name: "twitter:card",
					content: ogImage ? "summary_large_image" : "summary",
				},
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
				...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
			],
			links: [{ rel: "canonical", href: canonicalUrl }],
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify(jsonLd),
				},
			],
		};
	},
	component: ProductsListingPage,
});

function ProductsListingPage() {
	const { filter } = Route.useLoaderDeps();
	const [params, setParams] = useQueryStates(storefrontProductsSearchParsers, {
		history: "replace",
	});
	const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
	const [gridDensity, setGridDensity] = useState<GridDensity>("3");

	const productsQuery = useQuery({
		...productsQueryOptions(filter),
		placeholderData: keepPreviousData,
	});
	const facetsQuery = useQuery(catalogFacetsQueryOptions());

	const facets = facetsQuery.data;
	const items = productsQuery.data?.items ?? [];
	const pagination = productsQuery.data?.pagination ?? {
		page: filter.page,
		limit: filter.limit,
		total: 0,
		totalPages: 1,
		hasNextPage: false,
		hasPrevPage: false,
	};

	const updateParams: StorefrontSearchUpdater = useCallback(
		(patch, options) => {
			void setParams(patch, {
				limitUrlUpdates: options?.debounced ? debounce(300) : undefined,
			});
		},
		[setParams],
	);

	const handleResetAllFilters = useCallback(() => {
		void setParams({
			search: "",
			category: "",
			collection: "",
			genderAudience: null,
			size: [],
			color: [],
			minPrice: null,
			maxPrice: null,
			inStock: false,
			sort: "newest",
			page: 1,
		});
	}, [setParams]);

	const handleRemoveChip = useCallback(
		(chip: ActiveFilterChip) => {
			switch (chip.kind) {
				case "search":
					updateParams({ search: "", page: 1 });
					break;
				case "category":
					updateParams({ category: "", page: 1 });
					break;
				case "collection":
					updateParams({ collection: "", page: 1 });
					break;
				case "genderAudience":
					updateParams({ genderAudience: null, page: 1 });
					break;
				case "size":
					updateParams({
						size: params.size.filter((s) => s !== chip.value),
						page: 1,
					});
					break;
				case "color":
					updateParams({
						color: params.color.filter((c) => c !== chip.value),
						page: 1,
					});
					break;
				case "price":
					updateParams({ minPrice: null, maxPrice: null, page: 1 });
					break;
				case "inStock":
					updateParams({ inStock: false, page: 1 });
					break;
			}
		},
		[params.color, params.size, updateParams],
	);

	const categoryNameBySlug = useMemo(
		() => new Map((facets?.categories ?? []).map((c) => [c.slug, c.name])),
		[facets?.categories],
	);

	const collectionNameBySlug = useMemo(
		() => new Map((facets?.collections ?? []).map((c) => [c.slug, c.name])),
		[facets?.collections],
	);

	const categoryPillItems: CategoryPillItem[] = useMemo(() => {
		const allItem: CategoryPillItem = {
			id: "",
			label: "All Pieces",
			count: facets?.totalPublishedProducts,
		};
		const categoryPills = (facets?.categories ?? [])
			.filter((cat) => cat.productCount > 0 || params.category === cat.slug)
			.map((cat) => ({
				id: cat.slug,
				label: cat.name,
				count: cat.productCount,
			}));
		return [allItem, ...categoryPills];
	}, [facets?.categories, facets?.totalPublishedProducts, params.category]);

	const activeChips = useMemo(
		() =>
			buildActiveFilterChips(params, {
				categoryNameBySlug,
				collectionNameBySlug,
			}),
		[params, categoryNameBySlug, collectionNameBySlug],
	);

	const activeFilterCount = countActiveStorefrontFilters(params);
	const heading = resolvePlpHeading(
		filter,
		categoryNameBySlug,
		collectionNameBySlug,
	);

	const gridClass = useMemo(() => {
		switch (gridDensity) {
			case "2":
				return "grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-14";
			case "3":
				return "grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 sm:gap-x-6 lg:gap-x-7 lg:gap-y-14";
			case "4":
				return "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-10 sm:gap-x-5 lg:gap-x-6 lg:gap-y-12";
			case "minimal":
				return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4";
		}
	}, [gridDensity]);

	const handlePageChange = (nextPage: number) => {
		void setParams({ page: nextPage }, { history: "push" });
		if (typeof window !== "undefined") {
			document
				.getElementById("catalog-grid")
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<MotionConfig reducedMotion="user">
			<StorefrontShell
				searchValue={params.search}
				onSearchChange={(nextSearch) =>
					updateParams(
						{ search: nextSearch, page: 1 },
						{ debounced: Boolean(nextSearch) },
					)
				}
				activeGenderAudience={params.genderAudience}
			>
				<section
					id="catalog-grid"
					aria-labelledby="plp-heading"
					className="mx-auto max-w-360 px-4 py-10 sm:px-8 lg:px-12 lg:py-14"
				>
					{/* Page Title & Live Result Summary */}
					<div className="flex flex-col gap-3 pb-7 sm:flex-row sm:items-end sm:justify-between">
						<div className="space-y-1.5">
							<h1
								id="plp-heading"
								className="font-display text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-[32px]"
							>
								{heading}
							</h1>
							<p className="text-xs text-muted-foreground tabular-nums">
								{pagination.total} {pagination.total === 1 ? "piece" : "pieces"}
								{params.search.trim()
									? ` matching "${params.search.trim()}"`
									: " · Curated architectural wardrobe"}
							</p>
						</div>
					</div>

					{/* Category Quick Navigation Pills */}
					<div className="pb-6">
						<CategoryPillsNav
							categories={categoryPillItems}
							activeCategory={params.category}
							onSelectCategory={(slug) =>
								updateParams({ category: slug, page: 1 })
							}
							layoutIdPrefix="plp-category-pills"
						/>
					</div>

					{/* Architectural Hairline Utility & Sort Toolbar */}
					<div className="flex flex-col gap-4 border-y border-border py-3 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setMobileFilterOpen(true)}
								className="h-9 gap-2.5 rounded-none border-border px-3.5 text-xs font-mono uppercase tracking-[0.06em] lg:hidden"
							>
								<SlidersHorizontal className="h-3.5 w-3.5 stroke-[1.5]" />
								<span>Filters</span>
								{activeFilterCount > 0 && (
									<Badge
										variant="default"
										className="ml-1 h-4 min-w-4 px-1 text-[10px] tabular-nums"
									>
										{activeFilterCount}
									</Badge>
								)}
							</Button>

							{activeChips.length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5">
									{activeChips.map((chip) => (
										<button
											key={chip.id}
											type="button"
											onClick={() => handleRemoveChip(chip)}
											aria-label={`Remove ${chip.label} filter`}
											className="inline-flex items-center gap-1.5 rounded-none border border-border bg-secondary/40 px-2.5 py-1 text-[11px] font-mono text-foreground hover:border-foreground transition-colors"
										>
											<span>{chip.label}</span>
											<X className="h-3 w-3 stroke-[1.5]" />
										</button>
									))}
									<button
										type="button"
										onClick={handleResetAllFilters}
										className="ml-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground underline underline-offset-4"
									>
										Clear All
									</button>
								</div>
							)}
						</div>

						<div className="flex items-center justify-between gap-4 md:justify-end shrink-0">
							<SortDropdown
								value={params.sort}
								onChange={(nextSort) =>
									updateParams({ sort: nextSort, page: 1 })
								}
							/>

							<div className="flex items-center gap-2">
								<span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline-block">
									View
								</span>
								<GridDensitySwitch
									density={gridDensity}
									onChangeDensity={setGridDensity}
								/>
							</div>
						</div>
					</div>

					{/* Desktop Sidebar + Product Grid Layout */}
					<div className="mt-8 flex flex-col lg:flex-row lg:items-start lg:gap-10">
						<FilterSidebar
							params={params}
							facets={facets}
							onUpdateParams={updateParams}
							onResetAll={handleResetAllFilters}
						/>

						<div className="min-w-0 flex-1">
							{productsQuery.isLoading ? (
								<div className={cn("grid", gridClass)}>
									{PLP_SKELETON_KEYS.map((key) => (
										<div key={key} className="space-y-3">
											<div className="aspect-3/4 w-full animate-pulse bg-studio" />
											<div className="h-4 w-3/4 animate-pulse bg-secondary" />
											<div className="h-3 w-1/3 animate-pulse bg-secondary" />
										</div>
									))}
								</div>
							) : productsQuery.isError ? (
								<div
									role="alert"
									className="my-12 flex flex-col items-center justify-center border border-border py-16 px-6 text-center space-y-4"
								>
									<p className="font-display text-lg font-medium text-foreground">
										Unable to load catalog pieces
									</p>
									<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
										{productsQuery.error instanceof Error
											? productsQuery.error.message
											: "Please try refreshing the catalog view."}
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => void productsQuery.refetch()}
									>
										Try Again
									</Button>
								</div>
							) : items.length > 0 ? (
								<>
									<div
										data-testid="plp-product-grid"
										className={cn(
											"grid transition-opacity duration-200",
											gridClass,
											productsQuery.isFetching && "opacity-75",
										)}
									>
										{items.map((item, idx) => (
											<CatalogProductCard
												key={item.id}
												item={item}
												minimalMode={gridDensity === "minimal"}
												priority={idx < 4}
											/>
										))}
									</div>

									<LoadMorePagination
										currentPage={pagination.page}
										totalPages={pagination.totalPages}
										currentCount={items.length}
										totalCount={pagination.total}
										onPageChange={handlePageChange}
										isLoading={productsQuery.isFetching}
									/>
								</>
							) : (
								<div className="my-12 flex flex-col items-center justify-center border border-border py-20 px-6 text-center space-y-4">
									<p className="font-display text-lg font-medium text-foreground">
										No pieces match your current filters
									</p>
									<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
										Try widening your price range, clearing selected sizes or
										colours, or browsing all pieces.
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleResetAllFilters}
									>
										Reset Filters
									</Button>
								</div>
							)}
						</div>
					</div>
				</section>

				<FilterDrawerSheet
					open={mobileFilterOpen}
					onOpenChange={setMobileFilterOpen}
					params={params}
					facets={facets}
					totalMatchingCount={pagination.total}
					onUpdateParams={updateParams}
					onResetAll={handleResetAllFilters}
				/>
			</StorefrontShell>
		</MotionConfig>
	);
}
