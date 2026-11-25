import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	Check,
	Copy,
	Globe,
	Moon,
	Search,
	SlidersHorizontal,
	Sun,
} from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { CategoryPillsNav } from "@/components/CategoryPillsNav";
import { CountryCurrencyModal } from "@/components/CountryCurrencyModal";
import { FilterDrawer } from "@/components/FilterDrawer";
import { GridDensitySwitch } from "@/components/GridDensitySwitch";
import { InGridEditorialCard } from "@/components/InGridEditorialCard";
import { LoadMorePagination } from "@/components/LoadMorePagination";
import { NewsletterSection } from "@/components/NewsletterSection";
import { ProductCard } from "@/components/ProductCard";
import { SearchModal } from "@/components/SearchModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CATALOG_PRODUCTS } from "@/data/catalog";
import {
	COS_EASE,
	COS_IMAGE_TRANSITION,
	dropdownFadeVariants,
} from "@/lib/motion";
import {
	type CountryConfig,
	type FacetFilterOptions,
	formatLocalizedPrice,
	type GridDensity,
	type SortOption,
	SUPPORTED_COUNTRIES,
} from "@/lib/storeLogic";
import {
	COMPONENT_MAPPINGS,
	GLOBALS_CSS_SNIPPET,
	HSL_TOKENS,
	TAILWIND_CONFIG_SNIPPET,
} from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface DesignSystemViewProps {
	isDark: boolean;
	onToggleTheme: () => void;
	onBackToStorefront: () => void;
}

export const DesignSystemView: React.FC<DesignSystemViewProps> = ({
	isDark,
	onToggleTheme,
	onBackToStorefront,
}) => {
	const [activeCodeTab, setActiveCodeTab] = useState<"globals" | "tailwind">(
		"globals",
	);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
	const [demoCardHovered, setDemoCardHovered] = useState(false);
	const [demoCheckbox1, setDemoCheckbox1] = useState(true);
	const [demoCheckbox2, setDemoCheckbox2] = useState(false);
	const [demoSortValue, setDemoSortValue] = useState("recommended");
	const [demoCategory, setDemoCategory] = useState("All");
	const [demoDensity, setDemoDensity] = useState<GridDensity>("3");
	const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
	const [demoDrawerSort, setDemoDrawerSort] = useState<SortOption>("featured");
	const [demoDrawerFacets, setDemoDrawerFacets] = useState<FacetFilterOptions>({
		materials: ["Cashmere"],
	});
	const [demoPaginationPage, setDemoPaginationPage] = useState(1);
	const [demoSavedIds, setDemoSavedIds] = useState<string[]>([]);
	const [demoPaginationLoading, setDemoPaginationLoading] = useState(false);
	const [demoSearchOpen, setDemoSearchOpen] = useState(false);
	const [demoCountryOpen, setDemoCountryOpen] = useState(false);
	const [demoCountry, setDemoCountry] = useState<CountryConfig>(
		SUPPORTED_COUNTRIES[0],
	);

	const handleCopy = async (key: string, content: string) => {
		try {
			await navigator.clipboard.writeText(content);
			setCopiedKey(key);
			window.setTimeout(() => setCopiedKey(null), 1600);
		} catch {
			setCopiedKey(key);
			window.setTimeout(() => setCopiedKey(null), 1600);
		}
	};

	const sampleProduct = CATALOG_PRODUCTS[0];

	return (
		<div className="mx-auto max-w-360 px-4 py-12 sm:px-8 lg:px-12 lg:py-16 space-y-16">
			{/* Specification Header */}
			<div className="flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
				<div className="max-w-2xl space-y-3">
					<button
						type="button"
						onClick={onBackToStorefront}
						className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
						<span>Return to Storefront</span>
					</button>
					<h1
						className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
						style={{ textWrap: "balance" }}
					>
						NOCTURA Monochrome Design System
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Reverse-engineered shadcn/ui + Radix UI + Framer Motion architecture
						characterized by stark monochrome HSL tokenization, strict{" "}
						<span className="font-mono text-foreground">--radius: 0rem</span>{" "}
						sharp geometry, and restrained editorial micro-interactions.
					</p>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					<Button
						type="button"
						variant="outline"
						onClick={onToggleTheme}
						aria-label={
							isDark ? "Switch to light theme" : "Switch to dark theme"
						}
						className="h-10 gap-2 text-xs"
					>
						{isDark ? (
							<>
								<Sun className="h-3.5 w-3.5 stroke-[1.5]" />
								<span>Light Theme</span>
							</>
						) : (
							<>
								<Moon className="h-3.5 w-3.5 stroke-[1.5]" />
								<span>Dark Theme</span>
							</>
						)}
					</Button>
				</div>
			</div>

			{/* 01. HSL Tokenization Grid */}
			<section aria-labelledby="tokens-heading" className="space-y-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
					<h2
						id="tokens-heading"
						className="font-display text-xl font-medium text-foreground"
					>
						01. HSL Color Tokenization
					</h2>
					<p className="font-mono text-xs text-muted-foreground">
						Active Mode: {isDark ? ".dark" : ":root"} · Border Radius: 0rem
					</p>
				</div>

				<div className="grid grid-cols-1 border-t border-l border-border sm:grid-cols-2 lg:grid-cols-4">
					{HSL_TOKENS.map((token) => (
						<div
							key={token.variable}
							className="flex flex-col justify-between border-r border-b border-border bg-card p-5"
						>
							<div className="space-y-4">
								<div
									className="h-16 w-full border border-border"
									style={{
										backgroundColor: isDark ? token.darkHex : token.lightHex,
									}}
								/>
								<div className="space-y-1">
									<p className="font-mono text-xs font-medium text-foreground">
										{token.variable}
									</p>
									<p className="text-xs text-muted-foreground">{token.role}</p>
								</div>
							</div>
							<div className="mt-5 space-y-1 border-t border-border pt-3 font-mono text-[11px] tabular-nums text-muted-foreground">
								<div className="flex justify-between">
									<span>:root</span>
									<span className="text-foreground">{token.lightHsl}</span>
								</div>
								<div className="flex justify-between">
									<span>.dark</span>
									<span className="text-foreground">{token.darkHsl}</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* 02. Production Configuration Files (globals.css & tailwind.config.ts) */}
			<section aria-labelledby="config-heading" className="space-y-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h2
						id="config-heading"
						className="font-display text-xl font-medium text-foreground"
					>
						02. Production Theme Configuration
					</h2>

					<div className="flex items-center gap-2">
						<div className="inline-flex border border-border">
							<button
								type="button"
								onClick={() => setActiveCodeTab("globals")}
								className={cn(
									"h-9 px-4 font-mono text-xs transition-colors",
									activeCodeTab === "globals"
										? "bg-primary text-primary-foreground"
										: "bg-background text-muted-foreground hover:text-foreground",
								)}
							>
								globals.css
							</button>
							<button
								type="button"
								onClick={() => setActiveCodeTab("tailwind")}
								className={cn(
									"h-9 border-l border-border px-4 font-mono text-xs transition-colors",
									activeCodeTab === "tailwind"
										? "bg-primary text-primary-foreground"
										: "bg-background text-muted-foreground hover:text-foreground",
								)}
							>
								tailwind.config.ts
							</button>
						</div>

						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								handleCopy(
									activeCodeTab,
									activeCodeTab === "globals"
										? GLOBALS_CSS_SNIPPET
										: TAILWIND_CONFIG_SNIPPET,
								)
							}
							className="h-9 gap-1.5 font-mono text-xs"
						>
							{copiedKey === activeCodeTab ? (
								<>
									<Check className="h-3.5 w-3.5" />
									<span>Copied</span>
								</>
							) : (
								<>
									<Copy className="h-3.5 w-3.5" />
									<span>Copy</span>
								</>
							)}
						</Button>
					</div>
				</div>

				<pre className="overflow-x-auto border border-border bg-secondary p-6 font-mono text-xs leading-relaxed text-foreground">
					<code>
						{activeCodeTab === "globals"
							? GLOBALS_CSS_SNIPPET
							: TAILWIND_CONFIG_SNIPPET}
					</code>
				</pre>
			</section>

			{/* 03. Component Breakdown & Motion Strategy */}
			<section aria-labelledby="components-heading" className="space-y-6">
				<h2
					id="components-heading"
					className="font-display text-xl font-medium text-foreground"
				>
					03. Radix / shadcn Component Mapping & Framer Motion Strategy
				</h2>

				<div className="overflow-x-auto border border-border">
					<table className="w-full border-collapse text-left text-xs">
						<thead>
							<tr className="border-b border-border bg-secondary text-muted-foreground">
								<th className="px-5 py-3.5 font-medium">UI Element</th>
								<th className="px-5 py-3.5 font-medium">
									shadcn / Radix Primitive
								</th>
								<th className="px-5 py-3.5 font-medium">
									Framer Motion Choreography
								</th>
								<th className="px-5 py-3.5 font-medium">Geometry</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border bg-card">
							{COMPONENT_MAPPINGS.map((row) => (
								<tr key={row.uiElement}>
									<td className="px-5 py-4 font-display font-medium text-foreground whitespace-nowrap">
										{row.uiElement}
									</td>
									<td className="px-5 py-4 font-mono text-foreground/85 whitespace-nowrap">
										{row.primitive}
									</td>
									<td className="px-5 py-4 text-muted-foreground leading-relaxed max-w-md">
										{row.motionStrategy}
									</td>
									<td className="px-5 py-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
										{row.geometry}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Interactive Motion Lab */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-2">
					{/* Lab A: Dropdown Slow Fade */}
					<div className="border border-border bg-card p-6 space-y-5">
						<div className="flex items-center justify-between gap-4">
							<div>
								<h3 className="font-display text-sm font-medium text-foreground">
									Navbar Mega-Menu Opacity Fade
								</h3>
								<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
									duration: 0.34s · ease: [{COS_EASE.join(", ")}] · y: -6px → 0
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setDemoDropdownOpen((prev) => !prev)}
							>
								{demoDropdownOpen ? "Close Preview" : "Trigger Dropdown"}
							</Button>
						</div>

						<div className="relative min-h-35 border border-border bg-secondary/50 p-4">
							<div className="border-b border-border pb-2 text-xs text-muted-foreground">
								NavigationMenuTrigger — Women
							</div>
							<AnimatePresence>
								{demoDropdownOpen && (
									<motion.div
										variants={dropdownFadeVariants}
										initial="hidden"
										animate="visible"
										exit="exit"
										className="mt-3 grid grid-cols-2 gap-4 border border-border bg-background p-4 text-xs"
									>
										<div className="space-y-1.5">
											<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
												Ready to Wear
											</p>
											<p className="text-foreground">Wool Overcoats</p>
											<p className="text-foreground">Ribbed Cashmere</p>
										</div>
										<div className="space-y-1.5">
											<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
												Tailoring
											</p>
											<p className="text-foreground">Pleated Trousers</p>
											<p className="text-foreground">Sculpted Poplin</p>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* Lab B: Product Image Scale & Brightness Shift */}
					<div className="border border-border bg-card p-6 space-y-5">
						<div className="flex items-center justify-between gap-4">
							<div>
								<h3 className="font-display text-sm font-medium text-foreground">
									Product Card Image Hover Physics
								</h3>
								<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
									scale: 1 → 1.035 · brightness: 1 → 0.96 · 650ms
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setDemoCardHovered((prev) => !prev)}
							>
								{demoCardHovered ? "Reset State" : "Simulate Hover"}
							</Button>
						</div>

						<motion.div
							onHoverStart={() => setDemoCardHovered(true)}
							onHoverEnd={() => setDemoCardHovered(false)}
							className="flex items-center gap-6 border border-border bg-secondary/50 p-4"
						>
							<div className="h-32 w-24 shrink-0 overflow-hidden bg-studio">
								<motion.img
									src={sampleProduct.image}
									alt={sampleProduct.imageAlt}
									referrerPolicy="no-referrer"
									animate={{
										scale: demoCardHovered ? 1.035 : 1,
										filter: demoCardHovered
											? "brightness(0.96)"
											: "brightness(1)",
									}}
									transition={COS_IMAGE_TRANSITION}
									className="h-full w-full object-cover object-top"
								/>
							</div>
							<div className="space-y-1.5 text-xs">
								<p className="font-display font-medium text-foreground">
									{sampleProduct.title}
								</p>
								<p className="text-muted-foreground">
									State:{" "}
									<span className="font-mono text-foreground">
										{demoCardHovered
											? "hover (scale 1.035)"
											: "rest (scale 1.000)"}
									</span>
								</p>
								<p className="text-muted-foreground leading-relaxed">
									Compositor-only GPU properties preserve 60fps frame stability
									without triggering layout reflow.
								</p>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* 04. Zero-Radius UI Primitives (Badge, Checkbox & Radio Group) */}
			<section aria-labelledby="primitives-heading" className="space-y-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
					<h2
						id="primitives-heading"
						className="font-display text-xl font-medium text-foreground"
					>
						04. Zero-Radius UI Primitives
					</h2>
					<p className="font-mono text-xs text-muted-foreground">
						Badge · Checkbox · RadioGroup
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Badge Showcase */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div>
							<h3 className="font-display text-sm font-medium text-foreground">
								Editorial Badges
							</h3>
							<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
								rounded-none · uppercase tracking
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2 pt-2">
							<Badge variant="editorial">New Arrival</Badge>
							<Badge variant="default">Exclusive</Badge>
							<Badge variant="outline">Virgin Wool</Badge>
							<Badge variant="secondary">Cashmere</Badge>
							<Badge variant="sale">30% Off</Badge>
							<Badge variant="muted">Archived</Badge>
						</div>
					</div>

					{/* Checkbox Showcase */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div>
							<h3 className="font-display text-sm font-medium text-foreground">
								Facet Filter Checkboxes
							</h3>
							<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
								Radix UI · sharp geometric tick
							</p>
						</div>
						<div className="space-y-3 pt-2">
							<div className="flex items-center gap-3">
								<Checkbox
									id="cb-outerwear"
									checked={demoCheckbox1}
									onCheckedChange={(c) => setDemoCheckbox1(Boolean(c))}
								/>
								<Label htmlFor="cb-outerwear" className="cursor-pointer">
									Outerwear & Coats{" "}
									<span className="font-mono text-muted-foreground">(24)</span>
								</Label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="cb-knitwear"
									checked={demoCheckbox2}
									onCheckedChange={(c) => setDemoCheckbox2(Boolean(c))}
								/>
								<Label htmlFor="cb-knitwear" className="cursor-pointer">
									Cashmere Knitwear{" "}
									<span className="font-mono text-muted-foreground">(18)</span>
								</Label>
							</div>
						</div>
					</div>

					{/* Radio Group Showcase */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div>
							<h3 className="font-display text-sm font-medium text-foreground">
								Sort Selection Radio Group
							</h3>
							<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
								Radix UI · square precision dot
							</p>
						</div>
						<RadioGroup
							value={demoSortValue}
							onValueChange={setDemoSortValue}
							className="pt-2"
						>
							<div className="flex items-center gap-3">
								<RadioGroupItem value="recommended" id="sort-recommended" />
								<Label htmlFor="sort-recommended" className="cursor-pointer">
									Recommended
								</Label>
							</div>
							<div className="flex items-center gap-3">
								<RadioGroupItem value="newest" id="sort-newest" />
								<Label htmlFor="sort-newest" className="cursor-pointer">
									Newest First
								</Label>
							</div>
							<div className="flex items-center gap-3">
								<RadioGroupItem value="price-asc" id="sort-price-asc" />
								<Label htmlFor="sort-price-asc" className="cursor-pointer">
									Price: Low to High
								</Label>
							</div>
						</RadioGroup>
					</div>
				</div>
			</section>

			{/* 05. PLP & Filter Controls (CategoryPillsNav, GridDensitySwitch & FilterDrawer) */}
			<section aria-labelledby="plp-controls-heading" className="space-y-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
					<h2
						id="plp-controls-heading"
						className="font-display text-xl font-medium text-foreground"
					>
						05. PLP & Filter Controls
					</h2>
					<p className="font-mono text-xs text-muted-foreground">
						CategoryPillsNav · GridDensitySwitch · FilterDrawer
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{/* Category Quick Navigation Pills */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div>
							<h3 className="font-display text-sm font-medium text-foreground">
								Category Quick-Pills Navigation
							</h3>
							<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
								Horizontal scroll · zero-radius chips · layoutId active glide
							</p>
						</div>
						<div className="pt-2">
							<CategoryPillsNav
								categories={[
									{ id: "All", label: "All Menswear", count: 24 },
									{ id: "Outerwear", label: "Coats & Jackets", count: 8 },
									{ id: "Knitwear", label: "Knitwear", count: 6 },
									{ id: "Trousers", label: "Trousers", count: 5 },
									{ id: "Accessories", label: "Accessories", count: 5 },
								]}
								activeCategory={demoCategory}
								onSelectCategory={setDemoCategory}
								layoutIdPrefix="demo-pills"
							/>
						</div>
						<p className="font-mono text-xs text-muted-foreground">
							Active Selection:{" "}
							<span className="text-foreground">{demoCategory}</span>
						</p>
					</div>

					{/* 4-Tier Grid Density Switcher */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-display text-sm font-medium text-foreground">
									4-Tier Grid Density Switcher
								</h3>
								<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
									2-col · 3-col · 4-col · minimal lookbook
								</p>
							</div>
							<GridDensitySwitch
								density={demoDensity}
								onChangeDensity={setDemoDensity}
							/>
						</div>
						<div className="border border-border bg-secondary/30 p-4 text-xs font-mono space-y-1">
							<p className="text-foreground">
								Current Mode:{" "}
								<span className="font-bold uppercase">{demoDensity}</span>
							</p>
							<p className="text-muted-foreground">
								{demoDensity === "2" &&
									"Large editorial layout with oversized frames"}
								{demoDensity === "3" &&
									"Balanced 3-column desktop catalog baseline"}
								{demoDensity === "4" && "High-density 4-column overview grid"}
								{demoDensity === "minimal" &&
									"Pure visual lookbook mode — typography hidden, edge-to-edge imagery"}
							</p>
						</div>
					</div>
				</div>

				{/* Filter & Sort Drawer Preview Card */}
				<div className="border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="space-y-1">
						<h3 className="font-display text-sm font-medium text-foreground">
							Slide-Over Filter & Sort Drawer
						</h3>
						<p className="text-xs text-muted-foreground">
							Radix Sheet drawer with Sort RadioGroup, multi-facet Accordions
							(Category, Material, Size, Colour, Price), and sticky live action
							buttons.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setDemoDrawerOpen(true)}
						className="gap-2.5 font-mono uppercase tracking-wider text-xs shrink-0 rounded-none h-10 px-4"
					>
						<SlidersHorizontal className="h-3.5 w-3.5 stroke-[1.5]" />
						<span>Open Filter Drawer</span>
					</Button>
				</div>
			</section>

			{/* 06. Product Card Slider, In-Grid Editorial & Hybrid Pagination */}
			<section aria-labelledby="fase3-heading" className="space-y-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
					<h2
						id="fase3-heading"
						className="font-display text-xl font-medium text-foreground"
					>
						06. Product Card Slider, In-Grid Editorial & Hybrid Pagination
					</h2>
					<p className="font-mono text-xs text-muted-foreground">
						In-Card Slider · 20px Swatches · InGridEditorialCard ·
						LoadMorePagination
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Live Product Card with Carousel and Swatches */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div>
							<h3 className="font-display text-sm font-medium text-foreground">
								ProductCard with In-Card Slider & Swatches
							</h3>
							<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
								Top 2px segment dashes · Left/Right hover arrows · Click-to-swap
								20px swatches
							</p>
						</div>
						<div className="max-w-70 mx-auto pt-2">
							<ProductCard
								product={sampleProduct}
								isSaved={demoSavedIds.includes(sampleProduct.id)}
								onToggleSave={(id) =>
									setDemoSavedIds((prev) =>
										prev.includes(id)
											? prev.filter((i) => i !== id)
											: [...prev, id],
									)
								}
								onQuickAdd={() => {}}
								onOpenDetail={() => {}}
							/>
						</div>
					</div>

					{/* In-Grid Editorial Card */}
					<div className="border border-border bg-card p-6 space-y-4 lg:col-span-2">
						<div>
							<h3 className="font-display text-sm font-medium text-foreground">
								InGridEditorialCard (Curated Storytelling)
							</h3>
							<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
								4:5 & 3:4 portrait ratios · Swiss typography · Zero-radius frame
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
							<InGridEditorialCard
								title="Sculpted Tailoring"
								eyebrow="Atelier S/S 2026"
								subtitle="Virgin boiled wool overcoats cut in architectural column lines."
								image="/src/assets/images/hero_cos_campaign_1795436599958.jpg"
								ctaLabel="Explore Capsule"
								onCtaClick={() => {}}
								spanCols={1}
							/>
							<InGridEditorialCard
								title="Cashmere Craft"
								eyebrow="Materiality"
								subtitle="Two-ply 5-gauge fisherman rib knits sourced under Good Cashmere Standard."
								image="/src/assets/images/editorial_atelier_tailoring_1795436601242.jpg"
								ctaLabel="View Knits"
								onCtaClick={() => {}}
								spanCols={1}
							/>
						</div>
					</div>
				</div>

				{/* COS-Style Hybrid Pagination Component Showcase */}
				<div className="border border-border bg-card p-6 space-y-4">
					<div className="max-w-xl">
						<h3 className="font-display text-sm font-medium text-foreground">
							COS Hybrid Pagination Architecture
						</h3>
						<p className="mt-0.5 text-xs text-muted-foreground">
							High-contrast 52px "LOAD NEXT PAGE" primary action paired with a
							40px × 40px numbered navigation bar with a solid 2px active
							underline.
						</p>
					</div>

					<div className="border border-border bg-secondary/20 p-6 rounded-none">
						<LoadMorePagination
							currentPage={demoPaginationPage}
							totalPages={4}
							currentCount={demoPaginationPage * 6}
							totalCount={24}
							onPageChange={(page) => setDemoPaginationPage(page)}
							onLoadNextPage={() => {
								setDemoPaginationLoading(true);
								window.setTimeout(() => {
									setDemoPaginationPage((p) => Math.min(4, p + 1));
									setDemoPaginationLoading(false);
								}, 400);
							}}
							isLoading={demoPaginationLoading}
						/>
					</div>
				</div>
			</section>

			{/* 07. Discovery & Conversion Modules (COS Specification) */}
			<section
				aria-labelledby="discovery-conversion-heading"
				className="space-y-6"
			>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-border pb-4">
					<div>
						<p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
							07. Discovery & Conversion Modules
						</p>
						<h2
							id="discovery-conversion-heading"
							className="font-display text-2xl font-medium tracking-tight text-foreground"
						>
							Fullscreen Search, Country/Currency Switcher & Newsletter
						</h2>
					</div>
					<p className="max-w-md text-xs text-muted-foreground sm:text-right">
						Reverse-engineered from COS: z-60 fullscreen search, z-72 regional
						country drawer with 2-step switch confirmation dialog, and deep
						black hairline newsletter capture.
					</p>
				</div>

				{/* Interactive Module Launchers Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Search Modal Launcher Card */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h3 className="font-display text-sm font-medium text-foreground">
									Fullscreen Search Modal
								</h3>
								<p className="mt-1 font-mono text-[11px] text-muted-foreground">
									z-60 fixed overlay · 52px sticky bar · Query autocomplete ·
									Live previews
								</p>
							</div>
							<span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 border border-border text-muted-foreground">
								MODAL
							</span>
						</div>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Features single-line "Type here to search" input with prominent
							all-caps "CLOSE" button, instant trending searches pills, and
							matching product suggestions.
						</p>
						<div className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setDemoSearchOpen(true)}
								className="h-10 w-full sm:w-auto gap-2 text-xs"
							>
								<Search className="h-3.5 w-3.5 stroke-[1.5]" />
								<span>Open Search Overlay</span>
							</Button>
						</div>
					</div>

					{/* Country & Currency Switcher Launcher Card */}
					<div className="border border-border bg-card p-6 space-y-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h3 className="font-display text-sm font-medium text-foreground">
									Country & Currency Selector Drawer
								</h3>
								<p className="mt-1 font-mono text-[11px] text-muted-foreground">
									z-72 slide-out drawer · Regional accordions · 2-step switch
									warning dialog
								</p>
							</div>
							<span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 border border-border text-muted-foreground">
								DRAWER
							</span>
						</div>
						<div className="flex items-center gap-2 border border-border bg-secondary/30 px-3 py-2 text-xs font-mono">
							<span className="text-muted-foreground">Current Active:</span>
							<span className="font-semibold text-foreground">
								{demoCountry.name} ({demoCountry.code}) — {demoCountry.currency}{" "}
								({demoCountry.currencySymbol})
							</span>
							<span className="ml-auto text-muted-foreground">
								Sample price: {formatLocalizedPrice(290, demoCountry)}
							</span>
						</div>
						<div className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setDemoCountryOpen(true)}
								className="h-10 w-full sm:w-auto gap-2 text-xs"
							>
								<Globe className="h-3.5 w-3.5 stroke-[1.5]" />
								<span>Change Country & Currency</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Newsletter Section Architecture Showcase */}
				<div className="border border-border bg-card p-6 space-y-4">
					<div>
						<h3 className="font-display text-sm font-medium text-foreground">
							The Architectural Newsletter Section
						</h3>
						<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
							Deep `#080808` background · Hairline border-b input · Zero-radius
							check boxes · Instant voucher reward
						</p>
					</div>

					{/* Embedded Component */}
					<div className="overflow-hidden border border-border">
						<NewsletterSection className="border-0" />
					</div>
				</div>
			</section>

			{/* Mounted Demo Filter Drawer */}
			<FilterDrawer
				open={demoDrawerOpen}
				onOpenChange={setDemoDrawerOpen}
				sortBy={demoDrawerSort}
				onSortByChange={setDemoDrawerSort}
				facets={demoDrawerFacets}
				onFacetsChange={setDemoDrawerFacets}
				onResetAll={() => setDemoDrawerFacets({})}
				totalMatchingCount={CATALOG_PRODUCTS.length}
				allProducts={CATALOG_PRODUCTS}
			/>

			{/* Mounted Demo Search Modal */}
			<SearchModal
				open={demoSearchOpen}
				onOpenChange={setDemoSearchOpen}
				onSelectCategory={() => {
					setDemoSearchOpen(false);
				}}
				onSelectProduct={() => {
					setDemoSearchOpen(false);
				}}
			/>

			{/* Mounted Demo Country & Currency Drawer */}
			<CountryCurrencyModal
				open={demoCountryOpen}
				onOpenChange={setDemoCountryOpen}
				activeCountry={demoCountry}
				onSelectCountry={(country) => {
					setDemoCountry(country);
				}}
			/>
		</div>
	);
};
