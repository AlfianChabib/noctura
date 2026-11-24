import { AnimatePresence } from "framer-motion";
import { Bookmark, Check } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ColorVariant, Product } from "@/data/catalog";
import { formatCurrency } from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

interface ProductQuickViewProps {
	product: Product | null;
	initialColor: ColorVariant | null;
	isSaved: boolean;
	onClose: () => void;
	onToggleSave: (productId: string) => void;
	onAddToBag: (product: Product, color: ColorVariant, size: string) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
	product,
	initialColor,
	isSaved,
	onClose,
	onToggleSave,
	onAddToBag,
}) => {
	const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(
		initialColor,
	);
	const [selectedSize, setSelectedSize] = useState<string>("");
	const [sizeError, setSizeError] = useState(false);
	const [addedFeedback, setAddedFeedback] = useState(false);

	useEffect(() => {
		if (product) {
			setSelectedColor(initialColor ?? product.colors[0]);
			setSelectedSize(product.sizes.length === 1 ? product.sizes[0] : "");
			setSizeError(false);
			setAddedFeedback(false);
		}
	}, [product, initialColor]);

	const handleAdd = () => {
		if (!product) return;
		if (!selectedSize) {
			setSizeError(true);
			return;
		}
		const activeColor = selectedColor ?? product.colors[0];
		onAddToBag(product, activeColor, selectedSize);
		setAddedFeedback(true);
		window.setTimeout(() => {
			setAddedFeedback(false);
		}, 1100);
	};

	return (
		<Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
			<AnimatePresence>
				{product && (
					<DialogContent className="p-0 overflow-hidden">
						<div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
							{/* Left 3:4 Studio Portrait */}
							<div className="md:col-span-6 bg-studio">
								<img
									src={product.image}
									alt={product.imageAlt}
									referrerPolicy="no-referrer"
									className="h-full max-h-[540px] md:max-h-none w-full object-cover object-top"
								/>
							</div>

							{/* Right Contiguous Purchase Module */}
							<div className="md:col-span-6 flex flex-col justify-between p-6 sm:p-8 lg:p-10">
								<div className="space-y-6">
									<div className="space-y-2 pr-10">
										<div className="flex items-center gap-2 text-[11px] tracking-[0.06em] uppercase text-muted-foreground">
											<span>{product.category}</span>
											<span aria-hidden="true">/</span>
											<span className="font-mono">{product.sku}</span>
										</div>
										<DialogTitle className="text-2xl leading-tight">
											{product.title}
										</DialogTitle>
										<DialogDescription className="sr-only">
											Select color and size to add {product.title} to your
											shopping bag
										</DialogDescription>
										<p className="font-sans text-lg font-normal tabular-nums text-foreground pt-0.5">
											{formatCurrency(product.price)}
										</p>
									</div>

									{/* Color Selector */}
									<div className="space-y-2.5 border-t border-border pt-5">
										<div className="flex items-center justify-between text-xs">
											<span className="text-muted-foreground">Color</span>
											<span className="font-medium text-foreground">
												{selectedColor?.name ?? product.colors[0].name}
											</span>
										</div>
										<div className="flex items-center gap-2">
											{product.colors.map((color) => {
												const active =
													color.id ===
													(selectedColor?.id ?? product.colors[0].id);
												return (
													<button
														key={color.id}
														type="button"
														onClick={() => setSelectedColor(color)}
														aria-label={`Color ${color.name}`}
														aria-pressed={active}
														className={cn(
															"flex h-7 w-7 items-center justify-center rounded-none border p-[3px] transition-colors",
															active
																? "border-foreground"
																: "border-border hover:border-foreground/50",
														)}
													>
														<span
															className="block h-full w-full border border-black/15 dark:border-white/15"
															style={{ backgroundColor: color.hex }}
														/>
													</button>
												);
											})}
										</div>
									</div>

									{/* Size Selector */}
									<div className="space-y-2.5">
										<div className="flex items-center justify-between text-xs">
											<span className="text-muted-foreground">Select Size</span>
											{sizeError && (
												<span
													role="alert"
													className="text-destructive font-medium"
												>
													Please choose a size
												</span>
											)}
										</div>
										<div className="grid grid-cols-4 gap-2">
											{product.sizes.map((size) => {
												const active = selectedSize === size;
												return (
													<button
														key={size}
														type="button"
														onClick={() => {
															setSelectedSize(size);
															setSizeError(false);
														}}
														aria-pressed={active}
														className={cn(
															"h-11 rounded-none border text-xs font-medium tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
															active
																? "border-foreground bg-primary text-primary-foreground"
																: "border-border bg-background text-foreground hover:border-foreground",
														)}
													>
														{size}
													</button>
												);
											})}
										</div>
									</div>

									{/* Primary Action Row */}
									<div className="flex items-center gap-2 pt-1">
										<Button
											type="button"
											onClick={handleAdd}
											className="h-12 flex-1 text-[13px] tracking-[0.06em] uppercase"
										>
											{addedFeedback ? (
												<>
													<Check className="h-4 w-4 stroke-[1.75]" />
													<span>Added to Bag</span>
												</>
											) : (
												<span>Add to Bag</span>
											)}
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => onToggleSave(product.id)}
											aria-label={
												isSaved ? "Remove from saved" : "Save garment"
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

									{/* Material, Fit & Care Accordion */}
									<Accordion
										type="single"
										collapsible
										defaultValue="composition"
										className="border-t border-border"
									>
										<AccordionItem value="composition">
											<AccordionTrigger>
												Composition & Provenance
											</AccordionTrigger>
											<AccordionContent>{product.composition}</AccordionContent>
										</AccordionItem>
										<AccordionItem value="fit">
											<AccordionTrigger>Silhouette & Fit</AccordionTrigger>
											<AccordionContent>{product.fitNotes}</AccordionContent>
										</AccordionItem>
										<AccordionItem value="care">
											<AccordionTrigger>
												Garment Care & Delivery
											</AccordionTrigger>
											<AccordionContent>
												<p>{product.care}</p>
												<p className="mt-2">
													Complimentary express delivery on orders over $250.
													Free returns within 30 days.
												</p>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								</div>
							</div>
						</div>
					</DialogContent>
				)}
			</AnimatePresence>
		</Dialog>
	);
};
