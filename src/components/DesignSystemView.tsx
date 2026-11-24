import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Moon, Sun } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CATALOG_PRODUCTS } from "@/data/catalog";
import {
	COS_EASE,
	COS_IMAGE_TRANSITION,
	dropdownFadeVariants,
} from "@/lib/motion";
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
		<div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12 lg:py-16 space-y-16">
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
						className="font-display text-3xl font-medium tracking-[-0.025em] text-foreground sm:text-4xl"
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

						<div className="relative min-h-[140px] border border-border bg-secondary/50 p-4">
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
		</div>
	);
};
