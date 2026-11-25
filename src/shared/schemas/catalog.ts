import { z } from "zod";
import { createSlugSchema, productMediaItemSchema } from "./media";

export const GENDER_AUDIENCES = ["men", "women", "unisex", "kids"] as const;
export type GenderAudience = (typeof GENDER_AUDIENCES)[number];

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const MEDIA_TYPES = ["image", "video"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const SIZE_GUIDE_UNITS = ["cm", "inch"] as const;
export type SizeGuideUnit = (typeof SIZE_GUIDE_UNITS)[number];

export const CATALOG_SORT_OPTIONS = [
	"newest",
	"price_asc",
	"price_desc",
	"popularity",
] as const;
export type CatalogSortOption = (typeof CATALOG_SORT_OPTIONS)[number];

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const genderAudienceSchema = z.enum(GENDER_AUDIENCES, {
	error: "Gender audience must be one of: men, women, unisex, or kids.",
});

export const productStatusSchema = z.enum(PRODUCT_STATUSES, {
	error: "Product status must be one of: draft, published, or archived.",
});

export const mediaTypeSchema = z.enum(MEDIA_TYPES, {
	error: "Media type must be image or video.",
});

export const sizeGuideUnitSchema = z.enum(SIZE_GUIDE_UNITS, {
	error: "Measurement unit must be cm or inch.",
});

export const catalogSortSchema = z.enum(CATALOG_SORT_OPTIONS, {
	error: "Sort option must be newest, price_asc, price_desc, or popularity.",
});

/**
 * Normalizes single query string values (`?size=M`), comma-separated strings
 * (`?size=M,L`), or repeated params (`?size=M&size=L`) from Hono and TanStack Router.
 */
export const queryStringArraySchema = z
	.union([z.array(z.string()), z.string()])
	.transform((val) => {
		const rawItems = Array.isArray(val) ? val : val.split(",");
		const normalized = rawItems
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
		return normalized.length > 0 ? normalized : undefined;
	});

/**
 * Accepts both native booleans (TanStack Router JSON search params) and string
 * boolean representations (`"true"`, `"false"`, `"1"`, `"0"` from URL queries).
 */
export const queryBooleanSchema = z.union([z.boolean(), z.stringbool()]);

export const optionalNonNegativeIntQuerySchema = z
	.union([z.literal("").transform(() => undefined), z.coerce.number()])
	.pipe(
		z
			.int({ error: "Price filter must be a whole integer in IDR." })
			.min(0, "Price filter cannot be negative.")
			.optional(),
	);

export function createPaginationQueryShape(defaultLimit = 24, maxLimit = 100) {
	return {
		page: z
			.union([z.literal("").transform(() => undefined), z.coerce.number()])
			.pipe(
				z
					.int({ error: "Page must be an integer." })
					.min(1, "Page must be at least 1.")
					.default(1),
			)
			.optional()
			.transform((val) => val ?? 1),
		limit: z
			.union([z.literal("").transform(() => undefined), z.coerce.number()])
			.pipe(
				z
					.int({ error: "Limit must be an integer." })
					.min(1, "Limit must be at least 1.")
					.max(maxLimit, `Limit must not exceed ${maxLimit}.`)
					.default(defaultLimit),
			)
			.optional()
			.transform((val) => val ?? defaultLimit),
	};
}

// ---------------------------------------------------------------------------
// Category Schemas
// ---------------------------------------------------------------------------

const categoryBaseSchema = z.object({
	parentId: z
		.uuid({ error: "Invalid parent category ID." })
		.nullable()
		.optional(),
	name: z
		.string()
		.trim()
		.min(1, "Category name is required.")
		.max(100, "Category name must not exceed 100 characters."),
	slug: createSlugSchema("Category slug", 120),
	description: z
		.string()
		.trim()
		.max(2000, "Category description must not exceed 2000 characters.")
		.nullable()
		.optional(),
	imageUrl: z
		.url({ error: "Category image URL must be a valid URL." })
		.nullable()
		.optional(),
	sortOrder: z
		.int({ error: "Sort order must be an integer." })
		.min(0, "Sort order cannot be negative.")
		.default(0),
	isActive: z.boolean().default(true),
});

export const categoryInputSchema = categoryBaseSchema;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CategoryFormInput = z.input<typeof categoryInputSchema>;

export const categoryUpdateSchema = categoryBaseSchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

// ---------------------------------------------------------------------------
// Collection Schemas
// ---------------------------------------------------------------------------

const collectionBaseSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Collection name is required.")
		.max(120, "Collection name must not exceed 120 characters."),
	slug: createSlugSchema("Collection slug", 140),
	subtitle: z
		.string()
		.trim()
		.max(500, "Collection subtitle must not exceed 500 characters.")
		.nullable()
		.optional(),
	bannerUrl: z
		.url({ error: "Collection banner URL must be a valid URL." })
		.nullable()
		.optional(),
	startsAt: z.iso
		.datetime({ error: "Invalid collection start timestamp." })
		.nullable()
		.optional(),
	endsAt: z.iso
		.datetime({ error: "Invalid collection end timestamp." })
		.nullable()
		.optional(),
	isActive: z.boolean().default(true),
});

function validateCollectionDateRange(
	data: { startsAt?: string | null; endsAt?: string | null },
	ctx: z.RefinementCtx,
) {
	if (data.startsAt && data.endsAt) {
		if (Date.parse(data.endsAt) < Date.parse(data.startsAt)) {
			ctx.addIssue({
				code: "custom",
				path: ["endsAt"],
				message: "Collection end date must be after start date.",
			});
		}
	}
}

export const collectionInputSchema = collectionBaseSchema.superRefine(
	validateCollectionDateRange,
);
export type CollectionInput = z.infer<typeof collectionInputSchema>;

export const collectionUpdateSchema = collectionBaseSchema
	.partial()
	.superRefine(validateCollectionDateRange);
export type CollectionUpdateInput = z.infer<typeof collectionUpdateSchema>;

// ---------------------------------------------------------------------------
// Size Guide Schemas
// ---------------------------------------------------------------------------

export const sizeGuideMeasurementRowSchema = z
	.object({
		size: z
			.string()
			.trim()
			.min(1, "Size label is required.")
			.max(20, "Size label must not exceed 20 characters."),
		chestWidthCm: z.number().positive().optional(),
		bodyLengthCm: z.number().positive().optional(),
		waistWidthCm: z.number().positive().optional(),
		hipWidthCm: z.number().positive().optional(),
		sleeveLengthCm: z.number().positive().optional(),
	})
	.catchall(
		z.union([z.string().trim().min(1), z.number().positive()]).optional(),
	);

export type SizeGuideMeasurementRowInput = z.infer<
	typeof sizeGuideMeasurementRowSchema
>;

export const sizeGuideMatrixSchema = z
	.object({
		unit: sizeGuideUnitSchema.default("cm"),
		rows: z
			.array(sizeGuideMeasurementRowSchema)
			.min(1, "Size guide must contain at least one measurement row."),
	})
	.superRefine((matrix, ctx) => {
		const seenSizes = new Set<string>();
		for (const [index, row] of matrix.rows.entries()) {
			const normalizedSize = row.size.toUpperCase();
			if (seenSizes.has(normalizedSize)) {
				ctx.addIssue({
					code: "custom",
					path: ["rows", index, "size"],
					message: `Duplicate size "${row.size}" in size guide.`,
				});
			}
			seenSizes.add(normalizedSize);
		}
	});

export type SizeGuideMatrixInput = z.infer<typeof sizeGuideMatrixSchema>;

const sizeGuideBaseSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Size guide name is required.")
		.max(120, "Size guide name must not exceed 120 characters."),
	garmentType: z
		.string()
		.trim()
		.min(1, "Garment type is required.")
		.max(50, "Garment type must not exceed 50 characters."),
	measurementsJson: sizeGuideMatrixSchema,
	modelNote: z
		.string()
		.trim()
		.max(1000, "Model note must not exceed 1000 characters.")
		.nullable()
		.optional(),
});

export const sizeGuideInputSchema = sizeGuideBaseSchema;
export type SizeGuideInput = z.infer<typeof sizeGuideInputSchema>;

export const sizeGuideUpdateSchema = sizeGuideBaseSchema.partial();
export type SizeGuideUpdateInput = z.infer<typeof sizeGuideUpdateSchema>;

// ---------------------------------------------------------------------------
// Product Variant & Product Schemas
// ---------------------------------------------------------------------------

const productVariantBaseSchema = z.object({
	sku: z
		.string()
		.trim()
		.min(3, "SKU must be at least 3 characters.")
		.max(64, "SKU must not exceed 64 characters."),
	colorName: z
		.string()
		.trim()
		.min(2, "Color name must be at least 2 characters.")
		.max(60, "Color name must not exceed 60 characters."),
	colorHex: z
		.string()
		.trim()
		.regex(
			HEX_COLOR_REGEX,
			"Color hex must be a valid 6-digit hex code (e.g. #1A1A1A).",
		),
	sizeLabel: z
		.string()
		.trim()
		.min(1, "Size label is required.")
		.max(20, "Size label must not exceed 20 characters."),
	sizeSortOrder: z
		.int({ error: "Size sort order must be an integer." })
		.min(0, "Size sort order cannot be negative.")
		.max(32767, "Size sort order exceeds smallint limit.")
		.default(0),
	priceIdr: z
		.int({ error: "Price must be a whole integer in IDR." })
		.positive("Price must be greater than 0 IDR."),
	compareAtPriceIdr: z
		.int({ error: "Compare-at price must be a whole integer in IDR." })
		.positive("Compare-at price must be greater than 0 IDR.")
		.nullable()
		.optional(),
	stockQuantity: z
		.int({ error: "Stock quantity must be an integer." })
		.min(0, "Stock quantity cannot be negative.")
		.default(0),
	weightGrams: z
		.int({ error: "Weight must be an integer in grams." })
		.min(1, "Weight must be at least 1 gram."),
	lengthCm: z
		.int({ error: "Length must be an integer in cm." })
		.min(1, "Length must be at least 1 cm."),
	widthCm: z
		.int({ error: "Width must be an integer in cm." })
		.min(1, "Width must be at least 1 cm."),
	heightCm: z
		.int({ error: "Height must be an integer in cm." })
		.min(1, "Height must be at least 1 cm."),
	isActive: z.boolean().default(true),
});

function validateCompareAtPrice(
	data: { priceIdr?: number; compareAtPriceIdr?: number | null },
	ctx: z.RefinementCtx,
) {
	if (
		data.compareAtPriceIdr != null &&
		data.priceIdr != null &&
		data.compareAtPriceIdr < data.priceIdr
	) {
		ctx.addIssue({
			code: "custom",
			path: ["compareAtPriceIdr"],
			message:
				"Compare-at price must be greater than or equal to selling price.",
		});
	}
}

export const productVariantSchema = productVariantBaseSchema.superRefine(
	validateCompareAtPrice,
);
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductVariantFormInput = z.input<typeof productVariantSchema>;

export const productVariantUpdateSchema = productVariantBaseSchema
	.partial()
	.superRefine(validateCompareAtPrice);
export type ProductVariantUpdateInput = z.infer<
	typeof productVariantUpdateSchema
>;

export const productMediaInputSchema = z.object({
	...productMediaItemSchema.shape,
	mediaType: mediaTypeSchema.default("image"),
	sortOrder: z
		.int({ error: "Media sort order must be an integer." })
		.min(0, "Media sort order cannot be negative.")
		.max(32767, "Media sort order exceeds smallint limit.")
		.default(0),
});
export type ProductMediaInput = z.infer<typeof productMediaInputSchema>;

const productBaseSchema = z.object({
	categoryId: z.uuid({ error: "Invalid category ID." }),
	sizeGuideId: z
		.uuid({ error: "Invalid size guide ID." })
		.nullable()
		.optional(),
	parentSku: z
		.string()
		.trim()
		.min(3, "Parent SKU must be at least 3 characters.")
		.max(64, "Parent SKU must not exceed 64 characters."),
	name: z
		.string()
		.trim()
		.min(2, "Product name must be at least 2 characters.")
		.max(200, "Product name must not exceed 200 characters."),
	slug: createSlugSchema("Product slug", 220),
	brand: z
		.string()
		.trim()
		.min(1, "Brand name is required.")
		.max(100, "Brand name must not exceed 100 characters.")
		.default("Noctura"),
	description: z
		.string()
		.trim()
		.min(1, "Product description is required.")
		.max(10_000, "Product description must not exceed 10,000 characters."),
	genderAudience: genderAudienceSchema,
	materialComposition: z
		.string()
		.trim()
		.max(255, "Material composition must not exceed 255 characters.")
		.nullable()
		.optional(),
	careInstructions: z
		.string()
		.trim()
		.max(2000, "Care instructions must not exceed 2000 characters.")
		.nullable()
		.optional(),
	fitType: z
		.string()
		.trim()
		.max(50, "Fit type must not exceed 50 characters.")
		.nullable()
		.optional(),
	basePriceIdr: z
		.int({ error: "Base price must be a whole integer in IDR." })
		.positive("Base price must be greater than 0 IDR."),
	status: productStatusSchema.default("draft"),
	collectionIds: z
		.array(z.uuid({ error: "Invalid collection ID." }))
		.default([]),
	media: z.array(productMediaInputSchema).default([]),
	variants: z
		.array(productVariantSchema)
		.min(1, "Product must have at least one SKU variant."),
});

function validateUniqueProductVariants(
	data: { variants?: ProductVariantInput[] },
	ctx: z.RefinementCtx,
) {
	if (!data.variants) {
		return;
	}

	const seenSkus = new Set<string>();
	const seenColorSizes = new Set<string>();

	for (const [index, variant] of data.variants.entries()) {
		const normalizedSku = variant.sku.toUpperCase();
		if (seenSkus.has(normalizedSku)) {
			ctx.addIssue({
				code: "custom",
				path: ["variants", index, "sku"],
				message: `Duplicate variant SKU "${variant.sku}".`,
			});
		}
		seenSkus.add(normalizedSku);

		const colorSizeKey = `${variant.colorName.toLowerCase()}::${variant.sizeLabel.toUpperCase()}`;
		if (seenColorSizes.has(colorSizeKey)) {
			ctx.addIssue({
				code: "custom",
				path: ["variants", index, "sizeLabel"],
				message: `Duplicate color/size combination "${variant.colorName} / ${variant.sizeLabel}".`,
			});
		}
		seenColorSizes.add(colorSizeKey);
	}
}

export const productInputSchema = productBaseSchema.superRefine(
	validateUniqueProductVariants,
);
export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductFormInput = z.input<typeof productInputSchema>;

export const productUpdateSchema = productBaseSchema
	.partial()
	.superRefine(validateUniqueProductVariants);
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// ---------------------------------------------------------------------------
// Catalog Filter Query Schema (PLP URL Search Params + GET /api/products)
// ---------------------------------------------------------------------------

export const catalogFilterSchema = z
	.object({
		search: z
			.string()
			.trim()
			.max(120, "Search query must not exceed 120 characters.")
			.optional(),
		category: z.string().trim().min(1).max(120).optional(),
		collection: z.string().trim().min(1).max(140).optional(),
		genderAudience: genderAudienceSchema.optional(),
		size: queryStringArraySchema.optional(),
		color: queryStringArraySchema.optional(),
		minPrice: optionalNonNegativeIntQuerySchema.optional(),
		maxPrice: optionalNonNegativeIntQuerySchema.optional(),
		inStock: queryBooleanSchema.optional(),
		sort: catalogSortSchema.default("newest"),
		...createPaginationQueryShape(24, 100),
	})
	.superRefine((data, ctx) => {
		if (
			data.minPrice !== undefined &&
			data.maxPrice !== undefined &&
			data.minPrice > data.maxPrice
		) {
			ctx.addIssue({
				code: "custom",
				path: ["maxPrice"],
				message:
					"Maximum price must be greater than or equal to minimum price.",
			});
		}
	});

export type CatalogFilter = z.infer<typeof catalogFilterSchema>;
export type CatalogFilterInput = z.input<typeof catalogFilterSchema>;
