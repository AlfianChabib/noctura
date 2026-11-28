import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import {
	ArrowLeft,
	Bookmark,
	Check,
	ChevronRight,
	ShieldCheck,
	Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ColorSwatchPicker } from "@/components/catalog/color-swatch-picker";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { SizeGuideModal } from "@/components/catalog/size-guide-modal";
import { SizeSelector } from "@/components/catalog/size-selector";
import { StorefrontShell } from "@/components/catalog/storefront-shell";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/api-client";
import { formatIdr } from "@/lib/format";
import { getGenderAudienceLabel } from "@/lib/params/catalog-products";
import {
	resolveInitialPdpSelection,
	validatePdpSearch,
} from "@/lib/params/pdp-search";
import { productBySlugQueryOptions } from "@/lib/queries/storefront-catalog";
import { buildProductHeadMetadata } from "@/lib/seo/product-seo";
import { cn } from "@/lib/utils";
import { guestCartActions } from "@/store/guest-cart.store";
import { uiActions, useUiStore } from "@/store/ui.store";

export const Route = createFileRoute("/products/$slug")({
	validateSearch: validatePdpSearch,
	loader: async ({ context, params }) => {
		const product = await context.queryClient.query({
			...productBySlugQueryOptions(params.slug),
			staleTime: "static",
		});

		if (!product) {
			throw notFound();
		}

		return { product };
	},
	head: ({ loaderData }) =>
		buildProductHeadMetadata(loaderData?.product ?? null, getBaseUrl()),
	notFoundComponent: ProductNotFoundPage,
	component: ProductDetailPage,
});

function ProductNotFoundPage() {
	const [searchDraft, setSearchDraft] = useState("");
	const navigate = Route.useNavigate();

	return (
		<StorefrontShell
			searchValue={searchDraft}
			onSearchChange={setSearchDraft}
			onSearchSubmit={(query) => {
				const trimmed = query.trim();
				void navigate({
					to: "/products",
					search: trimmed ? { search: trimmed } : {},
				});
			}}
		>
			<section className="mx-auto flex max-w-360 flex-col items-center justify-center px-4 py-24 text-center sm:px-8 lg:px-12">
				<div className="max-w-md space-y-5 border border-border p-10">
					<p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
						404 · Piece Unavailable
					</p>
					<h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-foreground">
						Product Not Found
					</h1>
					<p className="text-xs leading-relaxed text-muted-foreground">
						This garment is no longer available or is currently archived from
						our storefront catalog.
					</p>
					<div className="pt-2">
						<Button asChild variant="outline" size="sm">
							<Link to="/products" search={{}}>
								<ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
								<span>Browse Catalog</span>
							</Link>
						</Button>
					</div>
				</div>
			</section>
		</StorefrontShell>
	);
}

function ProductDetailPage() {
	const { slug } = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const { data: product } = useSuspenseQuery(productBySlugQueryOptions(slug));

	const [headerSearch, setHeaderSearch] = useState("");
	const sizeGuideOpen = useUiStore((s) => s.isSizeGuideOpen);
	const [sizeError, setSizeError] = useState(false);
	const [addedVariantSku, setAddedVariantSku] = useState<string | null>(null);
	const [bagLimitNotice, setBagLimitNotice] = useState<string | null>(null);
	const [isSaved, setIsSaved] = useState(false);

	useEffect(() => {
		return () => {
			uiActions.closeSizeGuide();
		};
	}, []);

	const initialSelection = useMemo(
		() =>
			product
				? resolveInitialPdpSelection(product, search)
				: { colorName: "", sizeLabel: null },
		[product, search],
	);

	const [selectedColorName, setSelectedColorName] = useState(
		initialSelection.colorName,
	);
	const [selectedSize, setSelectedSize] = useState<string | null>(
		initialSelection.sizeLabel,
	);

	useEffect(() => {
		setSelectedColorName(initialSelection.colorName);
		setSelectedSize(initialSelection.sizeLabel);
		setSizeError(false);
		setAddedVariantSku(null);
		setBagLimitNotice(null);
	}, [initialSelection.colorName, initialSelection.sizeLabel]);

	if (!product) {
		return null;
	}

	const colorVariants = product.variants.filter(
		(v) => v.colorName.toLowerCase() === selectedColorName.toLowerCase(),
	);

	const activeVariant = selectedSize
		? colorVariants.find(
				(v) => v.sizeLabel.toLowerCase() === selectedSize.toLowerCase(),
			)
		: undefined;

	const selectedColorHasStock = colorVariants.some(
		(v) => v.availableQuantity > 0,
	);

	const handleSelectColor = (nextColorName: string) => {
		setSelectedColorName(nextColorName);
		setSizeError(false);
		setAddedVariantSku(null);
		setBagLimitNotice(null);

		const nextColorVariants = product.variants.filter(
			(v) => v.colorName.toLowerCase() === nextColorName.toLowerCase(),
		);
		const preservedSize = selectedSize
			? (nextColorVariants.find(
					(v) =>
						v.sizeLabel.toLowerCase() === selectedSize.toLowerCase() &&
						v.availableQuantity > 0,
				)?.sizeLabel ?? null)
			: null;
		const inStockInNextColor = nextColorVariants.filter(
			(v) => v.availableQuantity > 0,
		);
		const resolvedSize =
			preservedSize ??
			(inStockInNextColor.length === 1
				? inStockInNextColor[0].sizeLabel
				: null);

		setSelectedSize(resolvedSize);
		void navigate({
			to: "/products/$slug",
			params: { slug: product.slug },
			search: {
				color: nextColorName,
				...(resolvedSize ? { size: resolvedSize } : {}),
			},
			replace: true,
		});
	};

	const handleSelectSize = (nextSize: string) => {
		setSelectedSize(nextSize);
		setSizeError(false);
		setAddedVariantSku(null);
		setBagLimitNotice(null);
		void navigate({
			to: "/products/$slug",
			params: { slug: product.slug },
			search: {
				...(selectedColorName ? { color: selectedColorName } : {}),
				size: nextSize,
			},
			replace: true,
		});
	};

	const handleAddToBag = () => {
		if (!selectedSize || !activeVariant) {
			setSizeError(true);
			return;
		}
		if (activeVariant.availableQuantity <= 0) {
			return;
		}
		setSizeError(false);
		setBagLimitNotice(null);
		const added = guestCartActions.addItem(
			activeVariant.id,
			1,
			activeVariant.availableQuantity,
		);
		if (!added) {
			setBagLimitNotice(
				`Maximum available stock (${activeVariant.availableQuantity}) is already in your bag.`,
			);
			uiActions.openCartDrawer();
			return;
		}
		setAddedVariantSku(activeVariant.sku);
		uiActions.openCartDrawer();
	};

	const displayPriceText = activeVariant
		? formatIdr(activeVariant.priceIdr)
		: product.priceRange.minPriceIdr === product.priceRange.maxPriceIdr
			? formatIdr(product.priceRange.minPriceIdr)
			: `${formatIdr(product.priceRange.minPriceIdr)} – ${formatIdr(product.priceRange.maxPriceIdr)}`;

	const compareAtPrice = activeVariant
		? activeVariant.compareAtPriceIdr &&
			activeVariant.compareAtPriceIdr > activeVariant.priceIdr
			? activeVariant.compareAtPriceIdr
			: null
		: product.priceRange.compareAtMinPriceIdr &&
				product.priceRange.compareAtMinPriceIdr > product.priceRange.minPriceIdr
			? product.priceRange.compareAtMinPriceIdr
			: null;

	const basePriceForDiscount = activeVariant
		? activeVariant.priceIdr
		: product.priceRange.minPriceIdr;

	const discountPercent =
		compareAtPrice && compareAtPrice > basePriceForDiscount
			? Math.round(
					((compareAtPrice - basePriceForDiscount) / compareAtPrice) * 100,
				)
			: null;

	return (
		<MotionConfig reducedMotion="user">
			<StorefrontShell
				searchValue={headerSearch}
				onSearchChange={setHeaderSearch}
				onSearchSubmit={(query) => {
					const trimmed = query.trim();
					void navigate({
						to: "/products",
						search: trimmed ? { search: trimmed } : {},
					});
				}}
				activeGenderAudience={product.genderAudience}
			>
				<article className="mx-auto max-w-360 px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
					{/* Semantic Breadcrumb Navigation */}
					<nav
						aria-label="Breadcrumb"
						className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
					>
						<Link
							to="/"
							className="hover:text-foreground hover:underline underline-offset-4"
						>
							Home
						</Link>
						<ChevronRight className="h-3 w-3 stroke-[1.5]" aria-hidden="true" />
						<Link
							to="/products"
							search={{}}
							className="hover:text-foreground hover:underline underline-offset-4"
						>
							Products
						</Link>
						{product.category && (
							<>
								<ChevronRight
									className="h-3 w-3 stroke-[1.5]"
									aria-hidden="true"
								/>
								<Link
									to="/products"
									search={{ category: product.category.slug }}
									className="hover:text-foreground hover:underline underline-offset-4"
								>
									{product.category.name}
								</Link>
							</>
						)}
						<ChevronRight className="h-3 w-3 stroke-[1.5]" aria-hidden="true" />
						<span aria-current="page" className="text-foreground font-medium">
							{product.name}
						</span>
					</nav>

					<div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
						{/* Left: Dynamic Color-Filtered 3:4 Gallery */}
						<div className="lg:col-span-7">
							<ProductGallery
								media={product.media}
								selectedColorName={selectedColorName}
								productName={product.name}
							/>
						</div>

						{/* Right: Sticky Editorial Purchase Panel */}
						<div className="lg:col-span-5">
							<div className="space-y-6 lg:sticky lg:top-24">
								{/* Category, Brand, SKU & Title */}
								<div className="space-y-2.5">
									<div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
										<span>
											{product.brand} ·{" "}
											{getGenderAudienceLabel(product.genderAudience)}
											{product.category ? ` · ${product.category.name}` : ""}
										</span>
										<span data-testid="pdp-active-sku">
											{activeVariant ? activeVariant.sku : product.parentSku}
										</span>
									</div>

									<h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-[30px] leading-tight">
										{product.name}
									</h1>

									{/* Price & Stock Status Row */}
									<div className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
										<div className="flex flex-wrap items-baseline gap-2.5">
											<span
												data-testid="pdp-price"
												className="font-sans text-lg font-normal tabular-nums text-foreground"
											>
												{displayPriceText}
											</span>
											{compareAtPrice && (
												<span className="font-sans text-sm tabular-nums text-muted-foreground line-through">
													{formatIdr(compareAtPrice)}
												</span>
											)}
											{discountPercent !== null && discountPercent > 0 && (
												<Badge variant="sale" size="sm">
													-{discountPercent}%
												</Badge>
											)}
										</div>

										<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
											{activeVariant
												? activeVariant.availableQuantity > 0
													? `${activeVariant.availableQuantity} In Stock`
													: "Out of Stock"
												: product.inStock
													? "In Stock"
													: "Sold Out"}
										</span>
									</div>
								</div>

								{/* Color Swatch Picker */}
								<ColorSwatchPicker
									colors={product.colors}
									selectedColorName={selectedColorName}
									onSelectColor={handleSelectColor}
								/>

								{/* Size Selector & Size Guide Trigger */}
								<SizeSelector
									variants={product.variants}
									selectedColorName={selectedColorName}
									selectedSize={selectedSize}
									onSelectSize={handleSelectSize}
									hasSizeGuide={Boolean(product.sizeGuide)}
									onOpenSizeGuide={() => uiActions.openSizeGuide()}
									sizeError={sizeError}
								/>

								{/* Primary Purchase Actions */}
								<div className="space-y-2.5 pt-2">
									<div className="flex items-center gap-2">
										<Button
											type="button"
											onClick={handleAddToBag}
											disabled={!product.inStock || !selectedColorHasStock}
											data-variant-id={activeVariant?.id}
											className="h-12 flex-1 text-[13px] tracking-[0.06em] uppercase"
										>
											{!product.inStock || !selectedColorHasStock ? (
												<span>Out of Stock</span>
											) : addedVariantSku &&
												addedVariantSku === activeVariant?.sku ? (
												<>
													<Check className="h-4 w-4 stroke-[1.75]" />
													<span>Selected for Bag</span>
												</>
											) : (
												<span>Add to Bag</span>
											)}
										</Button>

										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => setIsSaved((prev) => !prev)}
											aria-label={
												isSaved
													? `Remove ${product.name} from wishlist`
													: `Save ${product.name} to wishlist`
											}
											aria-pressed={isSaved}
											className="h-12 w-12"
										>
											<Bookmark
												className={cn(
													"h-4 w-4 stroke-[1.5]",
													isSaved && "fill-current",
												)}
											/>
										</Button>
									</div>

									{addedVariantSku && activeVariant && (
										<p
											role="status"
											className="border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground"
										>
											Added to bag:{" "}
											<span className="font-medium">
												{activeVariant.colorName} / Size{" "}
												{activeVariant.sizeLabel}
											</span>{" "}
											(<span className="font-mono">{activeVariant.sku}</span>)
										</p>
									)}

									{bagLimitNotice && (
										<p
											role="status"
											className="border border-border bg-secondary/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
										>
											{bagLimitNotice}
										</p>
									)}
								</div>

								{/* Product Description */}
								<div className="border-t border-border pt-5">
									<p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-line">
										{product.description}
									</p>
								</div>

								{/* Collections Tags */}
								{product.collections.length > 0 && (
									<div className="flex flex-wrap items-center gap-2">
										{product.collections.map((collection) => (
											<Link
												key={collection.id}
												to="/products"
												search={{ collection: collection.slug }}
												className="border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
											>
												{collection.name}
											</Link>
										))}
									</div>
								)}

								{/* Material, Fit & Care Accordion */}
								<Accordion
									type="multiple"
									defaultValue={["composition", "fit"]}
									className="border-t border-border"
								>
									<AccordionItem value="composition">
										<AccordionTrigger>
											Composition &amp; Material
										</AccordionTrigger>
										<AccordionContent>
											{product.materialComposition ||
												"Crafted with curated architectural textiles selected for structure and longevity."}
										</AccordionContent>
									</AccordionItem>

									<AccordionItem value="fit">
										<AccordionTrigger>Silhouette &amp; Fit</AccordionTrigger>
										<AccordionContent className="space-y-2">
											<p>
												{product.fitType
													? `${product.fitType} silhouette designed for ${getGenderAudienceLabel(product.genderAudience).toLowerCase()} wardrobes.`
													: `Tailored for ${getGenderAudienceLabel(product.genderAudience).toLowerCase()} wardrobes.`}
											</p>
											{product.sizeGuide?.modelNote && (
												<p className="text-foreground/80">
													{product.sizeGuide.modelNote}
												</p>
											)}
											{product.sizeGuide && (
												<button
													type="button"
													onClick={() => uiActions.openSizeGuide()}
													className="text-xs font-medium text-foreground underline underline-offset-4 hover:text-foreground/75"
												>
													Open {product.sizeGuide.name}
												</button>
											)}
										</AccordionContent>
									</AccordionItem>

									<AccordionItem value="care">
										<AccordionTrigger>Care &amp; Delivery</AccordionTrigger>
										<AccordionContent className="space-y-3">
											<p>
												{product.careInstructions ||
													"Follow garment care label instructions. Steam lightly at low temperature."}
											</p>
											<div className="space-y-1.5 border-t border-border pt-3 text-xs">
												<div className="flex items-center gap-2 text-foreground/85">
													<Truck className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
													<span>
														Tracked domestic delivery across Indonesia via JNE,
														J&amp;T, SiCepat &amp; Pos.
													</span>
												</div>
												<div className="flex items-center gap-2 text-foreground/85">
													<ShieldCheck className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
													<span>
														7-day size exchange guarantee for unworn garments.
													</span>
												</div>
											</div>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</div>
						</div>
					</div>
				</article>

				{product.sizeGuide && (
					<SizeGuideModal
						open={sizeGuideOpen}
						onOpenChange={uiActions.setSizeGuideOpen}
						sizeGuide={product.sizeGuide}
						productName={product.name}
						fitType={product.fitType}
					/>
				)}
			</StorefrontShell>
		</MotionConfig>
	);
}
