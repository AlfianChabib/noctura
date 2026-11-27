import { formOptions } from "@tanstack/react-form";
import {
	formatFieldErrors,
	useAppForm,
	validateWithZodSchema,
	withForm,
} from "@/components/form";
import type { AdminProductDetail } from "@/lib/queries/admin-catalog";
import {
	type ProductAdminUpdateInput,
	productAdminUpdateSchema,
} from "@/shared/schemas/catalog";

export type ProductFormValues = ProductAdminUpdateInput;

export { formatFieldErrors };

export function createEmptyProductFormValues(
	defaultCategoryId = "",
): ProductFormValues {
	return {
		categoryId: defaultCategoryId,
		sizeGuideId: null,
		parentSku: "",
		name: "",
		slug: "",
		brand: "Noctura",
		description: "",
		genderAudience: "unisex",
		materialComposition: "",
		careInstructions: "",
		fitType: "",
		basePriceIdr: 450_000,
		status: "draft",
		collectionIds: [],
		media: [],
		variants: [
			{
				sku: "NOC-ITEM-OBS-M",
				colorName: "Obsidian",
				colorHex: "#121212",
				sizeLabel: "M",
				sizeSortOrder: 2,
				priceIdr: 450_000,
				compareAtPriceIdr: null,
				stockQuantity: 10,
				weightGrams: 350,
				lengthCm: 32,
				widthCm: 24,
				heightCm: 4,
				isActive: true,
			},
		],
	};
}

export function productDetailToFormValues(
	product: AdminProductDetail,
): ProductFormValues {
	return {
		categoryId: product.categoryId,
		sizeGuideId: product.sizeGuideId ?? null,
		parentSku: product.parentSku,
		name: product.name,
		slug: product.slug,
		brand: product.brand,
		description: product.description,
		genderAudience: product.genderAudience,
		materialComposition: product.materialComposition ?? "",
		careInstructions: product.careInstructions ?? "",
		fitType: product.fitType ?? "",
		basePriceIdr: product.basePriceIdr,
		status: product.status,
		collectionIds: product.collectionIds,
		media: product.media.map((item, idx) => ({
			url: item.url,
			altText: item.altText,
			colorName: item.colorName ?? undefined,
			isPrimary: item.isPrimary,
			mediaType: item.mediaType,
			sortOrder: item.sortOrder ?? idx,
		})),
		variants:
			product.variants.length > 0
				? product.variants.map((variant) => ({
						id: variant.id,
						sku: variant.sku,
						colorName: variant.colorName,
						colorHex: variant.colorHex,
						sizeLabel: variant.sizeLabel,
						sizeSortOrder: variant.sizeSortOrder,
						priceIdr: variant.priceIdr,
						compareAtPriceIdr: variant.compareAtPriceIdr ?? null,
						stockQuantity: variant.stockQuantity,
						weightGrams: variant.weightGrams,
						lengthCm: variant.lengthCm,
						widthCm: variant.widthCm,
						heightCm: variant.heightCm,
						isActive: variant.isActive,
					}))
				: createEmptyProductFormValues(product.categoryId).variants,
	};
}

export function validateProductWithZod(value: ProductFormValues) {
	return validateWithZodSchema(
		productAdminUpdateSchema,
		value,
		"Periksa kembali data produk.",
	);
}

export const productFormOpts = formOptions({
	defaultValues: createEmptyProductFormValues(),
	validators: {
		onSubmit: ({ value }) => validateProductWithZod(value),
	},
});

export const useProductAppForm = useAppForm;
export const withProductForm = withForm;
