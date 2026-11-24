import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Columns3, LayoutGrid, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AtelierSection } from "@/components/AtelierSection";
import { DesignSystemView } from "@/components/DesignSystemView";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { type AppView, Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickView } from "@/components/ProductQuickView";
import { ShoppingBagSheet } from "@/components/ShoppingBagSheet";
import { Button } from "@/components/ui/button";
import {
	CATALOG_PRODUCTS,
	type ColorVariant,
	type Product,
	type ProductCategory,
} from "@/data/catalog";
import { COS_EASE, COS_SPRING } from "@/lib/motion";
import {
	addItemToBag,
	type BagItem,
	computeBagSummary,
	filterAndSortProducts,
	removeBagItem,
	type SortOption,
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
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("featured");
	const [gridCols, setGridCols] = useState<3 | 4>(3);
	const [isDark, setIsDark] = useState(false);

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

	const filteredProducts = useMemo(
		() =>
			filterAndSortProducts(
				CATALOG_PRODUCTS,
				activeCategory,
				searchQuery,
				sortBy,
			),
		[activeCategory, searchQuery, sortBy],
	);

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

									{/* Architectural Hairline Filter & Utility Toolbar */}
									<div className="flex flex-col gap-4 border-y border-border py-3.5 md:flex-row md:items-center md:justify-between">
										{/* Category Filter Tabs with Shared Framer Motion layoutId Underline */}
										<div
											role="tablist"
											aria-label="Filter collection by category"
											className="flex items-center gap-3.5 sm:gap-6 overflow-x-auto pb-1 pr-2 md:pb-0"
										>
											{CATEGORIES.map((category) => {
												const isActive = activeCategory === category;
												return (
													<button
														key={category}
														type="button"
														role="tab"
														aria-selected={isActive}
														onClick={() => setActiveCategory(category)}
														className={cn(
															"relative whitespace-nowrap shrink-0 py-1.5 text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:text-foreground",
															isActive
																? "font-medium text-foreground"
																: "text-muted-foreground hover:text-foreground",
														)}
													>
														{category}
														{isActive && (
															<motion.span
																layoutId="active-category-line"
																transition={COS_SPRING}
																className="absolute inset-x-0 bottom-0 h-[1.5px] bg-foreground"
															/>
														)}
													</button>
												);
											})}
										</div>

										{/* Sort, Grid Density & Light/Dark Theme Switch */}
										<div className="flex items-center justify-between gap-4 md:justify-end shrink-0">
											<div className="flex items-center gap-2">
												<label
													htmlFor="collection-sort"
													className="text-xs text-muted-foreground whitespace-nowrap"
												>
													Sort
												</label>
												<select
													id="collection-sort"
													value={sortBy}
													onChange={(e) =>
														setSortBy(e.target.value as SortOption)
													}
													className="h-9 rounded-none border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:border-foreground"
												>
													<option value="featured">Featured</option>
													<option value="price-asc">Price: Low to High</option>
													<option value="price-desc">Price: High to Low</option>
												</select>
											</div>

											<div className="hidden lg:flex items-center border border-border">
												<button
													type="button"
													onClick={() => setGridCols(3)}
													aria-label="3-column grid view"
													aria-pressed={gridCols === 3}
													className={cn(
														"inline-flex h-9 w-9 items-center justify-center transition-colors",
														gridCols === 3
															? "bg-primary text-primary-foreground"
															: "bg-background text-muted-foreground hover:text-foreground",
													)}
												>
													<Columns3 className="h-3.5 w-3.5 stroke-[1.5]" />
												</button>
												<button
													type="button"
													onClick={() => setGridCols(4)}
													aria-label="4-column grid view"
													aria-pressed={gridCols === 4}
													className={cn(
														"inline-flex h-9 w-9 items-center justify-center border-l border-border transition-colors",
														gridCols === 4
															? "bg-primary text-primary-foreground"
															: "bg-background text-muted-foreground hover:text-foreground",
													)}
												>
													<LayoutGrid className="h-3.5 w-3.5 stroke-[1.5]" />
												</button>
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
										<div
											data-testid="product-grid"
											className={cn(
												"mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:gap-x-7 lg:gap-y-14",
												gridCols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
											)}
										>
											{filteredProducts.map((product) => (
												<ProductCard
													key={product.id}
													product={product}
													isSaved={savedIds.includes(product.id)}
													onToggleSave={handleToggleSave}
													onQuickAdd={handleAddToBag}
													onOpenDetail={(prod, color) =>
														setDetailState({ product: prod, color })
													}
												/>
											))}
										</div>
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
												onClick={() => {
													setActiveCategory("All");
													setSearchQuery("");
												}}
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
