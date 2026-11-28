import { buildFashionImageUrl } from "@/lib/imagekit";
import type { GenderAudience } from "@/shared/schemas/catalog";

export interface ProductSeoVariant {
	sku: string;
	colorName: string;
	sizeLabel: string;
	priceIdr: number;
	stockQuantity: number;
	reservedQuantity: number;
	availableQuantity?: number;
}

export interface ProductSeoMedia {
	url: string;
	altText: string;
	colorName: string | null;
	mediaType: "image" | "video";
	isPrimary: boolean;
}

export interface ProductSeoColor {
	colorName: string;
	primaryImageUrl: string | null;
}

export interface ProductSeoInput {
	slug: string;
	parentSku: string;
	name: string;
	brand: string;
	description: string;
	genderAudience: GenderAudience;
	materialComposition: string | null;
	category: {
		name: string;
		slug: string;
	} | null;
	variants: readonly ProductSeoVariant[];
	media: readonly ProductSeoMedia[];
	colors: readonly ProductSeoColor[];
}

function normalizeOrigin(origin: string): string {
	return origin.replace(/\/+$/, "");
}

function buildTruncatedDescription(
	description: string,
	maxLength = 160,
): string {
	const normalized = description.replace(/\s+/g, " ").trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	const clipped = normalized.slice(0, maxLength - 1);
	const lastSpace = clipped.lastIndexOf(" ");
	const safeSlice = lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped;
	return `${safeSlice}…`;
}

function resolveColorImageUrl(
	product: ProductSeoInput,
	colorName: string,
	origin: string,
): string | undefined {
	const colorMatch = product.colors.find(
		(c) => c.colorName.toLowerCase() === colorName.toLowerCase(),
	);
	const mediaMatch = product.media.find(
		(m) =>
			m.mediaType === "image" &&
			m.colorName?.toLowerCase() === colorName.toLowerCase(),
	);
	const fallbackMedia =
		product.media.find((m) => m.mediaType === "image" && m.isPrimary) ??
		product.media.find((m) => m.mediaType === "image");

	const rawUrl =
		colorMatch?.primaryImageUrl ?? mediaMatch?.url ?? fallbackMedia?.url;
	if (!rawUrl) return undefined;

	const transformed = buildFashionImageUrl(rawUrl, { width: 1200 });
	if (!transformed) return undefined;
	if (transformed.startsWith("/")) {
		return `${origin}${transformed}`;
	}
	return transformed;
}

function getVariantAvailableQuantity(variant: ProductSeoVariant): number {
	if (typeof variant.availableQuantity === "number") {
		return Math.max(0, variant.availableQuantity);
	}
	return Math.max(0, variant.stockQuantity - variant.reservedQuantity);
}

/**
 * Builds Google-compliant Schema.org `ProductGroup` JSON-LD for fashion apparel
 * with color and size variants (`variesBy`, `hasVariant`, `Offer` in IDR).
 */
export function buildProductGroupJsonLd(
	product: ProductSeoInput,
	origin: string,
) {
	const cleanOrigin = normalizeOrigin(origin);
	const canonicalUrl = `${cleanOrigin}/products/${product.slug}`;

	const imageUrls = Array.from(
		new Set(
			product.media
				.filter((m) => m.mediaType === "image")
				.map((m) => {
					const transformed = buildFashionImageUrl(m.url, { width: 1200 });
					if (!transformed) return "";
					return transformed.startsWith("/")
						? `${cleanOrigin}${transformed}`
						: transformed;
				})
				.filter(Boolean),
		),
	);

	return {
		"@context": "https://schema.org",
		"@type": "ProductGroup",
		name: product.name,
		description: buildTruncatedDescription(product.description, 320),
		productGroupID: product.parentSku,
		url: canonicalUrl,
		brand: {
			"@type": "Brand",
			name: product.brand || "NOCTURA",
		},
		...(product.category ? { category: product.category.name } : {}),
		...(product.materialComposition
			? { material: product.materialComposition }
			: {}),
		audience: {
			"@type": "PeopleAudience",
			suggestedGender: product.genderAudience,
		},
		...(imageUrls.length > 0 ? { image: imageUrls } : {}),
		variesBy: ["https://schema.org/color", "https://schema.org/size"],
		hasVariant: product.variants.map((variant) => {
			const variantUrl = `${canonicalUrl}?color=${encodeURIComponent(
				variant.colorName,
			)}&size=${encodeURIComponent(variant.sizeLabel)}`;
			const variantImage = resolveColorImageUrl(
				product,
				variant.colorName,
				cleanOrigin,
			);
			const available = getVariantAvailableQuantity(variant);

			return {
				"@type": "Product",
				name: `${product.name} - ${variant.colorName} / ${variant.sizeLabel}`,
				sku: variant.sku,
				color: variant.colorName,
				size: variant.sizeLabel,
				url: variantUrl,
				...(variantImage ? { image: variantImage } : {}),
				offers: {
					"@type": "Offer",
					url: variantUrl,
					price: variant.priceIdr,
					priceCurrency: "IDR",
					availability:
						available > 0
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
				},
			};
		}),
	};
}

/**
 * Builds Schema.org `BreadcrumbList` JSON-LD synchronized with PDP breadcrumb navigation.
 */
export function buildProductBreadcrumbJsonLd(
	product: ProductSeoInput,
	origin: string,
) {
	const cleanOrigin = normalizeOrigin(origin);
	const itemListElement = [
		{
			"@type": "ListItem",
			position: 1,
			name: "Home",
			item: cleanOrigin,
		},
		{
			"@type": "ListItem",
			position: 2,
			name: "Products",
			item: `${cleanOrigin}/products`,
		},
		...(product.category
			? [
					{
						"@type": "ListItem",
						position: 3,
						name: product.category.name,
						item: `${cleanOrigin}/products?category=${encodeURIComponent(
							product.category.slug,
						)}`,
					},
				]
			: []),
		{
			"@type": "ListItem",
			position: product.category ? 4 : 3,
			name: product.name,
			item: `${cleanOrigin}/products/${product.slug}`,
		},
	];

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement,
	};
}

/**
 * Builds complete SSR `<head>` metadata (title, description, self-referencing canonical,
 * Open Graph, Twitter Card, and Schema.org JSON-LD scripts) for the PDP route.
 */
export function buildProductHeadMetadata(
	product: ProductSeoInput | null,
	origin: string,
) {
	if (!product) {
		return {
			meta: [
				{ title: "Product Not Found | NOCTURA" },
				{
					name: "description",
					content:
						"The requested garment could not be found in the NOCTURA catalog.",
				},
				{ name: "robots", content: "noindex, nofollow" },
			],
		};
	}

	const cleanOrigin = normalizeOrigin(origin);
	const canonicalUrl = `${cleanOrigin}/products/${product.slug}`;
	const title = `${product.name} | NOCTURA`;
	const description = buildTruncatedDescription(
		product.description ||
			`${product.name} by ${product.brand}${product.category ? ` — ${product.category.name}` : ""}`,
		160,
	);

	const leadImage =
		product.media.find((m) => m.mediaType === "image" && m.isPrimary) ??
		product.media.find((m) => m.mediaType === "image");

	const resolvedLeadImage = leadImage
		? buildFashionImageUrl(leadImage.url, { width: 1200 })
		: "";
	const ogImage = resolvedLeadImage
		? resolvedLeadImage.startsWith("/")
			? `${cleanOrigin}${resolvedLeadImage}`
			: resolvedLeadImage
		: undefined;

	const jsonLd = [
		buildProductGroupJsonLd(product, cleanOrigin),
		buildProductBreadcrumbJsonLd(product, cleanOrigin),
	];

	return {
		meta: [
			{ title },
			{ name: "description", content: description },
			{ property: "og:site_name", content: "NOCTURA" },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: canonicalUrl },
			{ property: "og:type", content: "product" },
			...(ogImage
				? [
						{ property: "og:image", content: ogImage },
						{ property: "og:image:width", content: "1200" },
						{ property: "og:image:height", content: "1600" },
						{
							property: "og:image:alt",
							content: leadImage?.altText || product.name,
						},
					]
				: []),
			{
				name: "twitter:card",
				content: ogImage ? "summary_large_image" : "summary",
			},
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
		],
		links: [{ rel: "canonical", href: canonicalUrl }],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify(jsonLd),
			},
		],
	};
}
