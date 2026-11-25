import { Globe } from "lucide-react";
import type * as React from "react";
import type { ProductCategory } from "@/data/catalog";
import type { CountryConfig } from "@/lib/storeLogic";
import type { AppView } from "./Navbar";

interface FooterProps {
	onSelectCategory: (category: ProductCategory) => void;
	onNavigateView: (view: AppView) => void;
	activeCountry?: CountryConfig;
	onOpenCountryModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
	onSelectCategory,
	onNavigateView,
	activeCountry,
	onOpenCountryModal,
}) => {
	const handleCategoryLink = (category: ProductCategory) => {
		onNavigateView("storefront");
		onSelectCategory(category);
		window.setTimeout(() => {
			document
				.getElementById("collection")
				?.scrollIntoView({ behavior: "smooth" });
		}, 40);
	};

	return (
		<footer className="border-t border-border bg-background text-foreground">
			<div className="mx-auto max-w-360 px-4 py-14 sm:px-8 lg:px-12">
				<div className="grid grid-cols-2 gap-10 md:grid-cols-4">
					<div className="col-span-2 md:col-span-1 space-y-3">
						<span className="font-display text-lg font-semibold tracking-[0.26em] text-foreground">
							NOCTURA
						</span>
						<p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
							Modern architectural wardrobe essentials engineered for longevity,
							restraint, and tactile permanence.
						</p>
					</div>

					<div className="space-y-3">
						<h3 className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
							Collection
						</h3>
						<ul className="space-y-2 text-xs text-foreground/80">
							<li>
								<button
									type="button"
									onClick={() => handleCategoryLink("All")}
									className="hover:text-foreground hover:underline underline-offset-4"
								>
									All New Arrivals
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => handleCategoryLink("Women")}
									className="hover:text-foreground hover:underline underline-offset-4"
								>
									Womenswear
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => handleCategoryLink("Men")}
									className="hover:text-foreground hover:underline underline-offset-4"
								>
									Menswear
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => handleCategoryLink("Accessories")}
									className="hover:text-foreground hover:underline underline-offset-4"
								>
									Leather Goods
								</button>
							</li>
						</ul>
					</div>

					<div className="space-y-3">
						<h3 className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
							Client Care
						</h3>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li>Complimentary delivery over $250</li>
							<li>30-day architectural returns</li>
							<li>London Atelier · 222 Regent St</li>
						</ul>
					</div>

					<div className="space-y-3">
						<h3 className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
							Architecture
						</h3>
						<ul className="space-y-2 text-xs text-foreground/80">
							<li>
								<button
									type="button"
									onClick={() => {
										onNavigateView("design-system");
										window.scrollTo({ top: 0, behavior: "smooth" });
									}}
									className="hover:text-foreground hover:underline underline-offset-4"
								>
									Design System & HSL Tokens
								</button>
							</li>
							<li className="text-muted-foreground">
								Zero-Radius Geometry (0px)
							</li>
							<li className="text-muted-foreground">
								Framer Motion Choreography
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6">
						<p>© 2026 NOCTURA Architectural Storefront & Design System</p>
						<p className="hidden md:inline">
							Monochrome UI Specification · Sharp Geometry
						</p>
					</div>
					{activeCountry && (
						<button
							type="button"
							onClick={onOpenCountryModal}
							className="inline-flex items-center gap-2 text-[11px] font-mono tracking-wider text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
						>
							<Globe className="h-3.5 w-3.5 stroke-[1.5]" />
							<span>
								SHIPPING TO:{" "}
								<span className="text-foreground underline underline-offset-4">
									{activeCountry.name} ({activeCountry.currency}{" "}
									{activeCountry.currencySymbol})
								</span>
							</span>
						</button>
					)}
				</div>
			</div>
		</footer>
	);
};
