import { z } from "zod";
import type { StorefrontProductDetail } from "@/lib/queries/storefront-catalog";

const pdpSearchSchema = z.object({
	color: z
		.string()
		.trim()
		.max(60)
		.optional()
		.transform((val) => (val && val.length > 0 ? val : undefined)),
	size: z
		.string()
		.trim()
		.max(20)
		.optional()
		.transform((val) => (val && val.length > 0 ? val : undefined)),
});

export interface PdpSearchParams {
	color?: string;
	size?: string;
}

/**
 * Safely validates optional `?color=...&size=...` search parameters on the PDP route.
 * Falls back cleanly to empty object on malformed inputs.
 */
export function validatePdpSearch(
	search: Record<string, unknown>,
): PdpSearchParams {
	const parsed = pdpSearchSchema.safeParse({
		color: typeof search.color === "string" ? search.color : undefined,
		size: typeof search.size === "string" ? search.size : undefined,
	});
	if (!parsed.success) {
		return {};
	}
	return {
		...(parsed.data.color ? { color: parsed.data.color } : {}),
		...(parsed.data.size ? { size: parsed.data.size } : {}),
	};
}

export interface InitialPdpSelection {
	colorName: string;
	sizeLabel: string | null;
}

/**
 * Resolves initial color and size selection from URL query parameters,
 * falling back to the first in-stock color and auto-selecting a single available size.
 */
export function resolveInitialPdpSelection(
	product: Pick<StorefrontProductDetail, "colors" | "variants">,
	search: PdpSearchParams,
): InitialPdpSelection {
	const matchedColor = search.color
		? product.colors.find(
				(c) => c.colorName.toLowerCase() === search.color?.toLowerCase(),
			)
		: undefined;

	const defaultColor =
		matchedColor ??
		product.colors.find((c) => c.inStock) ??
		product.colors[0] ??
		(product.variants[0]
			? { colorName: product.variants[0].colorName }
			: undefined);

	const colorName = defaultColor?.colorName ?? "";
	const colorVariants = product.variants.filter(
		(v) => v.colorName.toLowerCase() === colorName.toLowerCase(),
	);

	if (search.size) {
		const matchedVariant = colorVariants.find(
			(v) => v.sizeLabel.toLowerCase() === search.size?.toLowerCase(),
		);
		if (matchedVariant && matchedVariant.availableQuantity > 0) {
			return {
				colorName,
				sizeLabel: matchedVariant.sizeLabel,
			};
		}
	}

	const inStockVariants = colorVariants.filter((v) => v.availableQuantity > 0);
	if (inStockVariants.length === 1) {
		return {
			colorName,
			sizeLabel: inStockVariants[0].sizeLabel,
		};
	}

	return {
		colorName,
		sizeLabel: null,
	};
}
