import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Search, ShoppingBag, Sun, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { COS_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { GenderAudience } from "@/shared/schemas/catalog";

interface StorefrontShellProps {
	children: React.ReactNode;
	searchValue: string;
	onSearchChange: (nextSearch: string) => void;
	onSearchSubmit?: (searchValue: string) => void;
	activeGenderAudience?: GenderAudience | null;
	bagCount?: number;
}

const DEPARTMENT_LINKS: Array<{
	label: string;
	genderAudience?: GenderAudience;
}> = [
	{ label: "All Pieces" },
	{ label: "Women", genderAudience: "women" },
	{ label: "Men", genderAudience: "men" },
	{ label: "Unisex", genderAudience: "unisex" },
	{ label: "Kids", genderAudience: "kids" },
];

export function StorefrontShell({
	children,
	searchValue,
	onSearchChange,
	onSearchSubmit,
	activeGenderAudience,
	bagCount = 0,
}: StorefrontShellProps) {
	const [searchOpen, setSearchOpen] = useState(Boolean(searchValue));
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [isDark, setIsDark] = useState(false);
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"));
	}, []);

	const toggleTheme = () => {
		setIsDark((prev) => {
			const next = !prev;
			document.documentElement.classList.toggle("dark", next);
			return next;
		});
	};

	useEffect(() => {
		if (searchOpen) {
			window.setTimeout(() => searchInputRef.current?.focus(), 60);
		}
	}, [searchOpen]);

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
			<header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
				<div className="mx-auto flex h-16 max-w-360 items-center justify-between gap-6 px-4 sm:px-8 lg:px-12">
					<div className="flex items-center gap-3 shrink-0">
						<button
							type="button"
							onClick={() => setMobileNavOpen(true)}
							aria-label="Open navigation menu"
							className="inline-flex h-10 w-10 items-center justify-center rounded-none text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
						>
							<Menu className="h-4 w-4 stroke-[1.5]" />
						</button>

						<Link
							to="/products"
							search={{}}
							className="font-display text-[19px] font-semibold tracking-[0.26em] text-foreground whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline"
						>
							NOCTURA
						</Link>
					</div>

					<nav
						aria-label="Department navigation"
						className="hidden md:flex items-center gap-7"
					>
						{DEPARTMENT_LINKS.map((item) => {
							const isSelected = item.genderAudience
								? activeGenderAudience === item.genderAudience
								: !activeGenderAudience;
							return (
								<Link
									key={item.label}
									to="/products"
									search={
										item.genderAudience
											? { genderAudience: item.genderAudience }
											: {}
									}
									className={cn(
										"relative inline-flex h-16 items-center whitespace-nowrap px-0.5 text-[13px] tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:text-foreground",
										isSelected
											? "text-foreground font-medium border-b-[1.5px] border-foreground"
											: "text-foreground/72 hover:text-foreground",
									)}
								>
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
						<button
							type="button"
							onClick={toggleTheme}
							aria-label={
								isDark ? "Switch to light mode" : "Switch to dark mode"
							}
							className="inline-flex h-10 w-10 items-center justify-center rounded-none text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{isDark ? (
								<Sun className="h-4 w-4 stroke-[1.5]" />
							) : (
								<Moon className="h-4 w-4 stroke-[1.5]" />
							)}
						</button>

						<button
							type="button"
							onClick={() => setSearchOpen((prev) => !prev)}
							aria-label={searchOpen ? "Close search" : "Search catalog"}
							aria-expanded={searchOpen}
							className="inline-flex h-10 w-10 items-center justify-center rounded-none text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{searchOpen ? (
								<X className="h-4 w-4 stroke-[1.5]" />
							) : (
								<Search className="h-4 w-4 stroke-[1.5]" />
							)}
						</button>

						<Link
							to="/products"
							search={{ inStock: true }}
							aria-label={`Shopping bag, ${bagCount} items`}
							className="inline-flex h-10 items-center gap-2 whitespace-nowrap shrink-0 rounded-none border border-foreground bg-primary px-4 text-[12px] font-medium tracking-[0.06em] text-primary-foreground transition-colors duration-200 hover:bg-primary/88 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<ShoppingBag className="h-3.5 w-3.5 stroke-[1.5]" />
							<span className="tabular-nums">Bag ({bagCount})</span>
						</Link>
					</div>
				</div>

				<AnimatePresence>
					{searchOpen && (
						<motion.div
							key="plp-search-bar"
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: 0.22, ease: COS_EASE }}
							className="border-t border-border bg-background"
						>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									onSearchSubmit?.(searchValue);
								}}
								className="mx-auto flex max-w-360 items-center gap-4 px-4 py-3 sm:px-8 lg:px-12"
							>
								<Search className="h-4 w-4 shrink-0 stroke-[1.5] text-muted-foreground" />
								<label htmlFor="plp-header-search" className="sr-only">
									Search products by name, brand, or SKU
								</label>
								<Input
									id="plp-header-search"
									ref={searchInputRef}
									type="search"
									value={searchValue}
									onChange={(e) => onSearchChange(e.target.value)}
									placeholder="Search garments, fabrics, brand, or SKU..."
									className="h-9 border-0 border-b border-transparent bg-transparent px-0 text-sm focus-visible:border-foreground"
								/>
								{searchValue && (
									<button
										type="button"
										onClick={() => onSearchChange("")}
										className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
									>
										Clear
									</button>
								)}
							</form>
						</motion.div>
					)}
				</AnimatePresence>

				<Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
					<AnimatePresence>
						{mobileNavOpen && (
							<SheetContent side="left" className="p-0">
								<div className="border-b border-border px-6 py-5">
									<SheetTitle>Navigation</SheetTitle>
									<SheetDescription className="sr-only">
										Browse NOCTURA departments
									</SheetDescription>
								</div>
								<nav className="flex flex-col divide-y divide-border px-6 py-2">
									{DEPARTMENT_LINKS.map((item) => (
										<Link
											key={item.label}
											to="/products"
											search={
												item.genderAudience
													? { genderAudience: item.genderAudience }
													: {}
											}
											onClick={() => setMobileNavOpen(false)}
											className="flex h-12 items-center justify-between text-left text-sm font-medium text-foreground"
										>
											<span>{item.label}</span>
										</Link>
									))}
									<Link
										to="/auth/login"
										onClick={() => setMobileNavOpen(false)}
										className="flex h-12 items-center justify-between text-left text-sm font-medium text-foreground"
									>
										<span>Account &amp; Sign In</span>
									</Link>
								</nav>
							</SheetContent>
						)}
					</AnimatePresence>
				</Sheet>
			</header>

			<main className="flex-1">{children}</main>

			<footer className="border-t border-border bg-background text-foreground">
				<div className="mx-auto max-w-360 px-4 py-14 sm:px-8 lg:px-12">
					<div className="grid grid-cols-2 gap-10 md:grid-cols-4">
						<div className="col-span-2 md:col-span-1 space-y-3">
							<span className="font-display text-lg font-semibold tracking-[0.26em] text-foreground">
								NOCTURA
							</span>
							<p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
								Modern architectural wardrobe essentials engineered for
								longevity, restraint, and tactile permanence.
							</p>
						</div>

						<div className="space-y-3">
							<h2 className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
								Collection
							</h2>
							<ul className="space-y-2 text-xs text-foreground/80">
								{DEPARTMENT_LINKS.slice(0, 4).map((item) => (
									<li key={item.label}>
										<Link
											to="/products"
											search={
												item.genderAudience
													? { genderAudience: item.genderAudience }
													: {}
											}
											className="hover:text-foreground hover:underline underline-offset-4"
										>
											{item.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						<div className="space-y-3">
							<h2 className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
								Client Care
							</h2>
							<ul className="space-y-2 text-xs text-muted-foreground">
								<li>Domestic courier shipping across Indonesia</li>
								<li>7-day size exchange &amp; returns</li>
								<li>Jakarta Atelier · Senopati</li>
							</ul>
						</div>

						<div className="space-y-3">
							<h2 className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
								Account
							</h2>
							<ul className="space-y-2 text-xs text-foreground/80">
								<li>
									<Link
										to="/auth/login"
										className="hover:text-foreground hover:underline underline-offset-4"
									>
										Sign In / Register
									</Link>
								</li>
								<li>
									<Link
										to="/account"
										className="hover:text-foreground hover:underline underline-offset-4"
									>
										My Account
									</Link>
								</li>
							</ul>
						</div>
					</div>

					<div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
						<p>© 2026 NOCTURA · Architectural Fashion Storefront</p>
						<p className="font-mono uppercase tracking-wider">
							Currency: IDR (Rp)
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
