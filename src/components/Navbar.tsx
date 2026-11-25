import { AnimatePresence, motion } from "framer-motion";
import { Globe, Menu, Search, ShoppingBag, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	MEGA_MENU_CONFIG,
	type NavCategoryConfig,
	type ProductCategory,
} from "@/data/catalog";
import { COS_EASE, COS_SPRING, dropdownFadeVariants } from "@/lib/motion";
import type { CountryConfig } from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

export type AppView = "storefront" | "design-system";

interface NavbarProps {
	activeView: AppView;
	activeCategory: ProductCategory;
	bagCount: number;
	searchQuery: string;
	onSelectCategory: (category: ProductCategory) => void;
	onNavigateView: (view: AppView) => void;
	onSearchChange: (value: string) => void;
	onOpenBag: () => void;
	onOpenSearchModal?: () => void;
	onOpenCountryModal?: () => void;
	activeCountry?: CountryConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
	activeView,
	activeCategory,
	bagCount,
	searchQuery,
	onSelectCategory,
	onNavigateView,
	onSearchChange,
	onOpenBag,
	onOpenSearchModal,
	onOpenCountryModal,
	activeCountry,
}) => {
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const closeTimeoutRef = useRef<number | null>(null);
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	const activeMegaMenu: NavCategoryConfig | undefined = MEGA_MENU_CONFIG.find(
		(item) => item.id === openMenuId,
	);

	useEffect(() => {
		if (searchOpen) {
			window.setTimeout(() => searchInputRef.current?.focus(), 60);
		}
	}, [searchOpen]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpenMenuId(null);
				setSearchOpen(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const handleMenuEnter = (id: string) => {
		if (closeTimeoutRef.current) {
			window.clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setOpenMenuId(id);
	};

	const handleMenuLeave = () => {
		closeTimeoutRef.current = window.setTimeout(() => {
			setOpenMenuId(null);
		}, 140);
	};

	const handleSelectNavCategory = (category: ProductCategory) => {
		setOpenMenuId(null);
		setMobileNavOpen(false);
		onNavigateView("storefront");
		onSelectCategory(category);
		window.setTimeout(() => {
			const el = document.getElementById("collection");
			el?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 40);
	};

	const handleBrandClick = () => {
		setOpenMenuId(null);
		onNavigateView("storefront");
		onSelectCategory("All");
		onSearchChange("");
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<motion.header
			className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm"
			onMouseLeave={handleMenuLeave}
		>
			<div className="mx-auto flex h-16 max-w-360 items-center justify-between gap-8 px-4 sm:px-8 lg:px-12">
				{/* Zone 1: Single-line Brand Wordmark (+ Mobile Menu trigger on small screens) */}
				<div className="flex items-center gap-3 shrink-0">
					<button
						type="button"
						onClick={() => setMobileNavOpen(true)}
						aria-label="Open navigation menu"
						className="inline-flex h-10 w-10 items-center justify-center rounded-none text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
					>
						<Menu className="h-4 w-4 stroke-[1.5]" />
					</button>
					<button
						type="button"
						onClick={handleBrandClick}
						className="font-display text-[19px] font-semibold tracking-[0.26em] text-foreground whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline"
					>
						NOCTURA
					</button>
				</div>

				{/* Zone 2: 5 concise single-line links inside Radix NavigationMenu */}
				<NavigationMenu
					className="hidden md:flex"
					aria-label="Primary navigation"
				>
					<NavigationMenuList>
						{MEGA_MENU_CONFIG.map((item) => {
							const isOpen = openMenuId === item.id;
							const isSelected =
								activeView === "storefront" &&
								((item.id === "new-in" && activeCategory === "All") ||
									(item.id !== "new-in" && activeCategory === item.category));

							return (
								<NavigationMenuItem
									key={item.id}
									onMouseEnter={() => handleMenuEnter(item.id)}
								>
									<button
										type="button"
										aria-expanded={isOpen}
										onClick={() => {
											if (isOpen) {
												handleSelectNavCategory(item.category);
											} else {
												setOpenMenuId(item.id);
											}
										}}
										className={cn(
											"relative inline-flex h-16 items-center whitespace-nowrap shrink-0 px-0.5 text-[13px] tracking-[0.02em] transition-colors duration-200 focus-visible:outline-none focus-visible:text-foreground",
											isOpen || isSelected
												? "text-foreground font-medium"
												: "text-foreground/72 hover:text-foreground",
										)}
									>
										{item.label}
										{(isOpen || isSelected) && (
											<motion.span
												layoutId="noctura-nav-underline"
												transition={COS_SPRING}
												className="absolute inset-x-0 bottom-0 h-[1.5px] bg-foreground"
											/>
										)}
									</button>
								</NavigationMenuItem>
							);
						})}

						<NavigationMenuItem onMouseEnter={() => setOpenMenuId(null)}>
							<NavigationMenuLink asChild>
								<button
									type="button"
									onClick={() => {
										setOpenMenuId(null);
										onNavigateView("design-system");
										window.scrollTo({ top: 0, behavior: "smooth" });
									}}
									className={cn(
										"relative inline-flex h-16 items-center whitespace-nowrap shrink-0 px-0.5 text-[13px] tracking-[0.02em] transition-colors duration-200 focus-visible:outline-none focus-visible:text-foreground",
										activeView === "design-system"
											? "text-foreground font-medium"
											: "text-foreground/72 hover:text-foreground",
									)}
								>
									Design System
									{activeView === "design-system" && (
										<motion.span
											layoutId="noctura-nav-underline"
											transition={COS_SPRING}
											className="absolute inset-x-0 bottom-0 h-[1.5px] bg-foreground"
										/>
									)}
								</button>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>

				{/* Zone 3: Country/Currency, Search & Primary Shopping Bag Action */}
				<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
					{activeCountry && (
						<button
							type="button"
							onClick={onOpenCountryModal}
							aria-label={`Current shipping destination: ${activeCountry.name}. Currency: ${activeCountry.currency}. Click to switch country and currency.`}
							className="hidden sm:inline-flex h-10 items-center gap-1.5 px-2.5 text-[11px] font-mono tracking-wider text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors"
						>
							<Globe className="h-3.5 w-3.5 stroke-[1.5]" />
							<span>
								{activeCountry.code} ({activeCountry.currencySymbol})
							</span>
						</button>
					)}

					<button
						type="button"
						onClick={() => {
							setOpenMenuId(null);
							if (onOpenSearchModal) {
								onOpenSearchModal();
							} else {
								setSearchOpen((prev) => !prev);
							}
						}}
						aria-label={searchOpen ? "Close search" : "Search collection"}
						aria-expanded={searchOpen}
						className="inline-flex h-10 w-10 items-center justify-center rounded-none text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						{searchOpen ? (
							<X className="h-4 w-4 stroke-[1.5]" />
						) : (
							<Search className="h-4 w-4 stroke-[1.5]" />
						)}
					</button>

					<button
						type="button"
						onClick={onOpenBag}
						aria-label={`Open shopping bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}
						className="inline-flex h-10 items-center gap-2 whitespace-nowrap shrink-0 rounded-none border border-foreground bg-primary px-4 text-[12px] font-medium tracking-[0.06em] text-primary-foreground transition-colors duration-200 hover:bg-primary/88 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						<ShoppingBag className="h-3.5 w-3.5 stroke-[1.5]" />
						<span className="tabular-nums">Bag ({bagCount})</span>
					</button>
				</div>
			</div>

			{/* Full-Width Architectural Mega-Menu Dropdown with Slow Opacity Fade */}
			<AnimatePresence>
				{activeMegaMenu && (
					<motion.div
						key={activeMegaMenu.id}
						variants={dropdownFadeVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						onMouseEnter={() => handleMenuEnter(activeMegaMenu.id)}
						onMouseLeave={handleMenuLeave}
						role="region"
						aria-label={`${activeMegaMenu.label} menu`}
						className="absolute inset-x-0 top-full z-40 border-b border-border bg-background"
					>
						<div className="mx-auto grid max-w-360 grid-cols-12 gap-10 px-8 py-10 lg:px-12">
							<div className="col-span-8 grid grid-cols-2 gap-12 pt-1">
								{activeMegaMenu.columns.map((col) => (
									<div key={col.heading} className="space-y-4">
										<p className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
											{col.heading}
										</p>
										<ul className="space-y-2.5">
											{col.links.map((link) => (
												<li key={link.label}>
													<button
														type="button"
														onClick={() =>
															handleSelectNavCategory(link.category)
														}
														className="group relative text-left text-[14px] text-foreground/85 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:underline"
													>
														<span>{link.label}</span>
														<span className="block h-px max-w-0 bg-foreground transition-all duration-300 group-hover:max-w-full" />
													</button>
												</li>
											))}
										</ul>
									</div>
								))}
							</div>

							<div className="col-span-4 border-l border-border pl-10">
								<button
									type="button"
									onClick={() =>
										handleSelectNavCategory(activeMegaMenu.category)
									}
									className="group flex w-full items-center gap-5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									<div className="h-32 w-24 shrink-0 overflow-hidden bg-studio">
										<img
											src={activeMegaMenu.editorialImage}
											alt={activeMegaMenu.editorialTitle}
											referrerPolicy="no-referrer"
											className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
										/>
									</div>
									<div className="space-y-1.5">
										<p className="font-display text-sm font-medium text-foreground">
											{activeMegaMenu.editorialTitle}
										</p>
										<p className="text-xs leading-relaxed text-muted-foreground">
											{activeMegaMenu.editorialCaption}
										</p>
										<span className="inline-block pt-1 text-xs font-medium text-foreground underline underline-offset-4">
											Shop Edit
										</span>
									</div>
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Expandable Monochrome Search Bar Overlay */}
			<AnimatePresence>
				{searchOpen && (
					<motion.div
						key="search-drawer"
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.24, ease: COS_EASE }}
						className="border-t border-border bg-background"
					>
						<div className="mx-auto flex max-w-360 items-center gap-4 px-4 py-3.5 sm:px-8 lg:px-12">
							<Search className="h-4 w-4 shrink-0 stroke-[1.5] text-muted-foreground" />
							<label htmlFor="header-search-input" className="sr-only">
								Search garments, fabrics, or colors
							</label>
							<Input
								id="header-search-input"
								ref={searchInputRef}
								type="search"
								value={searchQuery}
								onChange={(e) => {
									if (activeView !== "storefront") {
										onNavigateView("storefront");
									}
									onSearchChange(e.target.value);
								}}
								placeholder="Search coats, cashmere, poplin, wool..."
								className="h-9 border-0 border-b border-transparent bg-transparent px-0 text-sm focus-visible:border-foreground"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => onSearchChange("")}
									className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
								>
									Clear
								</button>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Responsive Mobile Navigation Drawer */}
			<Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
				<AnimatePresence>
					{mobileNavOpen && (
						<SheetContent side="left" className="p-0">
							<div className="border-b border-border px-6 py-5">
								<SheetTitle>Navigation</SheetTitle>
								<SheetDescription className="sr-only">
									Browse NOCTURA collections and design system documentation
								</SheetDescription>
							</div>
							<nav className="flex flex-col divide-y divide-border px-6 py-2">
								{MEGA_MENU_CONFIG.map((item) => (
									<button
										key={item.id}
										type="button"
										onClick={() => handleSelectNavCategory(item.category)}
										className="flex h-12 items-center justify-between text-left text-sm font-medium text-foreground"
									>
										<span>{item.label}</span>
									</button>
								))}
								<button
									type="button"
									onClick={() => {
										setMobileNavOpen(false);
										onNavigateView("design-system");
										window.scrollTo({ top: 0, behavior: "smooth" });
									}}
									className="flex h-12 items-center justify-between text-left text-sm font-medium text-foreground"
								>
									<span>Design System</span>
								</button>
								{activeCountry && (
									<button
										type="button"
										onClick={() => {
											setMobileNavOpen(false);
											onOpenCountryModal?.();
										}}
										className="flex h-12 items-center justify-between text-left text-sm font-medium text-foreground"
									>
										<span className="flex items-center gap-2">
											<Globe className="h-4 w-4 stroke-[1.5]" />
											Shipping Location
										</span>
										<span className="font-mono text-xs text-muted-foreground">
											{activeCountry.name} ({activeCountry.code})
										</span>
									</button>
								)}
							</nav>
						</SheetContent>
					)}
				</AnimatePresence>
			</Sheet>
		</motion.header>
	);
};
