import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	ArrowRight,
	Minus,
	Plus,
	Trash2,
	WifiOff,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { useCartCount, useGuestCartItems } from "@/hooks/use-cart-count";
import { formatIdr } from "@/lib/format";
import { buildFashionImageUrl } from "@/lib/imagekit";
import { COS_EASE } from "@/lib/motion";
import { cartVariantsQueryOptions } from "@/lib/queries/storefront-catalog";
import type { CartResolvedVariant } from "@/server/services/catalog.service";
import { guestCartActions } from "@/store/guest-cart.store";
import { uiActions, useUiStore } from "@/store/ui.store";

export function GuestCartDrawer() {
	const open = useUiStore((s) => s.isCartDrawerOpen);
	const items = useGuestCartItems();
	const totalCount = useCartCount();

	const variantIds = useMemo(
		() => items.map((item) => item.variantId),
		[items],
	);

	const variantsQuery = useQuery({
		...cartVariantsQueryOptions(variantIds),
		placeholderData: keepPreviousData,
	});

	const variantById = useMemo(() => {
		const map = new Map<string, CartResolvedVariant>();
		for (const variant of variantsQuery.data ?? []) {
			map.set(variant.id, variant);
		}
		return map;
	}, [variantsQuery.data]);

	const subtotalIdr = useMemo(() => {
		let sum = 0;
		for (const item of items) {
			const resolved = variantById.get(item.variantId);
			if (resolved) {
				sum += resolved.priceIdr * item.quantity;
			}
		}
		return sum;
	}, [items, variantById]);

	const hasResolvedPrices =
		items.length > 0 && items.some((item) => variantById.has(item.variantId));

	const hasStockIssue = useMemo(() => {
		if (!variantsQuery.isSuccess) return false;
		return items.some((item) => {
			const resolved = variantById.get(item.variantId);
			if (!resolved) return true;
			return resolved.availableQuantity < item.quantity;
		});
	}, [items, variantById, variantsQuery.isSuccess]);

	return (
		<Sheet open={open} onOpenChange={uiActions.setCartDrawerOpen}>
			<AnimatePresence>
				{open && (
					<SheetContent side="right" className="p-0">
						<div className="border-b border-border px-6 py-5">
							<div className="pr-10">
								<SheetTitle>Shopping Bag ({totalCount})</SheetTitle>
								<SheetDescription className="mt-1">
									{items.length === 0
										? "Guest bag saved locally in this browser."
										: variantsQuery.isError
											? "Offline mode — quantities remain editable locally."
											: "Live IDR pricing & stock verified from Noctura catalog."}
								</SheetDescription>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-5">
							{variantsQuery.isError && items.length > 0 && (
								<div
									role="status"
									className="mb-4 flex items-start gap-2.5 border border-border bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground"
								>
									<WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
									<span>
										Unable to verify live IDR prices right now. You can still
										adjust quantities or remove items offline.
									</span>
								</div>
							)}

							{items.length === 0 ? (
								<div className="flex h-full min-h-65 flex-col items-center justify-center space-y-4 text-center">
									<p className="font-display text-base font-medium text-foreground">
										Your shopping bag is empty
									</p>
									<p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
										Explore our architectural wardrobe to add tailored coats,
										knitwear, and foundational pieces.
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => uiActions.closeCartDrawer()}
									>
										Continue Browsing
									</Button>
								</div>
							) : (
								<ul className="divide-y divide-border">
									<AnimatePresence initial={false}>
										{items.map((item) => {
											const resolved = variantById.get(item.variantId);
											const thumbnailUrl = resolved?.imageUrl
												? buildFashionImageUrl(resolved.imageUrl, {
														width: 400,
													})
												: "";
											const maxStock = resolved?.availableQuantity;
											const isOverStock =
												resolved !== undefined &&
												item.quantity > resolved.availableQuantity;
											const isMissingFromCatalog =
												variantsQuery.isSuccess && resolved === undefined;

											return (
												<motion.li
													key={item.variantId}
													layout
													initial={{ opacity: 0, y: 8 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, height: 0, marginBottom: 0 }}
													transition={{ duration: 0.22, ease: COS_EASE }}
													className="flex gap-4 py-5 first:pt-0"
												>
													<div className="aspect-3/4 w-20 shrink-0 overflow-hidden bg-studio">
														{thumbnailUrl ? (
															<img
																src={thumbnailUrl}
																alt={resolved?.imageAlt ?? "Product thumbnail"}
																referrerPolicy="no-referrer"
																className="h-full w-full object-cover object-top"
															/>
														) : (
															<div className="flex h-full w-full items-center justify-center border border-border text-[10px] font-mono uppercase text-muted-foreground">
																No Img
															</div>
														)}
													</div>

													<div className="flex flex-1 flex-col justify-between">
														<div className="space-y-1">
															<div className="flex items-start justify-between gap-2">
																{resolved ? (
																	<Link
																		to="/products/$slug"
																		params={{ slug: resolved.productSlug }}
																		search={{
																			color: resolved.colorName,
																			size: resolved.sizeLabel,
																		}}
																		onClick={() => uiActions.closeCartDrawer()}
																		className="font-display text-[13px] font-medium leading-snug text-foreground hover:underline underline-offset-4"
																	>
																		{resolved.productName}
																	</Link>
																) : (
																	<span className="font-mono text-xs text-foreground">
																		{isMissingFromCatalog
																			? "Unavailable Piece"
																			: `Item · ${item.variantId.slice(0, 8)}`}
																	</span>
																)}

																<span className="text-[13px] tabular-nums text-foreground whitespace-nowrap">
																	{resolved
																		? formatIdr(
																				resolved.priceIdr * item.quantity,
																			)
																		: variantsQuery.isPending
																			? "..."
																			: "—"}
																</span>
															</div>

															{resolved ? (
																<p className="text-xs text-muted-foreground">
																	{resolved.colorName} · Size{" "}
																	{resolved.sizeLabel}
																</p>
															) : (
																<p className="font-mono text-[11px] text-muted-foreground">
																	{isMissingFromCatalog
																		? "No longer published in catalog"
																		: "Saved locally"}
																</p>
															)}

															{isOverStock && resolved && (
																<p
																	role="status"
																	className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-700 dark:text-amber-400"
																>
																	<AlertCircle className="h-3 w-3 shrink-0" />
																	<span>
																		{resolved.availableQuantity === 0
																			? "Out of stock"
																			: `Only ${resolved.availableQuantity} available`}
																	</span>
																</p>
															)}
														</div>

														<div className="flex items-center justify-between pt-3">
															<div className="inline-flex items-center border border-border">
																<button
																	type="button"
																	onClick={() =>
																		guestCartActions.updateItemQuantity(
																			item.variantId,
																			-1,
																			maxStock,
																		)
																	}
																	aria-label={`Decrease quantity of ${resolved?.productName ?? item.variantId}`}
																	className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-secondary"
																>
																	<Minus className="h-3 w-3 stroke-[1.5]" />
																</button>
																<span className="w-8 text-center text-xs tabular-nums text-foreground">
																	{item.quantity}
																</span>
																<button
																	type="button"
																	disabled={
																		resolved !== undefined &&
																		item.quantity >= resolved.availableQuantity
																	}
																	onClick={() =>
																		guestCartActions.updateItemQuantity(
																			item.variantId,
																			1,
																			maxStock,
																		)
																	}
																	aria-label={`Increase quantity of ${resolved?.productName ?? item.variantId}`}
																	className="inline-flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
																>
																	<Plus className="h-3 w-3 stroke-[1.5]" />
																</button>
															</div>

															<button
																type="button"
																onClick={() =>
																	guestCartActions.removeItem(item.variantId)
																}
																aria-label={`Remove ${resolved?.productName ?? item.variantId}`}
																className="inline-flex h-8 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
															>
																<Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
																<span>Remove</span>
															</button>
														</div>
													</div>
												</motion.li>
											);
										})}
									</AnimatePresence>
								</ul>
							)}
						</div>

						{items.length > 0 && (
							<div className="space-y-4 border-t border-border bg-background px-6 py-5">
								<div className="space-y-2 text-[13px]">
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Items ({totalCount})</span>
										<button
											type="button"
											onClick={() => guestCartActions.clearCart()}
											className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground underline underline-offset-4 hover:text-foreground"
										>
											Clear Bag
										</button>
									</div>
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Shipping</span>
										<span className="text-xs">Calculated at checkout</span>
									</div>
									<div className="flex items-center justify-between border-t border-border pt-2.5 font-display text-sm font-medium text-foreground">
										<span>Estimated Subtotal</span>
										<span className="tabular-nums">
											{hasResolvedPrices ? formatIdr(subtotalIdr) : "—"}
										</span>
									</div>
								</div>

								<Button
									asChild
									className="h-12 w-full text-[13px] tracking-[0.06em] uppercase"
									disabled={hasStockIssue}
								>
									<Link
										to="/auth/login"
										search={{ redirect: "/products" }}
										onClick={() => uiActions.closeCartDrawer()}
									>
										<span>Sign In to Checkout</span>
										<ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
									</Link>
								</Button>
							</div>
						)}
					</SheetContent>
				)}
			</AnimatePresence>
		</Sheet>
	);
}
