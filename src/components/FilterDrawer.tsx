import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type * as React from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import type { Product, ProductCategory } from "@/data/catalog";
import {
	type FacetFilterOptions,
	getProductMaterial,
	type SortOption,
} from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

const AVAILABLE_MATERIALS = [
	"Virgin Wool",
	"Cashmere",
	"Organic Cotton",
	"Leather",
	"Cotton Gabardine",
];

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "One Size"];

const AVAILABLE_COLORS = [
	{ name: "Black", hex: "#121212" },
	{ name: "Charcoal", hex: "#383838" },
	{ name: "Stone", hex: "#C7C3BC" },
	{ name: "White", hex: "#FAFAFA" },
	{ name: "Slate", hex: "#393E41" },
];

const AVAILABLE_CATEGORIES: ProductCategory[] = [
	"Outerwear",
	"Knitwear",
	"Women",
	"Men",
	"Accessories",
];

interface FilterDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sortBy: SortOption;
	onSortByChange: (sortBy: SortOption) => void;
	facets: FacetFilterOptions;
	onFacetsChange: (facets: FacetFilterOptions) => void;
	onResetAll: () => void;
	totalMatchingCount: number;
	allProducts: Product[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
	open,
	onOpenChange,
	sortBy,
	onSortByChange,
	facets,
	onFacetsChange,
	onResetAll,
	totalMatchingCount,
	allProducts,
}) => {
	const toggleCategory = (cat: ProductCategory) => {
		const current = facets.categories || [];
		const updated = current.includes(cat)
			? current.filter((c) => c !== cat)
			: [...current, cat];
		onFacetsChange({ ...facets, categories: updated });
	};

	const toggleMaterial = (mat: string) => {
		const current = facets.materials || [];
		const updated = current.includes(mat)
			? current.filter((m) => m !== mat)
			: [...current, mat];
		onFacetsChange({ ...facets, materials: updated });
	};

	const toggleSize = (size: string) => {
		const current = facets.sizes || [];
		const updated = current.includes(size)
			? current.filter((s) => s !== size)
			: [...current, size];
		onFacetsChange({ ...facets, sizes: updated });
	};

	const toggleColor = (colorName: string) => {
		const current = facets.colors || [];
		const updated = current.includes(colorName)
			? current.filter((c) => c !== colorName)
			: [...current, colorName];
		onFacetsChange({ ...facets, colors: updated });
	};

	const setPricePreset = (
		preset: "all" | "under200" | "200to300" | "over300",
	) => {
		if (preset === "under200") {
			onFacetsChange({ ...facets, minPrice: 0, maxPrice: 200 });
		} else if (preset === "200to300") {
			onFacetsChange({ ...facets, minPrice: 200, maxPrice: 300 });
		} else if (preset === "over300") {
			onFacetsChange({ ...facets, minPrice: 300, maxPrice: undefined });
		} else {
			onFacetsChange({ ...facets, minPrice: undefined, maxPrice: undefined });
		}
	};

	const getCategoryCount = (cat: ProductCategory) =>
		allProducts.filter((p) => p.category === cat || p.tags.includes(cat))
			.length;

	const getMaterialCount = (mat: string) =>
		allProducts.filter((p) => getProductMaterial(p.composition) === mat).length;

	const getSizeCount = (size: string) =>
		allProducts.filter((p) => p.sizes.includes(size)).length;

	const getColorCount = (colorName: string) =>
		allProducts.filter((p) =>
			p.colors.some((c) =>
				c.name.toLowerCase().includes(colorName.toLowerCase()),
			),
		).length;

	const activeFilterCount =
		(facets.categories?.length || 0) +
		(facets.materials?.length || 0) +
		(facets.sizes?.length || 0) +
		(facets.colors?.length || 0) +
		(facets.minPrice !== undefined || facets.maxPrice !== undefined ? 1 : 0);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<AnimatePresence>
				{open && (
					<SheetContent
						side="right"
						className="flex h-full w-full flex-col p-0 sm:max-w-110"
					>
						{/* Editorial Header */}
						<div className="border-b border-border px-6 py-5">
							<div className="pr-10">
								<SheetTitle className="font-display text-sm font-medium tracking-[0.08em] uppercase">
									Filter & Sort
								</SheetTitle>
								<SheetDescription className="mt-1 text-xs text-muted-foreground">
									{totalMatchingCount}{" "}
									{totalMatchingCount === 1 ? "piece" : "pieces"} available
								</SheetDescription>
							</div>
						</div>

						{/* Active Filter Pills Bar */}
						{activeFilterCount > 0 && (
							<div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-secondary/30 px-6 py-3">
								<span className="text-[11px] font-mono uppercase text-muted-foreground mr-1">
									Active:
								</span>
								{facets.categories?.map((cat) => (
									<button
										key={cat}
										type="button"
										onClick={() => toggleCategory(cat as ProductCategory)}
										className="inline-flex items-center gap-1 rounded-none border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:border-foreground"
									>
										<span>{cat}</span>
										<X className="h-3 w-3 stroke-[1.5]" />
									</button>
								))}
								{facets.materials?.map((mat) => (
									<button
										key={mat}
										type="button"
										onClick={() => toggleMaterial(mat)}
										className="inline-flex items-center gap-1 rounded-none border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:border-foreground"
									>
										<span>{mat}</span>
										<X className="h-3 w-3 stroke-[1.5]" />
									</button>
								))}
								{facets.sizes?.map((size) => (
									<button
										key={size}
										type="button"
										onClick={() => toggleSize(size)}
										className="inline-flex items-center gap-1 rounded-none border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:border-foreground"
									>
										<span>Size {size}</span>
										<X className="h-3 w-3 stroke-[1.5]" />
									</button>
								))}
								{facets.colors?.map((col) => (
									<button
										key={col}
										type="button"
										onClick={() => toggleColor(col)}
										className="inline-flex items-center gap-1 rounded-none border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:border-foreground"
									>
										<span>{col}</span>
										<X className="h-3 w-3 stroke-[1.5]" />
									</button>
								))}
								{(facets.minPrice !== undefined ||
									facets.maxPrice !== undefined) && (
									<button
										type="button"
										onClick={() => setPricePreset("all")}
										className="inline-flex items-center gap-1 rounded-none border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:border-foreground"
									>
										<span>Price filtered</span>
										<X className="h-3 w-3 stroke-[1.5]" />
									</button>
								)}
							</div>
						)}

						{/* Scrollable Facet Accordions */}
						<div className="flex-1 overflow-y-auto px-6 py-4">
							{/* Sort By Section */}
							<div className="border-b border-border pb-6 pt-2">
								<span className="font-display text-xs font-medium tracking-[0.06em] uppercase text-foreground">
									Sort By
								</span>
								<RadioGroup
									value={sortBy}
									onValueChange={(val) => onSortByChange(val as SortOption)}
									className="mt-3.5 space-y-2.5"
								>
									<div className="flex items-center gap-3 text-xs text-foreground">
										<RadioGroupItem
											value="featured"
											id="drawer-sort-featured"
										/>
										<Label
											htmlFor="drawer-sort-featured"
											className="cursor-pointer text-xs font-normal"
										>
											Featured / Curated
										</Label>
									</div>
									<div className="flex items-center gap-3 text-xs text-foreground">
										<RadioGroupItem value="newest" id="drawer-sort-newest" />
										<Label
											htmlFor="drawer-sort-newest"
											className="cursor-pointer text-xs font-normal"
										>
											New Arrivals
										</Label>
									</div>
									<div className="flex items-center gap-3 text-xs text-foreground">
										<RadioGroupItem
											value="price-asc"
											id="drawer-sort-price-asc"
										/>
										<Label
											htmlFor="drawer-sort-price-asc"
											className="cursor-pointer text-xs font-normal"
										>
											Price: Low to High
										</Label>
									</div>
									<div className="flex items-center gap-3 text-xs text-foreground">
										<RadioGroupItem
											value="price-desc"
											id="drawer-sort-price-desc"
										/>
										<Label
											htmlFor="drawer-sort-price-desc"
											className="cursor-pointer text-xs font-normal"
										>
											Price: High to Low
										</Label>
									</div>
								</RadioGroup>
							</div>

							{/* Accordion Facets */}
							<Accordion
								type="multiple"
								defaultValue={["category", "material", "size"]}
								className="w-full"
							>
								{/* Category Accordion */}
								<AccordionItem value="category">
									<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
										Category
									</AccordionTrigger>
									<AccordionContent>
										<div className="space-y-2.5 pt-1">
											{AVAILABLE_CATEGORIES.map((cat) => {
												const isChecked =
													facets.categories?.includes(cat) || false;
												const count = getCategoryCount(cat);
												const id = `cat-facet-${cat.toLowerCase()}`;
												return (
													<div
														key={cat}
														className="flex items-center justify-between text-xs text-foreground"
													>
														<div className="flex items-center gap-2.5">
															<Checkbox
																id={id}
																checked={isChecked}
																onCheckedChange={() => toggleCategory(cat)}
															/>
															<Label
																htmlFor={id}
																className="cursor-pointer text-xs font-normal"
															>
																{cat}
															</Label>
														</div>
														<span className="text-[11px] text-muted-foreground tabular-nums">
															{count}
														</span>
													</div>
												);
											})}
										</div>
									</AccordionContent>
								</AccordionItem>

								{/* Material Accordion */}
								<AccordionItem value="material">
									<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
										Material
									</AccordionTrigger>
									<AccordionContent>
										<div className="space-y-2.5 pt-1">
											{AVAILABLE_MATERIALS.map((mat) => {
												const isChecked =
													facets.materials?.includes(mat) || false;
												const count = getMaterialCount(mat);
												const id = `mat-facet-${mat.toLowerCase().replace(/\s+/g, "-")}`;
												return (
													<div
														key={mat}
														className="flex items-center justify-between text-xs text-foreground"
													>
														<div className="flex items-center gap-2.5">
															<Checkbox
																id={id}
																checked={isChecked}
																onCheckedChange={() => toggleMaterial(mat)}
															/>
															<Label
																htmlFor={id}
																className="cursor-pointer text-xs font-normal"
															>
																{mat}
															</Label>
														</div>
														<span className="text-[11px] text-muted-foreground tabular-nums">
															{count}
														</span>
													</div>
												);
											})}
										</div>
									</AccordionContent>
								</AccordionItem>

								{/* Size Accordion */}
								<AccordionItem value="size">
									<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
										Size
									</AccordionTrigger>
									<AccordionContent>
										<div className="grid grid-cols-3 gap-2 pt-1">
											{AVAILABLE_SIZES.map((size) => {
												const isChecked = facets.sizes?.includes(size) || false;
												const count = getSizeCount(size);
												return (
													<button
														key={size}
														type="button"
														onClick={() => toggleSize(size)}
														aria-pressed={isChecked}
														className={cn(
															"flex h-9 items-center justify-between border px-2.5 text-xs transition-colors rounded-none",
															isChecked
																? "border-foreground bg-foreground text-background font-medium"
																: "border-border bg-background text-foreground hover:border-foreground",
														)}
													>
														<span>{size}</span>
														<span
															className={cn(
																"text-[10px] tabular-nums",
																isChecked
																	? "text-background/80"
																	: "text-muted-foreground",
															)}
														>
															{count}
														</span>
													</button>
												);
											})}
										</div>
									</AccordionContent>
								</AccordionItem>

								{/* Color Accordion */}
								<AccordionItem value="color">
									<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
										Colour
									</AccordionTrigger>
									<AccordionContent>
										<div className="space-y-2.5 pt-1">
											{AVAILABLE_COLORS.map((col) => {
												const isChecked =
													facets.colors?.includes(col.name) || false;
												const count = getColorCount(col.name);
												const id = `col-facet-${col.name.toLowerCase()}`;
												return (
													<div
														key={col.name}
														className="flex items-center justify-between text-xs text-foreground"
													>
														<div className="flex items-center gap-2.5">
															<Checkbox
																id={id}
																checked={isChecked}
																onCheckedChange={() => toggleColor(col.name)}
															/>
															<span
																className="h-3.5 w-3.5 border border-border"
																style={{ backgroundColor: col.hex }}
																aria-hidden="true"
															/>
															<Label
																htmlFor={id}
																className="cursor-pointer text-xs font-normal"
															>
																{col.name}
															</Label>
														</div>
														<span className="text-[11px] text-muted-foreground tabular-nums">
															{count}
														</span>
													</div>
												);
											})}
										</div>
									</AccordionContent>
								</AccordionItem>

								{/* Price Range Accordion */}
								<AccordionItem value="price">
									<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
										Price
									</AccordionTrigger>
									<AccordionContent>
										<div className="grid grid-cols-2 gap-2 pt-1">
											<button
												type="button"
												onClick={() => setPricePreset("all")}
												className={cn(
													"h-9 border px-3 text-xs text-left transition-colors rounded-none",
													facets.minPrice === undefined &&
														facets.maxPrice === undefined
														? "border-foreground bg-foreground text-background font-medium"
														: "border-border bg-background text-foreground hover:border-foreground",
												)}
											>
												All Prices
											</button>
											<button
												type="button"
												onClick={() => setPricePreset("under200")}
												className={cn(
													"h-9 border px-3 text-xs text-left transition-colors rounded-none",
													facets.maxPrice === 200 && facets.minPrice === 0
														? "border-foreground bg-foreground text-background font-medium"
														: "border-border bg-background text-foreground hover:border-foreground",
												)}
											>
												Under $200
											</button>
											<button
												type="button"
												onClick={() => setPricePreset("200to300")}
												className={cn(
													"h-9 border px-3 text-xs text-left transition-colors rounded-none",
													facets.minPrice === 200 && facets.maxPrice === 300
														? "border-foreground bg-foreground text-background font-medium"
														: "border-border bg-background text-foreground hover:border-foreground",
												)}
											>
												$200 – $300
											</button>
											<button
												type="button"
												onClick={() => setPricePreset("over300")}
												className={cn(
													"h-9 border px-3 text-xs text-left transition-colors rounded-none",
													facets.minPrice === 300 &&
														facets.maxPrice === undefined
														? "border-foreground bg-foreground text-background font-medium"
														: "border-border bg-background text-foreground hover:border-foreground",
												)}
											>
												Over $300
											</button>
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</div>

						{/* Sticky Bottom Actions */}
						<div className="border-t border-border bg-background p-4 flex items-center gap-3">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={activeFilterCount === 0}
								onClick={onResetAll}
								className="flex-1 uppercase font-mono tracking-wider text-xs"
							>
								Reset All
							</Button>
							<Button
								type="button"
								variant="default"
								size="sm"
								onClick={() => onOpenChange(false)}
								className="flex-2 uppercase font-mono tracking-wider text-xs font-medium"
							>
								View {totalMatchingCount}{" "}
								{totalMatchingCount === 1 ? "Piece" : "Pieces"}
							</Button>
						</div>
					</SheetContent>
				)}
			</AnimatePresence>
		</Sheet>
	);
};
