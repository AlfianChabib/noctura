import { motion } from "framer-motion";
import { Bookmark, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ColorVariant, Product } from "@/data/catalog";
import { COS_IMAGE_TRANSITION, quickAddVariants } from "@/lib/motion";
import { formatCurrency } from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

interface ProductCardProps {
	product: Product;
	isSaved: boolean;
	onToggleSave: (productId: string) => void;
	onQuickAdd: (product: Product, color: ColorVariant, size: string) => void;
	onOpenDetail: (product: Product, selectedColor: ColorVariant) => void;
	minimalMode?: boolean;
	formattedPrice?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
	product,
	isSaved,
	onToggleSave,
	onQuickAdd,
	onOpenDetail,
	minimalMode = false,
	formattedPrice,
}) => {
	const [selectedColor, setSelectedColor] = useState<ColorVariant>(
		product.colors[0],
	);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isHovered, setIsHovered] = useState(false);
	const [justAddedSize, setJustAddedSize] = useState<string | null>(null);
	const [imgFailed, setImgFailed] = useState(false);

	const galleryImages = useMemo(() => {
		if (selectedColor.images && selectedColor.images.length > 0) {
			return selectedColor.images;
		}
		if (selectedColor.image) {
			const otherImages =
				product.images?.filter((img) => img !== selectedColor.image) || [];
			return [selectedColor.image, ...otherImages];
		}
		if (product.images && product.images.length > 0) {
			return product.images;
		}
		return [product.image];
	}, [selectedColor, product.images, product.image]);

	const activeIndex = Math.min(
		currentImageIndex,
		Math.max(0, galleryImages.length - 1),
	);
	const activeImage = galleryImages[activeIndex] || product.image;

	const handleQuickAddClick = (
		event: React.MouseEvent<HTMLButtonElement>,
		size: string,
	) => {
		event.stopPropagation();
		onQuickAdd(product, selectedColor, size);
		setJustAddedSize(size);
		window.setTimeout(() => {
			setJustAddedSize((current) => (current === size ? null : current));
		}, 1200);
	};

	const handleSelectColor = (
		e: React.MouseEvent<HTMLButtonElement>,
		color: ColorVariant,
	) => {
		e.stopPropagation();
		setSelectedColor(color);
		setCurrentImageIndex(0);
	};

	return (
		<Card
			className="group flex flex-col bg-transparent"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* 3:4 Studio Portrait Frame — Sharp 0px Corners */}
			<div className="relative aspect-3/4 w-full overflow-hidden bg-studio">
				<button
					type="button"
					onClick={() => onOpenDetail(product, selectedColor)}
					aria-label={`View details for ${product.title}`}
					className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
				>
					{!imgFailed ? (
						<motion.img
							key={activeImage}
							src={activeImage}
							alt={product.imageAlt}
							referrerPolicy="no-referrer"
							onError={() => setImgFailed(true)}
							animate={{
								scale: isHovered ? 1.035 : 1,
								filter: isHovered ? "brightness(0.96)" : "brightness(1)",
							}}
							transition={COS_IMAGE_TRANSITION}
							className="h-full w-full object-cover object-top will-change-transform"
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center bg-secondary px-6 text-center">
							<span className="font-display text-xs uppercase tracking-[0.14em] text-muted-foreground">
								NOCTURA Studio
							</span>
							<span className="mt-2 text-sm text-foreground">
								{product.title}
							</span>
						</div>
					)}
				</button>

				{/* Top Segmented Scroll Indicator (2px dashes) — COS Style */}
				{galleryImages.length > 1 && (
					<div className="absolute top-2.5 inset-x-3 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-auto">
						{galleryImages.map((imageSrc, idx) => (
							<button
								key={`${product.id}-segment-${imageSrc}`}
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setCurrentImageIndex(idx);
								}}
								aria-label={`Jump to image ${idx + 1} of ${galleryImages.length}`}
								className="h-3 flex-1 flex items-center cursor-pointer focus:outline-none"
							>
								<span
									className={cn(
										"h-0.5 w-full transition-colors duration-150",
										idx === activeIndex
											? "bg-foreground shadow-xs"
											: "bg-foreground/25 hover:bg-foreground/50",
									)}
								/>
							</button>
						))}
					</div>
				)}

				{/* Left & Right In-Card Arrow Touchpoints (mix-blend-difference) */}
				{galleryImages.length > 1 && (
					<>
						{activeIndex > 0 && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setCurrentImageIndex((prev) => Math.max(0, prev - 1));
								}}
								aria-label="Previous product image"
								className="absolute left-0 inset-y-0 w-10 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer focus:outline-none focus-visible:opacity-100"
							>
								<ChevronLeft className="h-6 w-6 stroke-[1.5] text-white mix-blend-difference" />
							</button>
						)}
						{activeIndex < galleryImages.length - 1 && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setCurrentImageIndex((prev) =>
										Math.min(galleryImages.length - 1, prev + 1),
									);
								}}
								aria-label="Next product image"
								className="absolute right-0 inset-y-0 w-10 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer focus:outline-none focus-visible:opacity-100"
							>
								<ChevronRight className="h-6 w-6 stroke-[1.5] text-white mix-blend-difference" />
							</button>
						)}
					</>
				)}

				{/* Minimal Save / Bookmark Affordance */}
				<motion.button
					type="button"
					whileTap={{ scale: 0.9 }}
					onClick={(e) => {
						e.stopPropagation();
						onToggleSave(product.id);
					}}
					aria-label={
						isSaved
							? `Remove ${product.title} from saved`
							: `Save ${product.title}`
					}
					aria-pressed={isSaved}
					className={cn(
						"absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-none bg-background/85 text-foreground backdrop-blur-xs transition-opacity duration-200 hover:bg-background focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
						isSaved || isHovered
							? "opacity-100"
							: "opacity-0 sm:group-focus-within:opacity-100",
					)}
				>
					<Bookmark
						className={cn(
							"h-3.5 w-3.5 stroke-[1.5] transition-colors",
							isSaved && "fill-foreground",
						)}
					/>
				</motion.button>

				{/* Quick-Add Size Overlay Bar — Subtle Slide Up on Hover */}
				<motion.div
					variants={quickAddVariants}
					initial="rest"
					animate={isHovered || justAddedSize ? "hover" : "rest"}
					className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 px-3 py-2.5 backdrop-blur-xs"
				>
					{justAddedSize ? (
						<div className="flex h-7 items-center justify-center gap-1.5 text-[11px] font-medium tracking-[0.06em] uppercase text-foreground">
							<Check className="h-3.5 w-3.5 stroke-[1.75]" />
							<span>Added — Size {justAddedSize}</span>
						</div>
					) : (
						<div className="space-y-1.5">
							<p className="text-center text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
								Quick Add
							</p>
							<div className="flex items-center justify-center gap-1">
								{product.sizes.map((size) => (
									<button
										key={size}
										type="button"
										onClick={(e) => handleQuickAddClick(e, size)}
										aria-label={`Quick add ${product.title} size ${size}`}
										className="inline-flex h-7 min-w-8.5 items-center justify-center whitespace-nowrap rounded-none border border-transparent px-2 text-[11px] font-medium text-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:outline-none"
									>
										{size}
									</button>
								))}
							</div>
						</div>
					)}
				</motion.div>
			</div>

			{/* Product Typography & Swatch Metadata — Hidden in Minimal Lookbook Mode */}
			{!minimalMode && (
				<CardContent className="flex flex-1 flex-col justify-between pt-3.5 pb-1">
					<div className="space-y-1">
						<div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
							<button
								type="button"
								onClick={() => onOpenDetail(product, selectedColor)}
								className="text-left font-display text-[13px] sm:text-[14px] font-medium leading-snug tracking-[-0.01em] text-foreground transition-colors hover:text-foreground/70 focus-visible:outline-none focus-visible:underline"
							>
								{product.title}
							</button>
							<span className="shrink-0 font-sans text-[13px] sm:text-[14px] font-normal tabular-nums text-foreground">
								{formattedPrice ?? formatCurrency(product.price)}
							</span>
						</div>

						{/* Unboxed Metadata (Zero Pills) */}
						<p className="text-[11px] sm:text-[12px] leading-relaxed text-muted-foreground">
							<span>{product.subtitle}</span>
							{product.editorialLabel && (
								<>
									<span aria-hidden="true" className="mx-1.5">
										·
									</span>
									<span className="whitespace-nowrap text-foreground/80">
										{product.editorialLabel}
									</span>
								</>
							)}
						</p>
					</div>

					{/* Sharp Square Color Swatches — 20px x 20px COS Style with Click-to-Swap */}
					<div className="mt-3 flex items-center gap-2.5">
						<div className="flex items-center gap-1.5">
							{product.colors.slice(0, 4).map((color) => {
								const active = color.id === selectedColor.id;
								return (
									<button
										key={color.id}
										type="button"
										aria-pressed={active}
										aria-label={`Select color ${color.name} for ${product.title}`}
										onClick={(e) => handleSelectColor(e, color)}
										className={cn(
											"flex h-5 w-5 items-center justify-center rounded-none border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 cursor-pointer",
											active
												? "border-foreground"
												: "border-transparent hover:border-foreground/40",
										)}
									>
										<span
											className="block h-full w-full border border-black/15 dark:border-white/15"
											style={{ backgroundColor: color.hex }}
										/>
									</button>
								);
							})}

							{product.colors.length > 4 && (
								<button
									type="button"
									onClick={() => onOpenDetail(product, selectedColor)}
									aria-label={`View all ${product.colors.length} color variants`}
									className="flex h-5 min-w-5 px-1 items-center justify-center rounded-none border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors shrink-0"
								>
									+{product.colors.length - 4}
								</button>
							)}
						</div>
						<span className="text-[11px] text-muted-foreground truncate">
							{selectedColor.name}
						</span>
					</div>
				</CardContent>
			)}
		</Card>
	);
};
