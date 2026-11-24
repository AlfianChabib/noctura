import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Minus, Plus, Trash2 } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	computeBagSummary,
	formatCurrency,
	type BagItem,
} from "@/lib/storeLogic";
import { COS_EASE } from "@/lib/motion";

interface ShoppingBagSheetProps {
	open: boolean;
	items: BagItem[];
	onOpenChange: (open: boolean) => void;
	onUpdateQuantity: (key: string, delta: number) => void;
	onRemoveItem: (key: string) => void;
	onClearBag: () => void;
}

interface OrderConfirmation {
	orderNumber: string;
	recipientName: string;
	email: string;
	total: number;
	itemCount: number;
}

export const ShoppingBagSheet: React.FC<ShoppingBagSheetProps> = ({
	open,
	items,
	onOpenChange,
	onUpdateQuantity,
	onRemoveItem,
	onClearBag,
}) => {
	const [step, setStep] = useState<"bag" | "checkout" | "confirmed">("bag");
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [formError, setFormError] = useState("");
	const [order, setOrder] = useState<OrderConfirmation | null>(null);

	const summary = computeBagSummary(items);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			if (step === "confirmed") {
				setStep("bag");
				setOrder(null);
			} else if (items.length === 0) {
				setStep("bag");
			}
			setFormError("");
		}
		onOpenChange(nextOpen);
	};

	const handleCheckoutSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!fullName.trim() || !email.trim() || !address.trim()) {
			setFormError("Please complete your name, email, and delivery address.");
			return;
		}
		if (!email.includes("@")) {
			setFormError("Please enter a valid email address.");
			return;
		}
		const orderNumber = `NOC-${Math.floor(100000 + Math.random() * 900000)}`;
		setOrder({
			orderNumber,
			recipientName: fullName.trim(),
			email: email.trim(),
			total: summary.total,
			itemCount: summary.itemCount,
		});
		setFormError("");
		onClearBag();
		setStep("confirmed");
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<AnimatePresence>
				{open && (
					<SheetContent side="right" className="p-0">
						{/* Sheet Header */}
						<div className="border-b border-border px-6 py-5">
							<div className="pr-10">
								<SheetTitle>
									{step === "bag" && `Shopping Bag (${summary.itemCount})`}
									{step === "checkout" && "Express Checkout"}
									{step === "confirmed" && "Order Confirmed"}
								</SheetTitle>
								<SheetDescription className="mt-1">
									{step === "bag" &&
										(summary.subtotal === 0
											? "Complimentary express delivery on orders over $250."
											: summary.amountUntilFreeShipping === 0
												? "Complimentary express delivery unlocked."
												: `Add ${formatCurrency(summary.amountUntilFreeShipping)} more for complimentary delivery.`)}
									{step === "checkout" &&
										"Direct dispatch from our London atelier."}
									{step === "confirmed" && "Your order summary is below."}
								</SheetDescription>
							</div>

							{step === "bag" && summary.subtotal > 0 && (
								<div className="mt-3.5 h-[2px] w-full bg-secondary overflow-hidden">
									<motion.div
										initial={{ scaleX: 0 }}
										animate={{ scaleX: summary.freeShippingProgress / 100 }}
										transition={{ duration: 0.45, ease: COS_EASE }}
										className="h-full origin-left bg-foreground"
									/>
								</div>
							)}
						</div>

						{/* Step 1: Bag Items */}
						{step === "bag" && (
							<>
								<div className="flex-1 overflow-y-auto px-6 py-5">
									{items.length === 0 ? (
										<div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center space-y-4">
											<p className="font-display text-base font-medium text-foreground">
												Your shopping bag is empty
											</p>
											<p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
												Explore the Autumn / Winter architectural collection to
												add tailored coats, cashmere knits, and leather goods.
											</p>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => handleOpenChange(false)}
											>
												Continue Browsing
											</Button>
										</div>
									) : (
										<ul className="divide-y divide-border">
											<AnimatePresence initial={false}>
												{items.map((item) => (
													<motion.li
														key={item.key}
														layout
														initial={{ opacity: 0, y: 8 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, height: 0, marginBottom: 0 }}
														transition={{ duration: 0.25, ease: COS_EASE }}
														className="flex gap-4 py-5 first:pt-0"
													>
														<div className="h-28 w-21 shrink-0 overflow-hidden bg-studio">
															<img
																src={item.image}
																alt={item.title}
																referrerPolicy="no-referrer"
																className="h-full w-full object-cover object-top"
															/>
														</div>
														<div className="flex flex-1 flex-col justify-between">
															<div className="space-y-1">
																<div className="flex items-start justify-between gap-2">
																	<h4 className="font-display text-[13px] font-medium leading-snug text-foreground">
																		{item.title}
																	</h4>
																	<span className="text-[13px] tabular-nums text-foreground">
																		{formatCurrency(item.price * item.quantity)}
																	</span>
																</div>
																<p className="text-xs text-muted-foreground">
																	{item.colorName} · Size {item.size}
																</p>
															</div>

															<div className="flex items-center justify-between pt-3">
																<div className="inline-flex items-center border border-border">
																	<button
																		type="button"
																		onClick={() =>
																			onUpdateQuantity(item.key, -1)
																		}
																		aria-label={`Decrease quantity of ${item.title}`}
																		className="inline-flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary"
																	>
																		<Minus className="h-3 w-3 stroke-[1.5]" />
																	</button>
																	<span className="w-8 text-center text-xs tabular-nums text-foreground">
																		{item.quantity}
																	</span>
																	<button
																		type="button"
																		onClick={() =>
																			onUpdateQuantity(item.key, 1)
																		}
																		aria-label={`Increase quantity of ${item.title}`}
																		className="inline-flex h-8 w-8 items-center justify-center text-foreground hover:bg-secondary"
																	>
																		<Plus className="h-3 w-3 stroke-[1.5]" />
																	</button>
																</div>

																<button
																	type="button"
																	onClick={() => onRemoveItem(item.key)}
																	aria-label={`Remove ${item.title}`}
																	className="inline-flex h-8 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
																>
																	<Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
																	<span>Remove</span>
																</button>
															</div>
														</div>
													</motion.li>
												))}
											</AnimatePresence>
										</ul>
									)}
								</div>

								{items.length > 0 && (
									<div className="border-t border-border bg-background px-6 py-5 space-y-4">
										<div className="space-y-2 text-[13px]">
											<div className="flex items-center justify-between text-muted-foreground">
												<span>Subtotal</span>
												<span className="tabular-nums text-foreground">
													{formatCurrency(summary.subtotal)}
												</span>
											</div>
											<div className="flex items-center justify-between text-muted-foreground">
												<span>Express Delivery</span>
												<span className="tabular-nums text-foreground">
													{summary.shipping === 0
														? "Complimentary"
														: formatCurrency(summary.shipping)}
												</span>
											</div>
											<div className="flex items-center justify-between border-t border-border pt-2.5 font-display text-sm font-medium text-foreground">
												<span>Total</span>
												<span className="tabular-nums">
													{formatCurrency(summary.total)}
												</span>
											</div>
										</div>

										<Button
											type="button"
											onClick={() => setStep("checkout")}
											className="h-12 w-full text-[13px] tracking-[0.06em] uppercase"
										>
											<span>Proceed to Checkout</span>
											<ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
										</Button>
									</div>
								)}
							</>
						)}

						{/* Step 2: Checkout Details */}
						{step === "checkout" && (
							<form
								onSubmit={handleCheckoutSubmit}
								noValidate
								className="flex flex-1 flex-col justify-between overflow-y-auto"
							>
								<div className="space-y-5 px-6 py-6">
									<div className="space-y-1.5">
										<label
											htmlFor="checkout-name"
											className="block text-xs font-medium text-foreground"
										>
											Full Name
										</label>
										<Input
											id="checkout-name"
											value={fullName}
											onChange={(e) => setFullName(e.target.value)}
											placeholder="Clara Lindqvist"
											required
										/>
									</div>

									<div className="space-y-1.5">
										<label
											htmlFor="checkout-email"
											className="block text-xs font-medium text-foreground"
										>
											Email Address
										</label>
										<Input
											id="checkout-email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="clara@atelier.example"
											required
										/>
									</div>

									<div className="space-y-1.5">
										<label
											htmlFor="checkout-address"
											className="block text-xs font-medium text-foreground"
										>
											Delivery Address
										</label>
										<Input
											id="checkout-address"
											value={address}
											onChange={(e) => setAddress(e.target.value)}
											placeholder="222 Regent Street, London W1B 5BD"
											required
										/>
									</div>

									{formError && (
										<p
											role="alert"
											className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
										>
											{formError}
										</p>
									)}

									<div className="border-t border-border pt-4 space-y-1.5 text-xs">
										<div className="flex justify-between text-muted-foreground">
											<span>Pieces ({summary.itemCount})</span>
											<span className="tabular-nums text-foreground">
												{formatCurrency(summary.subtotal)}
											</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Shipping</span>
											<span className="tabular-nums text-foreground">
												{summary.shipping === 0
													? "Complimentary"
													: formatCurrency(summary.shipping)}
											</span>
										</div>
										<div className="flex justify-between pt-2 font-display text-sm font-medium text-foreground">
											<span>Order Total</span>
											<span className="tabular-nums">
												{formatCurrency(summary.total)}
											</span>
										</div>
									</div>
								</div>

								<div className="border-t border-border px-6 py-5 space-y-2.5">
									<Button
										type="submit"
										className="h-12 w-full text-[13px] tracking-[0.06em] uppercase"
									>
										Place Order — {formatCurrency(summary.total)}
									</Button>
									<Button
										type="button"
										variant="ghost"
										onClick={() => setStep("bag")}
										className="h-10 w-full text-xs text-muted-foreground"
									>
										Return to Bag
									</Button>
								</div>
							</form>
						)}

						{/* Step 3: Post-Order Confirmation Receipt */}
						{step === "confirmed" && order && (
							<div className="flex flex-1 flex-col justify-between px-6 py-8">
								<div className="space-y-6">
									<div className="inline-flex h-11 w-11 items-center justify-center border border-foreground bg-primary text-primary-foreground">
										<Check className="h-5 w-5 stroke-[1.75]" />
									</div>
									<div className="space-y-2">
										<p className="font-mono text-xs text-muted-foreground">
											{order.orderNumber}
										</p>
										<h3 className="font-display text-xl font-medium text-foreground">
											Order Confirmed — Preparing Shipment
										</h3>
										<p className="text-sm leading-relaxed text-muted-foreground">
											Thank you, {order.recipientName}. A receipt has been
											recorded for {order.email}.
										</p>
									</div>

									<div className="border-y border-border py-4 space-y-2 text-xs">
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Items Ordered
											</span>
											<span className="tabular-nums font-medium text-foreground">
												{order.itemCount}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Total Charged
											</span>
											<span className="tabular-nums font-medium text-foreground">
												{formatCurrency(order.total)}
											</span>
										</div>
									</div>
								</div>

								<Button
									type="button"
									variant="outline"
									onClick={() => handleOpenChange(false)}
									className="h-12 w-full"
								>
									Continue Exploring
								</Button>
							</div>
						)}
					</SheetContent>
				)}
			</AnimatePresence>
		</Sheet>
	);
};
