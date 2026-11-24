export type ProductCategory =
	| "All"
	| "Women"
	| "Men"
	| "Outerwear"
	| "Knitwear"
	| "Accessories";

export interface ColorVariant {
	id: string;
	name: string;
	hex: string;
}

export interface Product {
	id: string;
	sku: string;
	title: string;
	subtitle: string;
	price: number;
	category: Exclude<ProductCategory, "All">;
	tags: ProductCategory[];
	editorialLabel?: string;
	image: string;
	imageAlt: string;
	colors: ColorVariant[];
	sizes: string[];
	composition: string;
	fitNotes: string;
	care: string;
	featuredRank: number;
}

export interface MegaMenuColumn {
	heading: string;
	links: { label: string; category: ProductCategory }[];
}

export interface NavCategoryConfig {
	id: string;
	label: string;
	category: ProductCategory;
	columns: MegaMenuColumn[];
	editorialImage: string;
	editorialTitle: string;
	editorialCaption: string;
}

export const HERO_MEDIA = {
	image: "/src/assets/images/hero_cos_campaign_1795436599958.jpg",
	alt: "Two models in oversized black boiled-wool tailored coats standing in a serene concrete gallery",
};

export const ATELIER_MEDIA = {
	image: "/src/assets/images/editorial_atelier_tailoring_1795436601242.jpg",
	alt: "Folded black boiled wool, crisp white cotton poplin, and natural horn buttons on a pale concrete worktable",
};

export const CATALOG_PRODUCTS: Product[] = [
	{
		id: "double-breasted-wool-overcoat",
		sku: "NOC-AW26-011",
		title: "Double-Breasted Wool Overcoat",
		subtitle: "100% RWS Virgin Wool",
		price: 350,
		category: "Outerwear",
		tags: ["Women", "Outerwear"],
		editorialLabel: "New Arrival",
		image: "/src/assets/images/product_wool_coat_1795436579762.jpg",
		imageAlt:
			"Structured double-breasted matte black virgin wool overcoat on studio gray backdrop",
		colors: [
			{ id: "obsidian", name: "Black", hex: "#121212" },
			{ id: "charcoal", name: "Dark Charcoal", hex: "#383838" },
			{ id: "stone", name: "Warm Stone", hex: "#C7C3BC" },
		],
		sizes: ["XS", "S", "M", "L"],
		composition:
			"Shell: 100% RWS Wool. Lining: 100% Viscose. Matte corozo nut buttons.",
		fitNotes:
			"Relaxed architectural shoulder with structured notch lapels and calf-length straight hem.",
		care: "Dry clean only. Steam lightly between wears to preserve the boiled wool structure.",
		featuredRank: 1,
	},
	{
		id: "heavy-ribbed-cashmere-crewneck",
		sku: "NOC-AW26-024",
		title: "Heavy Ribbed Cashmere Knit",
		subtitle: "100% GCS Cashmere",
		price: 290,
		category: "Knitwear",
		tags: ["Women", "Knitwear"],
		editorialLabel: "Atelier Edit",
		image: "/src/assets/images/product_cashmere_knit_1795436600585.jpg",
		imageAlt:
			"Relaxed pale stone-gray heavy ribbed cashmere crewneck sweater styled with black trousers",
		colors: [
			{ id: "chalk-stone", name: "Pale Stone", hex: "#D4D2CC" },
			{ id: "black", name: "Black", hex: "#141414" },
			{ id: "ash", name: "Ash Melange", hex: "#8A8A88" },
		],
		sizes: ["XS", "S", "M", "L"],
		composition: "100% Good Cashmere Standard (GCS) 5-gauge two-ply yarn.",
		fitNotes:
			"Dropped shoulder silhouette with lofty vertical fisherman rib and reinforced mock-rib neckline.",
		care: "Hand wash cold with wool detergent. Reshape and dry flat away from direct heat.",
		featuredRank: 2,
	},
	{
		id: "architectural-poplin-shirt",
		sku: "NOC-AW26-037",
		title: "Sculpted Organic Poplin Shirt",
		subtitle: "100% Organic Cotton",
		price: 115,
		category: "Women",
		tags: ["Women"],
		image: "/src/assets/images/product_poplin_shirt_1795436579408.jpg",
		imageAlt:
			"Oversized crisp pure white organic cotton poplin shirt with wide sculptural cuffs",
		colors: [
			{ id: "optic-white", name: "Optic White", hex: "#FAFAFA" },
			{ id: "ink", name: "Black", hex: "#111111" },
		],
		sizes: ["XS", "S", "M", "L"],
		composition:
			"100% tightly woven long-staple Organic Cotton Poplin (145 gsm).",
		fitNotes:
			"Generous volume through the body with pointed stand collar, concealed placket, and extended barrel cuffs.",
		care: "Machine wash warm at 40°C. Line dry and press while slightly damp for crisp structure.",
		featuredRank: 3,
	},
	{
		id: "wide-leg-pleated-wool-trousers",
		sku: "NOC-AW26-049",
		title: "Wide-Leg Pleated Wool Trousers",
		subtitle: "100% Tailored Wool",
		price: 175,
		category: "Men",
		tags: ["Women", "Men"],
		image: "/src/assets/images/product_tailored_trousers_1795436581972.jpg",
		imageAlt:
			"Wide-leg deep pleated charcoal wool tailored trousers paired with black merino mock-neck",
		colors: [
			{ id: "graphite", name: "Charcoal Melange", hex: "#3D3F42" },
			{ id: "black", name: "Black", hex: "#141414" },
		],
		sizes: ["XS", "S", "M", "L", "XL"],
		composition:
			"100% RWS Virgin Wool twill with breathable half-leg cupro lining.",
		fitNotes:
			"High-rise waist with double forward pleats, crisp pressed front crease, and full-length wide column leg.",
		care: "Dry clean recommended. Hang vertically by cuff clamps to maintain crease.",
		featuredRank: 4,
	},
	{
		id: "folded-calfskin-atelier-tote",
		sku: "NOC-AW26-062",
		title: "Folded Leather Atelier Tote",
		subtitle: "100% Smooth Calfskin",
		price: 320,
		category: "Accessories",
		tags: ["Accessories", "Women", "Men"],
		editorialLabel: "Limited Run",
		image: "/src/assets/images/product_leather_tote_1795436590397.jpg",
		imageAlt:
			"Sculptural matte black folded smooth calfskin architectural tote bag on travertine stone plinth",
		colors: [
			{ id: "matte-black", name: "Matte Black", hex: "#121212" },
			{ id: "espresso", name: "Deep Slate", hex: "#2D2E30" },
		],
		sizes: ["One Size"],
		composition:
			"100% LWG-certified vegetable-tanned smooth calfskin leather. Unlined suede interior.",
		fitNotes:
			"Origami-inspired diagonal seam construction. Holds a 16-inch laptop with magnetic top bridge closure.",
		care: "Wipe with a soft dry cloth. Store stuffed in its unbleached cotton dust bag.",
		featuredRank: 5,
	},
	{
		id: "concealed-placket-gabardine-trench",
		sku: "NOC-AW26-075",
		title: "Concealed-Placket Trench Coat",
		subtitle: "Water-Repellent Cotton Gabardine",
		price: 310,
		category: "Outerwear",
		tags: ["Men", "Outerwear"],
		editorialLabel: "New Arrival",
		image: "/src/assets/images/product_trench_coat_1795436600948.jpg",
		imageAlt:
			"Longline dark slate-charcoal cotton gabardine trench coat with clean concealed placket",
		colors: [
			{ id: "slate", name: "Dark Slate", hex: "#393E41" },
			{ id: "black", name: "Black", hex: "#121212" },
			{ id: "putty", name: "Putty Gray", hex: "#B9B7B1" },
		],
		sizes: ["S", "M", "L", "XL"],
		composition:
			"68% Organic Cotton, 32% Recycled Polyamide dense storm-repellent gabardine.",
		fitNotes:
			"Clean A-line drape, hidden horn button placket, welted welt pockets, and adjustable cuff tabs.",
		care: "Spot clean or gentle dry clean. Re-proof water-repellent finish seasonally.",
		featuredRank: 6,
	},
];

export const MEGA_MENU_CONFIG: NavCategoryConfig[] = [
	{
		id: "new-in",
		label: "New In",
		category: "All",
		columns: [
			{
				heading: "Highlights",
				links: [
					{ label: "View All New Arrivals", category: "All" },
					{ label: "Architectural Outerwear", category: "Outerwear" },
					{ label: "Cashmere & Fine Knits", category: "Knitwear" },
					{ label: "Leather Goods", category: "Accessories" },
				],
			},
			{
				heading: "Curated Edits",
				links: [
					{ label: "Monochrome Tailoring", category: "Women" },
					{ label: "Menswear Form", category: "Men" },
					{ label: "The Atelier Capsule", category: "All" },
				],
			},
		],
		editorialImage: "/src/assets/images/product_wool_coat_1795436579762.jpg",
		editorialTitle: "Autumn / Winter Form",
		editorialCaption:
			"Tailored silhouettes engineered in boiled wool and dense gabardine.",
	},
	{
		id: "women",
		label: "Women",
		category: "Women",
		columns: [
			{
				heading: "Ready to Wear",
				links: [
					{ label: "All Womenswear", category: "Women" },
					{ label: "Coats & Jackets", category: "Outerwear" },
					{ label: "Knitwear & Cashmere", category: "Knitwear" },
					{ label: "Shirts & Tailoring", category: "Women" },
				],
			},
			{
				heading: "Finishing Pieces",
				links: [
					{ label: "Leather Bags", category: "Accessories" },
					{ label: "Minimalist Essentials", category: "All" },
				],
			},
		],
		editorialImage: "/src/assets/images/product_poplin_shirt_1795436579408.jpg",
		editorialTitle: "Crisp Organic Poplin",
		editorialCaption:
			"Sculptural volume and extended cuffs in pure white cotton.",
	},
	{
		id: "men",
		label: "Men",
		category: "Men",
		columns: [
			{
				heading: "Ready to Wear",
				links: [
					{ label: "All Menswear", category: "Men" },
					{ label: "Trench & Overcoats", category: "Outerwear" },
					{ label: "Pleated Trousers", category: "Men" },
				],
			},
			{
				heading: "Objects & Bags",
				links: [
					{ label: "Architectural Totes", category: "Accessories" },
					{ label: "Complete Collection", category: "All" },
				],
			},
		],
		editorialImage: "/src/assets/images/product_trench_coat_1795436600948.jpg",
		editorialTitle: "Modern Menswear",
		editorialCaption:
			"Concealed plackets, deep pleats, and storm-repellent cotton gabardine.",
	},
	{
		id: "accessories",
		label: "Accessories",
		category: "Accessories",
		columns: [
			{
				heading: "Leather & Objects",
				links: [
					{ label: "All Accessories", category: "Accessories" },
					{ label: "Atelier Leather Totes", category: "Accessories" },
					{ label: "View Full Archive", category: "All" },
				],
			},
		],
		editorialImage: "/src/assets/images/product_leather_tote_1795436590397.jpg",
		editorialTitle: "Folded Calfskin",
		editorialCaption:
			"Geometric diagonal seams in vegetable-tanned matte black leather.",
	},
];
