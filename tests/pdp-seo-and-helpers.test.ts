import assert from "node:assert/strict";
import test from "node:test";
import { filterMediaByColor } from "@/components/catalog/product-gallery";
import { convertMeasurementValue } from "@/components/catalog/size-guide-modal";
import {
	resolveInitialPdpSelection,
	validatePdpSearch,
} from "@/lib/params/pdp-search";
import {
	buildProductBreadcrumbJsonLd,
	buildProductGroupJsonLd,
	buildProductHeadMetadata,
	type ProductSeoInput,
} from "@/lib/seo/product-seo";

const sampleProduct: ProductSeoInput = {
	slug: "architectural-wool-overcoat",
	parentSku: "NOC-OW-001",
	name: "Architectural Wool Overcoat",
	brand: "NOCTURA",
	description:
		"Tailored double-faced virgin wool overcoat featuring dropped shoulders, concealed horn buttons, and an unlined architectural drape built for layering.",
	genderAudience: "women",
	materialComposition: "80% Virgin Wool, 20% Recycled Polyamide",
	category: {
		name: "Outerwear",
		slug: "outerwear",
	},
	colors: [
		{
			colorName: "Obsidian Black",
			primaryImageUrl:
				"https://ik.imagekit.io/noctura/products/outerwear/coat-black-1.jpg",
		},
		{
			colorName: "Warm Taupe",
			primaryImageUrl:
				"https://ik.imagekit.io/noctura/products/outerwear/coat-taupe-1.jpg",
		},
	],
	media: [
		{
			url: "https://ik.imagekit.io/noctura/products/outerwear/coat-black-1.jpg",
			altText: "Obsidian Black overcoat front view",
			colorName: "Obsidian Black",
			mediaType: "image",
			isPrimary: true,
		},
		{
			url: "https://ik.imagekit.io/noctura/products/outerwear/coat-taupe-1.jpg",
			altText: "Warm Taupe overcoat front view",
			colorName: "Warm Taupe",
			mediaType: "image",
			isPrimary: false,
		},
	],
	variants: [
		{
			sku: "NOC-OW-001-BLK-S",
			colorName: "Obsidian Black",
			sizeLabel: "S",
			priceIdr: 2_890_000,
			stockQuantity: 5,
			reservedQuantity: 1,
		},
		{
			sku: "NOC-OW-001-BLK-M",
			colorName: "Obsidian Black",
			sizeLabel: "M",
			priceIdr: 2_890_000,
			stockQuantity: 2,
			reservedQuantity: 2,
		},
		{
			sku: "NOC-OW-001-TPE-S",
			colorName: "Warm Taupe",
			sizeLabel: "S",
			priceIdr: 2_990_000,
			stockQuantity: 4,
			reservedQuantity: 0,
		},
	],
};

test("buildProductGroupJsonLd emits valid Schema.org ProductGroup with IDR variants and stock availability", () => {
	const schema = buildProductGroupJsonLd(sampleProduct, "https://noctura.id/");

	assert.equal(schema["@context"], "https://schema.org");
	assert.equal(schema["@type"], "ProductGroup");
	assert.equal(schema.name, "Architectural Wool Overcoat");
	assert.equal(schema.productGroupID, "NOC-OW-001");
	assert.equal(
		schema.url,
		"https://noctura.id/products/architectural-wool-overcoat",
	);
	assert.deepEqual(schema.variesBy, [
		"https://schema.org/color",
		"https://schema.org/size",
	]);
	assert.equal(schema.hasVariant.length, 3);

	const [first, second, third] = schema.hasVariant;
	assert.equal(first["@type"], "Product");
	assert.equal(first.sku, "NOC-OW-001-BLK-S");
	assert.equal(first.offers.price, 2_890_000);
	assert.equal(first.offers.priceCurrency, "IDR");
	assert.equal(first.offers.availability, "https://schema.org/InStock");
	assert.equal(
		first.url,
		"https://noctura.id/products/architectural-wool-overcoat?color=Obsidian%20Black&size=S",
	);

	// stockQuantity (2) - reservedQuantity (2) === 0 -> OutOfStock
	assert.equal(second.offers.availability, "https://schema.org/OutOfStock");
	assert.equal(third.offers.price, 2_990_000);
	assert.equal(third.offers.availability, "https://schema.org/InStock");
});

test("buildProductHeadMetadata sets clean canonical URL, Open Graph images, and JSON-LD script", () => {
	const head = buildProductHeadMetadata(sampleProduct, "https://noctura.id");
	assert.deepEqual(head.links, [
		{
			rel: "canonical",
			href: "https://noctura.id/products/architectural-wool-overcoat",
		},
	]);

	const metaMap = new Map(
		head.meta.map((entry) => [
			entry.property ?? entry.name ?? "title",
			entry.content ?? entry.title,
		]),
	);

	assert.equal(metaMap.get("title"), "Architectural Wool Overcoat | NOCTURA");
	assert.ok((metaMap.get("description") ?? "").length <= 160);
	assert.equal(metaMap.get("og:type"), "product");
	assert.ok(metaMap.get("og:image")?.includes("tr=w-1200,ar-3-4"));
	assert.equal(metaMap.get("twitter:card"), "summary_large_image");
	assert.equal(metaMap.get("twitter:image"), metaMap.get("og:image"));

	assert.ok(head.scripts && head.scripts.length === 1);
	const parsedScripts = JSON.parse(head.scripts[0].children) as Array<{
		"@type": string;
	}>;
	assert.deepEqual(
		parsedScripts.map((entry) => entry["@type"]),
		["ProductGroup", "BreadcrumbList"],
	);

	const breadcrumb = buildProductBreadcrumbJsonLd(
		sampleProduct,
		"https://noctura.id",
	);
	assert.equal(breadcrumb.itemListElement.length, 4);
	assert.equal(
		breadcrumb.itemListElement[3].name,
		"Architectural Wool Overcoat",
	);

	const notFoundHead = buildProductHeadMetadata(null, "https://noctura.id");
	assert.equal(
		notFoundHead.meta.find((m) => m.name === "robots")?.content,
		"noindex, nofollow",
	);
});

test("validatePdpSearch and resolveInitialPdpSelection handle URL queries and stock fallbacks", () => {
	const search = validatePdpSearch({
		color: "warm taupe",
		size: "s",
		extra: "ignored",
	});
	assert.deepEqual(search, { color: "warm taupe", size: "s" });

	const selection = resolveInitialPdpSelection(
		{
			colors: [
				{
					colorName: "Obsidian Black",
					colorHex: "#111111",
					inStock: true,
					primaryImageUrl: null,
					hoverImageUrl: null,
				},
				{
					colorName: "Warm Taupe",
					colorHex: "#8c7d70",
					inStock: true,
					primaryImageUrl: null,
					hoverImageUrl: null,
				},
			],
			variants: [
				{
					id: "v1",
					productId: "p1",
					sku: "SKU-BLK-S",
					colorName: "Obsidian Black",
					colorHex: "#111111",
					sizeLabel: "S",
					sizeSortOrder: 1,
					priceIdr: 1000,
					compareAtPriceIdr: null,
					stockQuantity: 3,
					reservedQuantity: 0,
					weightGrams: 500,
					lengthCm: 30,
					widthCm: 20,
					heightCm: 5,
					isActive: true,
					availableQuantity: 3,
					createdAt: "",
					updatedAt: "",
				},
				{
					id: "v2",
					productId: "p1",
					sku: "SKU-TPE-S",
					colorName: "Warm Taupe",
					colorHex: "#8c7d70",
					sizeLabel: "S",
					sizeSortOrder: 1,
					priceIdr: 1000,
					compareAtPriceIdr: null,
					stockQuantity: 2,
					reservedQuantity: 0,
					weightGrams: 500,
					lengthCm: 30,
					widthCm: 20,
					heightCm: 5,
					isActive: true,
					availableQuantity: 2,
					createdAt: "",
					updatedAt: "",
				},
			],
		},
		search,
	);

	assert.equal(selection.colorName, "Warm Taupe");
	assert.equal(selection.sizeLabel, "S");
});

test("filterMediaByColor filters matching color media and falls back cleanly", () => {
	const media = [
		{
			id: "m1",
			productId: "p1",
			colorName: "Obsidian Black",
			url: "https://ik.imagekit.io/noctura/products/black-1.jpg",
			altText: "Black 1",
			mediaType: "image" as const,
			isPrimary: true,
			sortOrder: 0,
			createdAt: "",
		},
		{
			id: "m2",
			productId: "p1",
			colorName: "Warm Taupe",
			url: "https://ik.imagekit.io/noctura/products/taupe-1.jpg",
			altText: "Taupe 1",
			mediaType: "image" as const,
			isPrimary: false,
			sortOrder: 1,
			createdAt: "",
		},
		{
			id: "m3",
			productId: "p1",
			colorName: null,
			url: "https://ik.imagekit.io/noctura/products/detail.jpg",
			altText: "Fabric Detail",
			mediaType: "image" as const,
			isPrimary: false,
			sortOrder: 2,
			createdAt: "",
		},
	];

	const blackMedia = filterMediaByColor(media, "obsidian black");
	assert.equal(blackMedia.length, 1);
	assert.equal(blackMedia[0].id, "m1");

	const fallbackMedia = filterMediaByColor(media, "Sage Green");
	assert.equal(fallbackMedia.length, 1);
	assert.equal(fallbackMedia[0].id, "m3");
});

test("convertMeasurementValue converts accurately between cm and inch", () => {
	assert.equal(convertMeasurementValue(50, "cm", "cm"), "50");
	assert.equal(convertMeasurementValue(50.8, "cm", "inch"), "20.0");
	assert.equal(convertMeasurementValue(20, "inch", "cm"), "50.8");
	assert.equal(convertMeasurementValue(undefined, "cm", "inch"), "—");
});
