import type { ProductVariantAdminInput } from "@/shared/schemas/catalog";

export interface MatrixColorChoice {
	colorName: string;
	colorHex: string;
}

export interface MatrixBatchDefaults {
	priceIdr?: number;
	compareAtPriceIdr?: number | null;
	stockQuantity?: number;
	weightGrams?: number;
	lengthCm?: number;
	widthCm?: number;
	heightCm?: number;
}

export const PRESET_COLORS: readonly MatrixColorChoice[] = [
	{ colorName: "Obsidian", colorHex: "#121212" },
	{ colorName: "Ivory", colorHex: "#F4F1EA" },
	{ colorName: "Midnight Navy", colorHex: "#1B2A4A" },
	{ colorName: "Sage", colorHex: "#6B7F6E" },
	{ colorName: "Slate", colorHex: "#4A5568" },
	{ colorName: "Espresso", colorHex: "#3D2B1F" },
	{ colorName: "Sand", colorHex: "#D6C7B2" },
	{ colorName: "Burgundy", colorHex: "#5C1E28" },
] as const;

export const PRESET_SIZES: readonly string[] = [
	"XS",
	"S",
	"M",
	"L",
	"XL",
	"XXL",
	"28",
	"30",
	"32",
	"34",
	"36",
	"One Size",
] as const;

const SIZE_ORDER_MAP = new Map<string, number>(
	PRESET_SIZES.map((size, idx) => [size.toUpperCase(), idx]),
);

const idrFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

export function formatIdr(amount: number): string {
	return idrFormatter.format(amount);
}

export function slugifyText(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 220);
}

export function suggestParentSku(name: string): string {
	const tokens = name
		.toUpperCase()
		.replace(/[^A-Z0-9\s]/g, "")
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 3)
		.map((word) => word.slice(0, 4));

	if (tokens.length === 0) {
		return "NOC-ITEM-01";
	}
	return `NOC-${tokens.join("-")}`;
}

function sanitizeSkuToken(value: string, maxLength: number): string {
	const cleaned = value
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return (cleaned || "VAR").slice(0, maxLength);
}

export function buildVariantSku(
	parentSku: string,
	colorName: string,
	sizeLabel: string,
): string {
	const base = sanitizeSkuToken(parentSku || "NOC-ITEM", 32);
	const colorCode = sanitizeSkuToken(colorName, 12);
	const sizeCode = sanitizeSkuToken(sizeLabel, 10);
	return `${base}-${colorCode}-${sizeCode}`.slice(0, 64);
}

export function getSizeSortOrder(
	sizeLabel: string,
	fallbackIndex: number,
): number {
	return (
		SIZE_ORDER_MAP.get(sizeLabel.trim().toUpperCase()) ?? 100 + fallbackIndex
	);
}

export function generateVariantMatrix(params: {
	parentSku: string;
	basePriceIdr: number;
	colors: readonly MatrixColorChoice[];
	sizes: readonly string[];
	existingVariants: readonly ProductVariantAdminInput[];
	defaults?: MatrixBatchDefaults;
}): ProductVariantAdminInput[] {
	const { parentSku, basePriceIdr, colors, sizes, existingVariants, defaults } =
		params;

	const existingByKey = new Map<string, ProductVariantAdminInput>();
	for (const variant of existingVariants) {
		const key = `${variant.colorName.trim().toLowerCase()}::${variant.sizeLabel.trim().toUpperCase()}`;
		existingByKey.set(key, variant);
	}

	const defaultPrice =
		defaults?.priceIdr && defaults.priceIdr > 0
			? defaults.priceIdr
			: basePriceIdr > 0
				? basePriceIdr
				: 250_000;

	const generated: ProductVariantAdminInput[] = [];
	const usedSkus = new Set<string>();

	for (const color of colors) {
		const colorName = color.colorName.trim();
		if (!colorName) continue;

		for (const [sizeIndex, rawSize] of sizes.entries()) {
			const sizeLabel = rawSize.trim();
			if (!sizeLabel) continue;

			const key = `${colorName.toLowerCase()}::${sizeLabel.toUpperCase()}`;
			const existing = existingByKey.get(key);

			let candidateSku =
				existing?.sku || buildVariantSku(parentSku, colorName, sizeLabel);
			if (usedSkus.has(candidateSku.toUpperCase())) {
				let suffix = 2;
				while (usedSkus.has(`${candidateSku}-${suffix}`.toUpperCase())) {
					suffix += 1;
				}
				candidateSku = `${candidateSku.slice(0, 58)}-${suffix}`;
			}
			usedSkus.add(candidateSku.toUpperCase());

			generated.push({
				...(existing?.id ? { id: existing.id } : {}),
				sku: candidateSku,
				colorName,
				colorHex: color.colorHex,
				sizeLabel,
				sizeSortOrder: getSizeSortOrder(sizeLabel, sizeIndex),
				priceIdr: existing?.priceIdr ?? defaultPrice,
				compareAtPriceIdr:
					existing?.compareAtPriceIdr ?? defaults?.compareAtPriceIdr ?? null,
				stockQuantity: existing?.stockQuantity ?? defaults?.stockQuantity ?? 10,
				weightGrams: existing?.weightGrams ?? defaults?.weightGrams ?? 350,
				lengthCm: existing?.lengthCm ?? defaults?.lengthCm ?? 32,
				widthCm: existing?.widthCm ?? defaults?.widthCm ?? 24,
				heightCm: existing?.heightCm ?? defaults?.heightCm ?? 4,
				isActive: existing?.isActive ?? true,
			});
		}
	}

	return generated;
}

export function applyBatchToVariants(
	variants: readonly ProductVariantAdminInput[],
	patch: MatrixBatchDefaults,
): ProductVariantAdminInput[] {
	return variants.map((variant) => ({
		...variant,
		...(patch.priceIdr !== undefined && patch.priceIdr > 0
			? { priceIdr: patch.priceIdr }
			: {}),
		...(patch.compareAtPriceIdr !== undefined
			? { compareAtPriceIdr: patch.compareAtPriceIdr }
			: {}),
		...(patch.stockQuantity !== undefined && patch.stockQuantity >= 0
			? { stockQuantity: patch.stockQuantity }
			: {}),
		...(patch.weightGrams !== undefined && patch.weightGrams > 0
			? { weightGrams: patch.weightGrams }
			: {}),
		...(patch.lengthCm !== undefined && patch.lengthCm > 0
			? { lengthCm: patch.lengthCm }
			: {}),
		...(patch.widthCm !== undefined && patch.widthCm > 0
			? { widthCm: patch.widthCm }
			: {}),
		...(patch.heightCm !== undefined && patch.heightCm > 0
			? { heightCm: patch.heightCm }
			: {}),
	}));
}
