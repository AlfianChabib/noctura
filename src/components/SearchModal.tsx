import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	CATALOG_PRODUCTS,
	type Product,
	type ProductCategory,
} from "@/data/catalog";
import { COS_EASE } from "@/lib/motion";
import {
	type CountryConfig,
	formatLocalizedPrice,
	SUPPORTED_COUNTRIES,
} from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

const TRENDING_KEYWORDS = [
	"Cashmere Knit",
	"Double-Breasted Wool Overcoat",
	"Wide-Leg Pleated Wool Trousers",
	"Folded Leather Atelier Tote",
	"Concealed-Placket Trench Coat",
	"Sculpted Organic Poplin Shirt",
];

const QUICK_CATEGORIES: ProductCategory[] = [
	"All",
	"Women",
	"Men",
	"Outerwear",
	"Knitwear",
	"Accessories",
];

export interface SearchModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	products?: Product[];
	onSelectCategory?: (category: ProductCategory) => void;
	onSelectProduct?: (product: Product) => void;
	country?: CountryConfig;
}

export const SearchModal: React.FC<SearchModalProps> = ({
	open,
	onOpenChange,
	products = CATALOG_PRODUCTS,
	onSelectCategory,
	onSelectProduct,
	country = SUPPORTED_COUNTRIES[0],
}) => {
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when opened
	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				inputRef.current?.focus();
			}, 80);
			return () => clearTimeout(timer);
		}
		setQuery("");
	}, [open]);

	// Escape key listener
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && open) {
				onOpenChange(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);

	// Computed matching products
	const matchingProducts = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return products;

		return products.filter((product) => {
			const haystack = [
				product.title,
				product.subtitle,
				product.category,
				product.composition,
				...product.colors.map((c) => c.name),
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(normalized);
		});
	}, [products, query]);

	// Computed autocomplete terms
	const suggestions = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return [];

		return TRENDING_KEYWORDS.filter((k) =>
			k.toLowerCase().includes(normalized),
		);
	}, [query]);

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					role="dialog"
					aria-modal="true"
					aria-label="Search collection"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.22, ease: COS_EASE }}
					className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-y-auto"
				>
					{/* Sticky Top Bar — COS Style with Type here to search & CLOSE action */}
					<div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3 sm:px-8 sm:py-4">
						<div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
							<div className="flex flex-1 items-center gap-3">
								<Search className="h-4 w-4 shrink-0 stroke-[1.5] text-muted-foreground" />
								<input
									ref={inputRef}
									type="text"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Type here to search"
									className="w-full bg-transparent text-sm sm:text-base font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
								/>
								{query && (
									<button
										type="button"
										onClick={() => {
											setQuery("");
											inputRef.current?.focus();
										}}
										aria-label="Clear search query"
										className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
									>
										<X className="h-4 w-4 stroke-[1.5]" />
									</button>
								)}
							</div>

							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.08em] text-foreground hover:bg-secondary transition-colors cursor-pointer rounded-none border border-transparent hover:border-border"
							>
								<span>Close</span>
								<X className="h-3.5 w-3.5 stroke-[1.5]" />
							</button>
						</div>
					</div>

					{/* Modal Content */}
					<div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 space-y-10">
						{/* Autocomplete Suggestions if typing */}
						{suggestions.length > 0 && (
							<div className="space-y-2 border-b border-border pb-6">
								<p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
									Suggested Searches
								</p>
								<div className="flex flex-wrap gap-2 pt-1">
									{suggestions.map((term) => (
										<button
											key={term}
											type="button"
											onClick={() => setQuery(term)}
											className="inline-flex items-center gap-2 border border-border bg-background px-3 py-1.5 text-xs font-sans text-foreground hover:border-foreground transition-colors cursor-pointer rounded-none"
										>
											<span>{term}</span>
											<ArrowRight className="h-3 w-3 stroke-[1.5] text-muted-foreground" />
										</button>
									))}
								</div>
							</div>
						)}

						{/* Trending Searches Row */}
						<div className="space-y-2.5">
							<p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
								Trending Searches
							</p>
							<div className="flex flex-wrap items-center gap-2 pt-1">
								{TRENDING_KEYWORDS.map((term) => (
									<button
										key={term}
										type="button"
										onClick={() => setQuery(term)}
										className={cn(
											"inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer",
											query.toLowerCase() === term.toLowerCase()
												? "border-foreground bg-foreground text-background font-medium"
												: "border-border bg-background text-foreground hover:border-foreground",
										)}
									>
										<span>{term}</span>
									</button>
								))}
							</div>
						</div>

						{/* Quick Categories Row */}
						{onSelectCategory && (
							<div className="space-y-2.5">
								<p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
									Categories
								</p>
								<div className="flex flex-wrap items-center gap-2 pt-1">
									{QUICK_CATEGORIES.map((cat) => (
										<button
											key={cat}
											type="button"
											onClick={() => {
												onOpenChange(false);
												onSelectCategory(cat);
											}}
											className="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-foreground hover:border-foreground transition-colors cursor-pointer"
										>
											<span>{cat}</span>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Live Product Preview Results */}
						<div className="space-y-4 pt-4">
							<div className="flex items-center justify-between border-b border-border pb-3">
								<p className="font-display text-sm font-medium uppercase tracking-[0.06em] text-foreground">
									{query.trim()
										? `Matching Pieces (${matchingProducts.length})`
										: "Curated Collection"}
								</p>
								{query.trim() && (
									<span className="font-mono text-xs text-muted-foreground tabular-nums">
										{matchingProducts.length}{" "}
										{matchingProducts.length === 1 ? "result" : "results"}
									</span>
								)}
							</div>

							{matchingProducts.length > 0 ? (
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
									{matchingProducts.map((product) => (
										<div
											key={product.id}
											className="group flex flex-col space-y-2.5"
										>
											<div className="relative aspect-3/4 w-full overflow-hidden bg-studio">
												<button
													type="button"
													onClick={() => {
														onOpenChange(false);
														onSelectProduct?.(product);
													}}
													className="block h-full w-full text-left cursor-pointer focus:outline-none"
												>
													<img
														src={product.image}
														alt={product.imageAlt}
														referrerPolicy="no-referrer"
														className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
													/>
												</button>
												{product.editorialLabel && (
													<span className="absolute top-2 left-2 z-10 bg-background/90 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-foreground">
														{product.editorialLabel}
													</span>
												)}
											</div>

											<div className="space-y-1">
												<button
													type="button"
													onClick={() => {
														onOpenChange(false);
														onSelectProduct?.(product);
													}}
													className="text-left font-display text-xs sm:text-sm font-medium text-foreground hover:underline cursor-pointer truncate block w-full"
												>
													{product.title}
												</button>
												<p className="text-[11px] text-muted-foreground truncate">
													{product.subtitle}
												</p>
												<p className="font-sans text-xs text-foreground tabular-nums">
													{formatLocalizedPrice(product.price, country)}
												</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="my-12 flex flex-col items-center justify-center border border-border py-16 px-6 text-center space-y-3">
									<p className="font-display text-base font-medium text-foreground">
										No pieces match &ldquo;{query}&rdquo;
									</p>
									<p className="max-w-xs text-xs text-muted-foreground">
										Try adjusting your search terms or view our complete Autumn
										/ Winter collection.
									</p>
									<button
										type="button"
										onClick={() => setQuery("")}
										className="mt-2 inline-flex items-center justify-center rounded-none border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider text-foreground hover:border-foreground"
									>
										Clear Search
									</button>
								</div>
							)}
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
