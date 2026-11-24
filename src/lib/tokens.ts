export interface DesignTokenEntry {
	variable: string;
	role: string;
	lightHsl: string;
	darkHsl: string;
	lightHex: string;
	darkHex: string;
}

export const DESIGN_SYSTEM_RADIUS = "0rem";

export const HSL_TOKENS: DesignTokenEntry[] = [
	{
		variable: "--background",
		role: "Primary Page Canvas",
		lightHsl: "0 0% 100%",
		darkHsl: "0 0% 5%",
		lightHex: "#FFFFFF",
		darkHex: "#0D0D0D",
	},
	{
		variable: "--foreground",
		role: "Primary Editorial Ink",
		lightHsl: "0 0% 7%",
		darkHsl: "0 0% 97%",
		lightHex: "#121212",
		darkHex: "#F7F7F7",
	},
	{
		variable: "--primary",
		role: "Primary CTA & Active State",
		lightHsl: "0 0% 7%",
		darkHsl: "0 0% 98%",
		lightHex: "#121212",
		darkHex: "#FAFAFA",
	},
	{
		variable: "--secondary",
		role: "Subtle Structural Surface",
		lightHsl: "0 0% 96%",
		darkHsl: "0 0% 11%",
		lightHex: "#F5F5F5",
		darkHex: "#1C1C1C",
	},
	{
		variable: "--studio-surface",
		role: "Product Image Studio Frame",
		lightHsl: "0 0% 95%",
		darkHsl: "0 0% 10%",
		lightHex: "#F2F2F2",
		darkHex: "#1A1A1A",
	},
	{
		variable: "--muted-foreground",
		role: "Metadata & Secondary Copy",
		lightHsl: "0 0% 42%",
		darkHsl: "0 0% 62%",
		lightHex: "#6B6B6B",
		darkHex: "#9E9E9E",
	},
	{
		variable: "--border",
		role: "1px Architectural Hairline",
		lightHsl: "0 0% 89%",
		darkHsl: "0 0% 18%",
		lightHex: "#E3E3E3",
		darkHex: "#2E2E2E",
	},
	{
		variable: "--ring",
		role: "Accessible Keyboard Focus Ring",
		lightHsl: "0 0% 7%",
		darkHsl: "0 0% 92%",
		lightHex: "#121212",
		darkHex: "#EBEBEB",
	},
];

export interface ComponentMappingItem {
	uiElement: string;
	primitive: string;
	motionStrategy: string;
	geometry: string;
}

export const COMPONENT_MAPPINGS: ComponentMappingItem[] = [
	{
		uiElement: "Navbar Header & Mega-Menu",
		primitive: "Radix NavigationMenu + AnimatePresence",
		motionStrategy:
			"Slow editorial opacity fade (340ms, cubic-bezier [0.22, 1, 0.36, 1]) with -6px vertical settle.",
		geometry: "0px radius · 64px sticky height · 1px bottom hairline",
	},
	{
		uiElement: "Minimalist Product Card",
		primitive: "shadcn Card + Framer Motion container",
		motionStrategy:
			"Gentle image scale(1.035) + brightness(0.96) over 650ms; hover-triggered 8px quick-add size bar slide.",
		geometry: "0px radius · 3:4 portrait frame · baseline-aligned price",
	},
	{
		uiElement: "Category Filter Tabs",
		primitive: "Accessible Button Tabs + layoutId",
		motionStrategy:
			'Shared layoutId="active-category-line" spring glide (stiffness 280, damping 34) with zero bounce.',
		geometry: "0px radius · 1px active underline · single-line labels",
	},
	{
		uiElement: "Product Quick View Modal",
		primitive: "Radix Dialog + Radix Accordion",
		motionStrategy:
			"Backdrop opacity fade (280ms) paired with 0.985 -> 1.0 subtle scale entry.",
		geometry: "0px radius · 2-column split · contiguous purchase panel",
	},
	{
		uiElement: "Shopping Bag Drawer",
		primitive: "Radix Dialog (Sheet) + AnimatePresence",
		motionStrategy:
			"Damped horizontal spring slide (stiffness 300, damping 36) with crisp list exit transitions.",
		geometry: "0px radius · 1px left hairline · tabular numerals",
	},
];

export const GLOBALS_CSS_SNIPPET = `:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 7%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 7%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 7%;
  --primary: 0 0% 7%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 7%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 42%;
  --accent: 0 0% 94%;
  --accent-foreground: 0 0% 7%;
  --studio-surface: 0 0% 95%;
  --border: 0 0% 89%;
  --input: 0 0% 84%;
  --ring: 0 0% 7%;
  --radius: 0rem;
}

.dark {
  --background: 0 0% 5%;
  --foreground: 0 0% 97%;
  --card: 0 0% 7%;
  --card-foreground: 0 0% 97%;
  --popover: 0 0% 7%;
  --popover-foreground: 0 0% 97%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 5%;
  --secondary: 0 0% 11%;
  --secondary-foreground: 0 0% 97%;
  --muted: 0 0% 12%;
  --muted-foreground: 0 0% 62%;
  --accent: 0 0% 14%;
  --accent-foreground: 0 0% 98%;
  --studio-surface: 0 0% 10%;
  --border: 0 0% 18%;
  --input: 0 0% 24%;
  --ring: 0 0% 92%;
  --radius: 0rem;
}`;

export const TAILWIND_CONFIG_SNIPPET = `@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
@plugin "@tailwindcss/typography";
@import "./globals.css";

@theme {
  --font-display: "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif;
  --font-sans: "DM Sans", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;

  --ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);

  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-border: hsl(var(--border));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --radius: 0rem;
}

@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
  max-width: 1440px;
}`;
