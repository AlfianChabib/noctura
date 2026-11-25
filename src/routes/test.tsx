import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { AtelierSection } from "@/components/AtelierSection";
import { CategoryPillsNav } from "@/components/CategoryPillsNav";
import { CountryCurrencyModal } from "@/components/CountryCurrencyModal";
import { DesignSystemView } from "@/components/DesignSystemView";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Footer } from "@/components/Footer";
import { GridDensitySwitch } from "@/components/GridDensitySwitch";
import { HeroSection } from "@/components/HeroSection";
import { InGridEditorialCard } from "@/components/InGridEditorialCard";
import { LoadMorePagination } from "@/components/LoadMorePagination";
import { type AppView, Navbar } from "@/components/Navbar";
import { NewsletterSection } from "@/components/NewsletterSection";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickView } from "@/components/ProductQuickView";
import { SearchModal } from "@/components/SearchModal";
import { ShoppingBagSheet } from "@/components/ShoppingBagSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	CATALOG_PRODUCTS,
	type ColorVariant,
	type Product,
	type ProductCategory,
} from "@/data/catalog";
import { COS_EASE } from "@/lib/motion";
import {
	addItemToBag,
	type BagItem,
	type CountryConfig,
	computeBagSummary,
	type FacetFilterOptions,
	filterAndSortProductsWithFacets,
	formatLocalizedPrice,
	type GridDensity,
	removeBagItem,
	type SortOption,
	SUPPORTED_COUNTRIES,
	toggleWishlistId,
	updateBagItemQuantity,
} from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

const CATEGORIES: ProductCategory[] = [
	"All",
	"Women",
	"Men",
	"Outerwear",
	"Knitwear",
	"Accessories",
];

export const Route = createFileRoute("/test")({
	component: StorefrontPage,
});

function StorefrontPage() {
	const [activeView, setActiveView] = useState<AppView>("storefront");
	const [activeCategory, setActiveCategory] = useState<ProductCategory>("All");
	const [facets, setFacets] = useState<FacetFilterOptions>({});
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [searchModalOpen, setSearchModalOpen] = useState(false);
	const [countryModalOpen, setCountryModalOpen] = useState(false);
	const [activeCountry, setActiveCountry] = useState<CountryConfig>(
		SUPPORTED_COUNTRIES[0],
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("featured");
	const [gridDensity, setGridDensity] = useState<GridDensity>("3");
	const [isDark, setIsDark] = useState(false);

	const ITEMS_PER_PAGE = 4;
	const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const [bagItems, setBagItems] = useState<BagItem[]>([]);
	const [bagOpen, setBagOpen] = useState(false);
	const [savedIds, setSavedIds] = useState<string[]>([]);

	const [detailState, setDetailState] = useState<{
		product: Product | null;
		color: ColorVariant | null;
	}>({ product: null, color: null });

	const [bagNotice, setBagNotice] = useState<string | null>(null);

	useEffect(() => {
		const root = document.documentElement;
		if (isDark) {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [isDark]);

	const categoryPillItems = useMemo(
		() =>
			CATEGORIES.map((cat) => ({
				id: cat,
				label: cat === "All" ? "All Pieces" : cat,
				count:
					cat === "All"
						? CATALOG_PRODUCTS.length
						: CATALOG_PRODUCTS.filter(
								(p) => p.category === cat || p.tags.includes(cat),
							).length,
			})),
		[],
	);

	const combinedFacets: FacetFilterOptions = useMemo(
		() => ({
			...facets,
			category: activeCategory,
		}),
		[facets, activeCategory],
	);

	const filteredProducts = useMemo(
		() =>
			filterAndSortProductsWithFacets(
				CATALOG_PRODUCTS,
				combinedFacets,
				searchQuery,
				sortBy,
			),
		[combinedFacets, searchQuery, sortBy],
	);

	const activeFacetCount =
		(facets.categories?.length || 0) +
		(facets.materials?.length || 0) +
		(facets.sizes?.length || 0) +
		(facets.colors?.length || 0) +
		(facets.minPrice !== undefined || facets.maxPrice !== undefined ? 1 : 0);

	const handleResetAllFilters = () => {
		setActiveCategory("All");
		setFacets({});
		setSearchQuery("");
		setSortBy("featured");
		setVisibleCount(ITEMS_PER_PAGE);
		setCurrentPage(1);
	};

	const totalPages = Math.max(
		1,
		Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
	);
	const displayedProducts = filteredProducts.slice(0, visibleCount);

	const handleLoadNextPage = () => {
		setIsLoadingMore(true);
		window.setTimeout(() => {
			setVisibleCount((prev) =>
				Math.min(filteredProducts.length, prev + ITEMS_PER_PAGE),
			);
			setCurrentPage((prev) => Math.min(totalPages, prev + 1));
			setIsLoadingMore(false);
		}, 350);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		setVisibleCount(page * ITEMS_PER_PAGE);
	};

	const bagSummary = useMemo(() => computeBagSummary(bagItems), [bagItems]);

	const handleAddToBag = (
		product: Product,
		color: ColorVariant,
		size: string,
	) => {
		setBagItems((prev) =>
			addItemToBag(prev, product, color.name, color.hex, size),
		);
		setBagNotice(`${product.title} (${size}) added to bag`);
		window.setTimeout(() => {
			setBagNotice((current) =>
				current === `${product.title} (${size}) added to bag` ? null : current,
			);
		}, 3200);
	};

	const handleUpdateBagQty = (key: string, delta: number) => {
		setBagItems((prev) => updateBagItemQuantity(prev, key, delta));
	};

	const handleRemoveBagItem = (key: string) => {
		setBagItems((prev) => removeBagItem(prev, key));
	};

	const handleToggleSave = (productId: string) => {
		setSavedIds((prev) => toggleWishlistId(prev, productId));
	};

	const scrollToCollection = () => {
		setActiveView("storefront");
		window.setTimeout(() => {
			document.getElementById("collection")?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}, 30);
	};

	const gridClass = useMemo(() => {
		switch (gridDensity) {
			case "2":
				return "grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-16";
			case "3":
				return "grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 sm:gap-x-6 lg:gap-x-7 lg:gap-y-14";
			case "4":
				return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 sm:gap-x-5 lg:gap-x-6 lg:gap-y-12";
			case "minimal":
				return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4";
		}
	}, [gridDensity]);

	return (
		<MotionConfig reducedMotion="user">
			<div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
				<Navbar
					activeView={activeView}
					activeCategory={activeCategory}
					bagCount={bagSummary.itemCount}
					searchQuery={searchQuery}
					onSelectCategory={setActiveCategory}
					onNavigateView={setActiveView}
					onSearchChange={setSearchQuery}
					onOpenBag={() => setBagOpen(true)}
					onOpenSearchModal={() => setSearchModalOpen(true)}
					onOpenCountryModal={() => setCountryModalOpen(true)}
					activeCountry={activeCountry}
				/>

				<main className="flex-1">
					<AnimatePresence mode="wait">
						{activeView === "storefront" ? (
							<motion.div
								key="storefront"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.25, ease: COS_EASE }}
							>
								<HeroSection
									onExploreCollection={scrollToCollection}
									onOpenDesignSystem={() => {
										setActiveView("design-system");
										window.scrollTo({ top: 0, behavior: "smooth" });
									}}
								/>

								{/* Featured Collection & Product Grid */}
								<section
									id="collection"
									aria-labelledby="collection-heading"
									className="scroll-mt-16 mx-auto max-w-360 px-4 py-14 sm:px-8 lg:px-12 lg:py-20"
								>
									{/* Section Title & Metadata */}
									<div className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-end sm:justify-between">
										<div className="space-y-1.5">
											<h2
												id="collection-heading"
												className="font-display text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-[28px]"
											>
												{activeCategory === "All"
													? "Autumn / Winter Collection"
													: `${activeCategory} Edit`}
											</h2>
											<p className="text-xs text-muted-foreground tabular-nums">
												{filteredProducts.length}{" "}
												{filteredProducts.length === 1 ? "piece" : "pieces"}
												{searchQuery.trim()
													? ` matching "${searchQuery.trim()}"`
													: " · Tailored essentials"}
											</p>
										</div>

										{savedIds.length > 0 && (
											<p className="text-xs text-muted-foreground tabular-nums">
												{savedIds.length} saved{" "}
												{savedIds.length === 1 ? "garment" : "garments"}
											</p>
										)}
									</div>

									{/* Category Quick Navigation Pills */}
									<div className="pb-6">
										<CategoryPillsNav
											categories={categoryPillItems}
											activeCategory={activeCategory}
											onSelectCategory={(cat) =>
												setActiveCategory(cat as ProductCategory)
											}
										/>
									</div>

									{/* Architectural Hairline Filter & Utility Toolbar */}
									<div className="flex flex-col gap-4 border-y border-border py-3 md:flex-row md:items-center md:justify-between">
										{/* Filter & Sort Drawer Trigger with Active Count */}
										<div className="flex items-center gap-3">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setFilterDrawerOpen(true)}
												className="h-9 gap-2.5 rounded-none border-border px-3.5 text-xs font-mono uppercase tracking-[0.06em]"
											>
												<SlidersHorizontal className="h-3.5 w-3.5 stroke-[1.5]" />
												<span>Filter & Sort</span>
												{activeFacetCount > 0 && (
													<Badge
														variant="default"
														className="ml-1 h-4 min-w-4 px-1 text-[10px] tabular-nums"
													>
														{activeFacetCount}
													</Badge>
												)}
											</Button>

											{activeFacetCount > 0 && (
												<button
													type="button"
													onClick={handleResetAllFilters}
													className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 font-mono uppercase tracking-wider"
												>
													Clear All
												</button>
											)}
										</div>

										{/* Grid Density Switch & Light/Dark Theme Switch */}
										<div className="flex items-center justify-between gap-4 md:justify-end shrink-0">
											<div className="flex items-center gap-2">
												<span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline-block">
													View
												</span>
												<GridDensitySwitch
													density={gridDensity}
													onChangeDensity={setGridDensity}
												/>
											</div>

											<button
												type="button"
												onClick={() => setIsDark((prev) => !prev)}
												aria-label={
													isDark
														? "Switch to light mode"
														: "Switch to dark mode"
												}
												className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 border border-border px-3 text-xs text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:border-foreground"
											>
												{isDark ? (
													<>
														<Sun className="h-3.5 w-3.5 stroke-[1.5]" />
														<span>Light</span>
													</>
												) : (
													<>
														<Moon className="h-3.5 w-3.5 stroke-[1.5]" />
														<span>Dark</span>
													</>
												)}
											</button>
										</div>
									</div>

									{/* Product Grid */}
									{filteredProducts.length > 0 ? (
										<>
											<div
												data-testid="product-grid"
												className={cn("mt-10 grid", gridClass)}
											>
												{displayedProducts.map((product, idx) => (
													<React.Fragment key={product.id}>
														<ProductCard
															product={product}
															isSaved={savedIds.includes(product.id)}
															minimalMode={gridDensity === "minimal"}
															formattedPrice={formatLocalizedPrice(
																product.price,
																activeCountry,
															)}
															onToggleSave={handleToggleSave}
															onQuickAdd={handleAddToBag}
															onOpenDetail={(prod, color) =>
																setDetailState({ product: prod, color })
															}
														/>
														{idx === 1 && gridDensity !== "minimal" && (
															<InGridEditorialCard
																title="The Autumn / Winter Atelier"
																eyebrow="Capsule Highlight"
																subtitle="Architectural virgin wool coats and double-faced cashmere tailored in pure minimalist lines."
																image="/src/assets/images/editorial_atelier_tailoring_1795436601242.jpg"
																ctaLabel="Discover Tailoring"
																onCtaClick={scrollToCollection}
																spanCols={gridDensity === "4" ? 2 : 1}
															/>
														)}
													</React.Fragment>
												))}
											</div>

											{/* COS Hybrid Pagination & Load More */}
											<LoadMorePagination
												currentPage={currentPage}
												totalPages={totalPages}
												currentCount={displayedProducts.length}
												totalCount={filteredProducts.length}
												onPageChange={handlePageChange}
												onLoadNextPage={handleLoadNextPage}
												isLoading={isLoadingMore}
											/>
										</>
									) : (
										<div className="my-16 flex flex-col items-center justify-center border border-border py-20 px-6 text-center space-y-4">
											<p className="font-display text-lg font-medium text-foreground">
												No pieces match your current selection
											</p>
											<p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
												Try clearing your search term or returning to the full
												Autumn / Winter collection.
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
								</section>

								<AtelierSection
									onOpenDesignSystem={() => {
										setActiveView("design-system");
										window.scrollTo({ top: 0, behavior: "smooth" });
									}}
								/>

								<NewsletterSection />
							</motion.div>
						) : (
							<motion.div
								key="design-system"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.25, ease: COS_EASE }}
							>
								<DesignSystemView
									isDark={isDark}
									onToggleTheme={() => setIsDark((prev) => !prev)}
									onBackToStorefront={() => {
										setActiveView("storefront");
										window.scrollTo({ top: 0, behavior: "smooth" });
									}}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</main>

				<Footer
					onSelectCategory={setActiveCategory}
					onNavigateView={setActiveView}
					activeCountry={activeCountry}
					onOpenCountryModal={() => setCountryModalOpen(true)}
				/>

				{/* Quick View Product Modal */}
				<ProductQuickView
					product={detailState.product}
					initialColor={detailState.color}
					isSaved={
						detailState.product
							? savedIds.includes(detailState.product.id)
							: false
					}
					onClose={() => setDetailState({ product: null, color: null })}
					onToggleSave={handleToggleSave}
					onAddToBag={handleAddToBag}
				/>

				{/* Slide-Over Shopping Bag Drawer */}
				<ShoppingBagSheet
					open={bagOpen}
					items={bagItems}
					onOpenChange={setBagOpen}
					onUpdateQuantity={handleUpdateBagQty}
					onRemoveItem={handleRemoveBagItem}
					onClearBag={() => setBagItems([])}
				/>

				{/* Slide-Over Filter & Sort Drawer */}
				<FilterDrawer
					open={filterDrawerOpen}
					onOpenChange={setFilterDrawerOpen}
					sortBy={sortBy}
					onSortByChange={setSortBy}
					facets={facets}
					onFacetsChange={setFacets}
					onResetAll={handleResetAllFilters}
					totalMatchingCount={filteredProducts.length}
					allProducts={CATALOG_PRODUCTS}
				/>

				{/* Fullscreen Architectural Search Modal */}
				<SearchModal
					open={searchModalOpen}
					onOpenChange={setSearchModalOpen}
					onSelectCategory={(category) => {
						setActiveCategory(category);
						setActiveView("storefront");
						scrollToCollection();
					}}
					onSelectProduct={(product) => {
						setDetailState({ product, color: product.colors[0] });
					}}
				/>

				{/* Slide-Out Country & Currency Selector Drawer */}
				<CountryCurrencyModal
					open={countryModalOpen}
					onOpenChange={setCountryModalOpen}
					activeCountry={activeCountry}
					onSelectCountry={(country) => {
						setActiveCountry(country);
					}}
				/>

				{/* Subtle Sharp-Edged Add-to-Bag Notification */}
				<AnimatePresence>
					{bagNotice && !bagOpen && (
						<motion.div
							role="status"
							aria-live="polite"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 8 }}
							transition={{ duration: 0.24, ease: COS_EASE }}
							className="fixed bottom-6 right-6 z-40 flex items-center gap-4 border border-foreground bg-primary px-5 py-3.5 text-xs text-primary-foreground"
						>
							<span>{bagNotice}</span>
							<button
								type="button"
								onClick={() => {
									setBagNotice(null);
									setBagOpen(true);
								}}
								className="font-medium underline underline-offset-4 whitespace-nowrap shrink-0"
							>
								View Bag
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</MotionConfig>
	);
}
