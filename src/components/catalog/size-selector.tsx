import { Ruler } from "lucide-react";
import type { StorefrontProductDetail } from "@/lib/queries/storefront-catalog";
import { cn } from "@/lib/utils";

export interface SizeSelectorProps {
	variants: StorefrontProductDetail["variants"];
	selectedColorName: string;
	selectedSize: string | null;
	onSelectSize: (sizeLabel: string) => void;
	hasSizeGuide: boolean;
	onOpenSizeGuide: () => void;
	sizeError?: boolean;
}

export function SizeSelector({
	variants,
	selectedColorName,
	selectedSize,
	onSelectSize,
	hasSizeGuide,
	onOpenSizeGuide,
	sizeError = false,
}: SizeSelectorProps) {
	const colorVariants = variants.filter(
		(variant) =>
			variant.colorName.toLowerCase() === selectedColorName.toLowerCase(),
	);

	const activeVariant = selectedSize
		? colorVariants.find(
				(v) => v.sizeLabel.toLowerCase() === selectedSize.toLowerCase(),
			)
		: undefined;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-4 text-xs">
				<div className="flex items-center gap-2">
					<span className="font-mono uppercase tracking-[0.08em] text-muted-foreground">
						Size
					</span>
					{activeVariant &&
						activeVariant.availableQuantity > 0 &&
						activeVariant.availableQuantity <= 5 && (
							<span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
								Only {activeVariant.availableQuantity} left
							</span>
						)}
				</div>

				<div className="flex items-center gap-3">
					{sizeError && (
						<span role="alert" className="text-xs font-medium text-destructive">
							Please select a size
						</span>
					)}
					{hasSizeGuide && (
						<button
							type="button"
							onClick={onOpenSizeGuide}
							className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<Ruler className="h-3.5 w-3.5 stroke-[1.5]" />
							<span>Size Guide</span>
						</button>
					)}
				</div>
			</div>

			{colorVariants.length > 0 ? (
				<fieldset
					aria-label="Select size"
					className="m-0 grid grid-cols-4 gap-2 border-0 p-0 sm:grid-cols-5"
				>
					{colorVariants.map((variant) => {
						const isInStock = variant.availableQuantity > 0;
						const isSelected =
							selectedSize?.toLowerCase() === variant.sizeLabel.toLowerCase();

						return (
							<button
								key={variant.id}
								type="button"
								disabled={!isInStock}
								aria-disabled={!isInStock}
								aria-pressed={isSelected}
								aria-label={
									isInStock
										? `Size ${variant.sizeLabel}, ${variant.availableQuantity} available`
										: `Size ${variant.sizeLabel}, out of stock`
								}
								onClick={() => onSelectSize(variant.sizeLabel)}
								className={cn(
									"relative h-11 rounded-none border text-xs font-medium tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
									isInStock
										? isSelected
											? "border-foreground bg-primary text-primary-foreground"
											: "border-border bg-background text-foreground hover:border-foreground"
										: "cursor-not-allowed border-border/60 bg-secondary/40 text-muted-foreground/60 line-through",
								)}
							>
								{variant.sizeLabel}
							</button>
						);
					})}
				</fieldset>
			) : (
				<p className="text-xs text-muted-foreground">
					No sizes are currently available for this colour.
				</p>
			)}
		</div>
	);
}
