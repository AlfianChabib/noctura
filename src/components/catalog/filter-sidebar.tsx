import { AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatIdr } from "@/lib/format";
import {
	countActiveStorefrontFilters,
	getGenderAudienceLabel,
	type StorefrontProductsSearchState,
} from "@/lib/params/catalog-products";
import { cn } from "@/lib/utils";
import type { CatalogFacetsResponse } from "@/server/services/catalog.service";
import {
	GENDER_AUDIENCES,
	type GenderAudience,
} from "@/shared/schemas/catalog";

const DEFAULT_FALLBACK_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const PRICE_STEP_IDR = 50_000;

export type StorefrontSearchUpdater = (
	patch: Partial<StorefrontProductsSearchState>,
	options?: { debounced?: boolean },
) => void;

interface CatalogFilterPanelProps {
	params: StorefrontProductsSearchState;
	facets?: CatalogFacetsResponse;
	onUpdateParams: StorefrontSearchUpdater;
	onResetAll: () => void;
}

function toggleStringValue(list: readonly string[], target: string): string[] {
	const targetLower = target.toLowerCase();
	const exists = list.some((item) => item.toLowerCase() === targetLower);
	if (exists) {
		return list.filter((item) => item.toLowerCase() !== targetLower);
	}
	return [...list, target];
}

function CatalogFilterPanel({
	params,
	facets,
	onUpdateParams,
	onResetAll,
}: CatalogFilterPanelProps) {
	const activeCount = countActiveStorefrontFilters(params);

	const minBound = facets?.priceRange.minPriceIdr ?? 0;
	const rawMaxBound = facets?.priceRange.maxPriceIdr ?? 0;
	const maxBound =
		rawMaxBound > minBound ? rawMaxBound : Math.max(minBound, 5_000_000);
	const priceStep = maxBound - minBound <= 250_000 ? 10_000 : PRICE_STEP_IDR;

	const currentMin =
		params.minPrice !== null
			? Math.min(Math.max(params.minPrice, minBound), maxBound)
			: minBound;
	const currentMax =
		params.maxPrice !== null
			? Math.max(Math.min(params.maxPrice, maxBound), currentMin)
			: maxBound;

	const [priceDraft, setPriceDraft] = useState<[number, number]>([
		currentMin,
		currentMax,
	]);

	useEffect(() => {
		setPriceDraft([currentMin, currentMax]);
	}, [currentMin, currentMax]);

	const sizeOptions = useMemo(() => {
		if (facets && facets.sizes.length > 0) {
			return facets.sizes;
		}
		return DEFAULT_FALLBACK_SIZES.map((label, idx) => ({
			sizeLabel: label,
			sizeSortOrder: idx,
			productCount: undefined as number | undefined,
		}));
	}, [facets]);

	const genderCountMap = useMemo(() => {
		return new Map(
			(facets?.genderAudiences ?? []).map((item) => [
				item.genderAudience,
				item.productCount,
			]),
		);
	}, [facets?.genderAudiences]);

	const { rootCategories, childrenByParent } = useMemo(() => {
		const cats = facets?.categories ?? [];
		const roots = cats.filter((cat) => !cat.parentId);
		const byParent = new Map<string, typeof cats>();
		for (const cat of cats) {
			if (cat.parentId) {
				const group = byParent.get(cat.parentId) ?? [];
				group.push(cat);
				byParent.set(cat.parentId, group);
			}
		}
		return { rootCategories: roots, childrenByParent: byParent };
	}, [facets?.categories]);

	const handlePriceCommit = (nextValues: number[]) => {
		const [nextMin, nextMax] = nextValues;
		if (nextMin === undefined || nextMax === undefined) return;
		const normalizedMin = nextMin <= minBound ? null : nextMin;
		const normalizedMax = nextMax >= maxBound ? null : nextMax;
		onUpdateParams({
			minPrice: normalizedMin,
			maxPrice: normalizedMax,
			page: 1,
		});
	};

	return (
		<div className="space-y-5">
			{/* Availability Toggle */}
			<div className="flex items-center justify-between gap-3 border-b border-border pb-4">
				<div className="space-y-0.5">
					<Label
						htmlFor="plp-ready-stock-switch"
						className="text-xs font-medium text-foreground cursor-pointer"
					>
						Ready Stock Only
					</Label>
					<p className="text-[11px] text-muted-foreground">
						Hide currently sold-out items
					</p>
				</div>
				<Switch
					id="plp-ready-stock-switch"
					checked={params.inStock}
					onCheckedChange={(checked) =>
						onUpdateParams({ inStock: checked, page: 1 })
					}
					aria-label="Show ready stock products only"
				/>
			</div>

			<Accordion
				type="multiple"
				defaultValue={["category", "size", "color", "price"]}
				className="w-full"
			>
				{/* Department / Gender Audience */}
				<AccordionItem value="department">
					<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
						Department
					</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-2 pt-1">
							<button
								type="button"
								onClick={() =>
									onUpdateParams({ genderAudience: null, page: 1 })
								}
								className={cn(
									"flex w-full items-center justify-between py-1 text-xs transition-colors text-left",
									!params.genderAudience
										? "font-medium text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<span>All Departments</span>
								{facets && (
									<span className="font-mono text-[11px] tabular-nums">
										{facets.totalPublishedProducts}
									</span>
								)}
							</button>
							{GENDER_AUDIENCES.map((audience: GenderAudience) => {
								const active = params.genderAudience === audience;
								const count = genderCountMap.get(audience) ?? 0;
								return (
									<button
										key={audience}
										type="button"
										aria-pressed={active}
										onClick={() =>
											onUpdateParams({
												genderAudience: active ? null : audience,
												page: 1,
											})
										}
										className={cn(
											"flex w-full items-center justify-between py-1 text-xs transition-colors text-left",
											active
												? "font-medium text-foreground"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										<span className="flex items-center gap-2">
											<span
												className={cn(
													"inline-block h-1.5 w-1.5",
													active ? "bg-foreground" : "bg-transparent",
												)}
											/>
											{getGenderAudienceLabel(audience)}
										</span>
										{facets && (
											<span className="font-mono text-[11px] tabular-nums">
												{count}
											</span>
										)}
									</button>
								);
							})}
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Category Tree */}
				{rootCategories.length > 0 && (
					<AccordionItem value="category">
						<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
							Category
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-2 pt-1">
								<button
									type="button"
									onClick={() => onUpdateParams({ category: "", page: 1 })}
									className={cn(
										"flex w-full items-center justify-between py-1 text-xs transition-colors text-left",
										!params.category
											? "font-medium text-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<span>All Categories</span>
									{facets && (
										<span className="font-mono text-[11px] tabular-nums">
											{facets.totalPublishedProducts}
										</span>
									)}
								</button>

								{rootCategories.map((cat) => {
									const isSelected = params.category === cat.slug;
									const children = childrenByParent.get(cat.id) ?? [];
									return (
										<div key={cat.id} className="space-y-1.5">
											<button
												type="button"
												aria-pressed={isSelected}
												onClick={() =>
													onUpdateParams({
														category: isSelected ? "" : cat.slug,
														page: 1,
													})
												}
												className={cn(
													"flex w-full items-center justify-between py-1 text-xs transition-colors text-left",
													isSelected
														? "font-medium text-foreground"
														: "text-muted-foreground hover:text-foreground",
												)}
											>
												<span className="flex items-center gap-2">
													<span
														className={cn(
															"inline-block h-1.5 w-1.5",
															isSelected ? "bg-foreground" : "bg-transparent",
														)}
													/>
													{cat.name}
												</span>
												<span className="font-mono text-[11px] tabular-nums">
													{cat.productCount}
												</span>
											</button>

											{children.length > 0 && (
												<div className="ml-3.5 space-y-1 border-l border-border pl-3">
													{children.map((child) => {
														const childSelected =
															params.category === child.slug;
														return (
															<button
																key={child.id}
																type="button"
																aria-pressed={childSelected}
																onClick={() =>
																	onUpdateParams({
																		category: childSelected ? "" : child.slug,
																		page: 1,
																	})
																}
																className={cn(
																	"flex w-full items-center justify-between py-0.5 text-xs transition-colors text-left",
																	childSelected
																		? "font-medium text-foreground"
																		: "text-muted-foreground hover:text-foreground",
																)}
															>
																<span>{child.name}</span>
																<span className="font-mono text-[11px] tabular-nums">
																	{child.productCount}
																</span>
															</button>
														);
													})}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Editorial Collections */}
				{facets && facets.collections.length > 0 && (
					<AccordionItem value="collection">
						<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
							Collection
						</AccordionTrigger>
						<AccordionContent>
							<div className="space-y-2 pt-1">
								{facets.collections.map((col) => {
									const isSelected = params.collection === col.slug;
									return (
										<button
											key={col.id}
											type="button"
											aria-pressed={isSelected}
											onClick={() =>
												onUpdateParams({
													collection: isSelected ? "" : col.slug,
													page: 1,
												})
											}
											className={cn(
												"flex w-full items-center justify-between py-1 text-xs transition-colors text-left",
												isSelected
													? "font-medium text-foreground"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											<span>{col.name}</span>
											<span className="font-mono text-[11px] tabular-nums">
												{col.productCount}
											</span>
										</button>
									);
								})}
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Size Checkboxes */}
				<AccordionItem value="size">
					<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
						Size
					</AccordionTrigger>
					<AccordionContent>
						<div className="grid grid-cols-2 gap-2 pt-1">
							{sizeOptions.map((item) => {
								const isChecked = params.size.some(
									(s) => s.toLowerCase() === item.sizeLabel.toLowerCase(),
								);
								const inputId = `plp-size-${item.sizeLabel.toLowerCase().replace(/\s+/g, "-")}`;
								return (
									<div
										key={item.sizeLabel}
										className="flex items-center justify-between border border-border px-2.5 py-2 text-xs text-foreground"
									>
										<div className="flex items-center gap-2 min-w-0">
											<Checkbox
												id={inputId}
												checked={isChecked}
												onCheckedChange={() =>
													onUpdateParams({
														size: toggleStringValue(
															params.size,
															item.sizeLabel,
														),
														page: 1,
													})
												}
											/>
											<Label
												htmlFor={inputId}
												className="cursor-pointer text-xs font-normal truncate"
											>
												{item.sizeLabel}
											</Label>
										</div>
										{typeof item.productCount === "number" && (
											<span className="font-mono text-[10px] text-muted-foreground tabular-nums">
												{item.productCount}
											</span>
										)}
									</div>
								);
							})}
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Visual Color Swatches */}
				{facets && facets.colors.length > 0 && (
					<AccordionItem value="color">
						<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
							Colour
						</AccordionTrigger>
						<AccordionContent>
							<div className="grid grid-cols-2 gap-2 pt-1">
								{facets.colors.map((col) => {
									const isChecked = params.color.some(
										(c) => c.toLowerCase() === col.colorName.toLowerCase(),
									);
									return (
										<button
											key={col.colorName}
											type="button"
											aria-pressed={isChecked}
											onClick={() =>
												onUpdateParams({
													color: toggleStringValue(params.color, col.colorName),
													page: 1,
												})
											}
											className={cn(
												"flex items-center justify-between gap-2 border px-2.5 py-2 text-xs transition-colors rounded-none text-left",
												isChecked
													? "border-foreground bg-secondary font-medium text-foreground"
													: "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
											)}
										>
											<span className="flex items-center gap-2 min-w-0">
												<span
													className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black/20 dark:border-white/25"
													style={{ backgroundColor: col.colorHex }}
													aria-hidden="true"
												>
													{isChecked && (
														<Check className="h-2.5 w-2.5 stroke-[2.5] text-white mix-blend-difference" />
													)}
												</span>
												<span className="truncate">{col.colorName}</span>
											</span>
											<span className="font-mono text-[10px] tabular-nums shrink-0">
												{col.productCount}
											</span>
										</button>
									);
								})}
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Dual Price Range Slider (IDR) */}
				<AccordionItem value="price">
					<AccordionTrigger className="text-xs uppercase tracking-[0.06em]">
						Price (IDR)
					</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-4 pt-2">
							<div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums text-foreground">
								<span>{formatIdr(priceDraft[0])}</span>
								<span className="text-muted-foreground">—</span>
								<span>{formatIdr(priceDraft[1])}</span>
							</div>

							<Slider
								min={minBound}
								max={maxBound}
								step={priceStep}
								value={priceDraft}
								onValueChange={(values) => {
									if (values.length >= 2) {
										setPriceDraft([values[0], values[1]]);
									}
								}}
								onValueCommit={handlePriceCommit}
								aria-label="Filter price range in Indonesian Rupiah"
								className="**:data-[slot=slider-track]:rounded-none **:data-[slot=slider-track]:h-1 **:data-[slot=slider-thumb]:rounded-none **:data-[slot=slider-thumb]:size-3.5"
							/>

							<div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
								<span>Min {formatIdr(minBound)}</span>
								<span>Max {formatIdr(maxBound)}</span>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			{activeCount > 0 && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onResetAll}
					className="w-full font-mono text-xs uppercase tracking-wider"
				>
					Reset Filters ({activeCount})
				</Button>
			)}
		</div>
	);
}

export interface FilterSidebarProps {
	params: StorefrontProductsSearchState;
	facets?: CatalogFacetsResponse;
	onUpdateParams: StorefrontSearchUpdater;
	onResetAll: () => void;
	className?: string;
}

export function FilterSidebar({
	params,
	facets,
	onUpdateParams,
	onResetAll,
	className,
}: FilterSidebarProps) {
	return (
		<aside
			aria-label="Product catalog filters"
			className={cn(
				"hidden lg:block w-64 xl:w-72 shrink-0 border-r border-border pr-8",
				className,
			)}
		>
			<div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
				<div className="mb-4 flex items-center justify-between border-b border-border pb-3">
					<h2 className="font-display text-xs font-medium uppercase tracking-[0.08em] text-foreground">
						Filters
					</h2>
					{countActiveStorefrontFilters(params) > 0 && (
						<button
							type="button"
							onClick={onResetAll}
							className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground underline underline-offset-4"
						>
							Clear
						</button>
					)}
				</div>

				<CatalogFilterPanel
					params={params}
					facets={facets}
					onUpdateParams={onUpdateParams}
					onResetAll={onResetAll}
				/>
			</div>
		</aside>
	);
}

export interface FilterDrawerSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	params: StorefrontProductsSearchState;
	facets?: CatalogFacetsResponse;
	totalMatchingCount: number;
	onUpdateParams: StorefrontSearchUpdater;
	onResetAll: () => void;
}

export function FilterDrawerSheet({
	open,
	onOpenChange,
	params,
	facets,
	totalMatchingCount,
	onUpdateParams,
	onResetAll,
}: FilterDrawerSheetProps) {
	const activeCount = countActiveStorefrontFilters(params);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<AnimatePresence>
				{open && (
					<SheetContent
						side="right"
						className="flex h-full w-full flex-col p-0 sm:max-w-110"
					>
						<div className="border-b border-border px-6 py-5">
							<div className="pr-10">
								<SheetTitle className="font-display text-sm font-medium tracking-[0.08em] uppercase">
									Filter Collection
								</SheetTitle>
								<SheetDescription className="mt-1 text-xs text-muted-foreground tabular-nums">
									{totalMatchingCount}{" "}
									{totalMatchingCount === 1 ? "piece" : "pieces"} available
								</SheetDescription>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-4">
							<CatalogFilterPanel
								params={params}
								facets={facets}
								onUpdateParams={onUpdateParams}
								onResetAll={onResetAll}
							/>
						</div>

						<div className="border-t border-border bg-background p-4 flex items-center gap-3">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={activeCount === 0}
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
}
