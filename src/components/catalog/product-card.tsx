import { useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { ColorVariant, Product } from "@/data/catalog";
import { formatIdr } from "@/lib/format";
import {
	buildFashionImageUrl,
	buildFashionLqipUrl,
	buildFashionSrcSet,
} from "@/lib/imagekit";
import type { ProductListItem } from "@/server/services/catalog.service";

export interface CatalogProductCardProps {
	item: ProductListItem;
	minimalMode?: boolean;
	priority?: boolean;
}

function mapProductListItemToCardProduct(item: ProductListItem): {
	product: Product;
	formattedPrice: string;
	compareAtFormattedPrice?: string;
	lqipUrl?: string;
} {
	const fallbackPrimary = item.primaryImage?.url ?? "";
	const fallbackHover = item.hoverImage?.url ?? null;

	const colors: ColorVariant[] = item.colors.map((color) => {
		const rawImages = [
			color.primaryImageUrl ?? fallbackPrimary,
			color.hoverImageUrl ??
				(fallbackHover && fallbackHover !== color.primaryImageUrl
					? fallbackHover
					: null),
		].filter((url): url is string => Boolean(url));

		return {
			id: color.colorName.toLowerCase(),
			name: color.colorName,
			hex: color.colorHex,
			image: rawImages[0],
			images: rawImages,
		};
	});

	const allRawImages = [item.primaryImage?.url, item.hoverImage?.url].filter(
		(url): url is string => Boolean(url),
	);

	const formattedPrice =
		item.priceRange.minPriceIdr === item.priceRange.maxPriceIdr
			? formatIdr(item.priceRange.minPriceIdr)
			: `From ${formatIdr(item.priceRange.minPriceIdr)}`;

	const compareAtFormattedPrice =
		item.priceRange.compareAtMinPriceIdr !== null &&
		item.priceRange.compareAtMinPriceIdr > item.priceRange.minPriceIdr
			? formatIdr(item.priceRange.compareAtMinPriceIdr)
			: undefined;

	const subtitleParts = [item.category.name];
	if (item.fitType) {
		subtitleParts.push(item.fitType);
	}

	const editorialLabel =
		compareAtFormattedPrice !== undefined
			? "Offer"
			: item.sizes.length > 0
				? item.sizes.slice(0, 4).join(" · ")
				: undefined;

	const product: Product = {
		id: item.id,
		sku: item.parentSku,
		title: item.name,
		subtitle: subtitleParts.join(" · "),
		price: item.priceRange.minPriceIdr,
		category: "Outerwear",
		tags: [],
		editorialLabel,
		image: fallbackPrimary,
		imageAlt: item.primaryImage?.altText || item.name,
		images: allRawImages,
		colors,
		sizes: item.sizes,
		composition: "",
		fitNotes: "",
		care: "",
		featuredRank: 0,
	};

	const lqipUrl = fallbackPrimary
		? buildFashionLqipUrl(fallbackPrimary)
		: undefined;

	return {
		product,
		formattedPrice,
		compareAtFormattedPrice,
		lqipUrl: lqipUrl || undefined,
	};
}

export function CatalogProductCard({
	item,
	minimalMode = false,
	priority = false,
}: CatalogProductCardProps) {
	const mapped = useMemo(() => mapProductListItemToCardProduct(item), [item]);

	return (
		<ProductCard
			product={mapped.product}
			productHref={`/products/${item.slug}`}
			minimalMode={minimalMode}
			formattedPrice={mapped.formattedPrice}
			compareAtFormattedPrice={mapped.compareAtFormattedPrice}
			inStock={item.inStock}
			hoverPreviewOnHover={true}
			lqipUrl={mapped.lqipUrl}
			resolveImageUrl={(src) => buildFashionImageUrl(src, { width: 800 })}
			resolveSrcSet={(src) => buildFashionSrcSet(src, [400, 800, 1200])}
			imageLoading={priority ? "eager" : "lazy"}
			imageFetchPriority={priority ? "high" : "auto"}
		/>
	);
}
