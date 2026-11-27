import {
	and,
	asc,
	count,
	desc,
	eq,
	exists,
	gte,
	ilike,
	inArray,
	lte,
	ne,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { type Database, db } from "@/db";
import {
	categories,
	collections,
	productCollections,
	productMedia,
	products,
	productVariants,
	sizeGuides,
	stockMovements,
} from "@/db/schema/catalog";
import { orderItems, orders } from "@/db/schema/orders";
import type { Role } from "@/lib/auth-access";
import type {
	AdminCatalogFilter,
	AdminProductSortOption,
	CatalogFilter,
	CatalogSortOption,
	ProductAdminUpdateInput,
	ProductInput,
	ProductStatus,
} from "@/shared/schemas/catalog";
import {
	buildPaginationMeta,
	escapeLikePattern,
	type PaginationMeta,
} from "../lib/query-utils";

export interface CatalogActor {
	id: string;
	role: Role;
}

export interface CatalogServiceDeps {
	db?: Database;
}

export interface ProductColorSummary {
	colorName: string;
	colorHex: string;
	inStock: boolean;
	primaryImageUrl: string | null;
	hoverImageUrl: string | null;
}

export interface ProductPriceRange {
	minPriceIdr: number;
	maxPriceIdr: number;
	compareAtMinPriceIdr: number | null;
}

export interface ProductImageSummary {
	id: string;
	url: string;
	altText: string;
	colorName: string | null;
	mediaType: "image" | "video";
	isPrimary: boolean;
	sortOrder: number;
}

export interface ProductListItem {
	id: string;
	slug: string;
	parentSku: string;
	name: string;
	brand: string;
	genderAudience: "men" | "women" | "unisex" | "kids";
	fitType: string | null;
	basePriceIdr: number;
	publishedAt: string | null;
	category: {
		id: string;
		name: string;
		slug: string;
	};
	priceRange: ProductPriceRange;
	colors: ProductColorSummary[];
	sizes: string[];
	totalAvailableStock: number;
	inStock: boolean;
	primaryImage: ProductImageSummary | null;
	hoverImage: ProductImageSummary | null;
}

export interface ProductListResponse {
	items: ProductListItem[];
	pagination: PaginationMeta;
}

export interface AdminProductListItem {
	id: string;
	slug: string;
	parentSku: string;
	name: string;
	brand: string;
	genderAudience: "men" | "women" | "unisex" | "kids";
	fitType: string | null;
	basePriceIdr: number;
	status: ProductStatus;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	category: {
		id: string;
		name: string;
		slug: string;
	};
	priceRange: ProductPriceRange;
	variantCount: number;
	totalAvailableStock: number;
	inStock: boolean;
	primaryImage: ProductImageSummary | null;
}

export interface AdminProductListResponse {
	items: AdminProductListItem[];
	pagination: PaginationMeta;
}

type VariantAggregationRow = {
	colorName: string;
	colorHex: string;
	sizeLabel: string;
	sizeSortOrder: number;
	priceIdr: number;
	compareAtPriceIdr: number | null;
	stockQuantity: number;
	reservedQuantity: number;
};

type MediaAggregationRow = {
	id: string;
	colorName: string | null;
	url: string;
	altText: string;
	mediaType: "image" | "video";
	isPrimary: boolean;
	sortOrder: number;
};

function getPgErrorDetails(err: unknown): {
	code?: string;
	constraint?: string;
} {
	if (!err || typeof err !== "object") {
		return {};
	}
	const record = err as {
		code?: unknown;
		constraint?: unknown;
		cause?: unknown;
	};
	if (typeof record.code === "string") {
		return {
			code: record.code,
			constraint:
				typeof record.constraint === "string" ? record.constraint : undefined,
		};
	}
	if (record.cause && typeof record.cause === "object") {
		const cause = record.cause as { code?: unknown; constraint?: unknown };
		return {
			code: typeof cause.code === "string" ? cause.code : undefined,
			constraint:
				typeof cause.constraint === "string" ? cause.constraint : undefined,
		};
	}
	return {};
}

function mapProductWriteError(err: unknown): never {
	if (err instanceof HTTPException) {
		throw err;
	}
	const { code, constraint } = getPgErrorDetails(err);
	if (code === "23505") {
		const uniqueMessages: Record<string, string> = {
			products_slug_uq: "Slug produk sudah digunakan oleh produk lain.",
			products_parent_sku_uq: "Parent SKU sudah terdaftar di katalog.",
			product_variants_sku_uq:
				"Salah satu SKU varian sudah terdaftar di katalog.",
		};
		throw new HTTPException(409, {
			message:
				(constraint && uniqueMessages[constraint]) ||
				"Data produk atau varian duplikat terdeteksi.",
		});
	}
	throw err;
}

/**
 * Aggregates variant price ranges, color swatches, ordered sizes,
 * and available stock in O(N) for both PLP listings and PDP details.
 */
function aggregateVariantsAndMedia(
	basePriceIdr: number,
	variants: readonly VariantAggregationRow[],
	media: readonly MediaAggregationRow[],
) {
	let minPriceIdr = variants[0]?.priceIdr ?? basePriceIdr;
	let maxPriceIdr = variants[0]?.priceIdr ?? basePriceIdr;
	let compareAtMinPriceIdr: number | null = null;
	let totalAvailableStock = 0;

	const colorMap = new Map<
		string,
		{ colorName: string; colorHex: string; inStock: boolean }
	>();
	const sizeMap = new Map<string, number>();

	for (const variant of variants) {
		if (variant.priceIdr < minPriceIdr) minPriceIdr = variant.priceIdr;
		if (variant.priceIdr > maxPriceIdr) maxPriceIdr = variant.priceIdr;

		if (
			variant.compareAtPriceIdr != null &&
			variant.compareAtPriceIdr > variant.priceIdr &&
			(compareAtMinPriceIdr === null ||
				variant.compareAtPriceIdr < compareAtMinPriceIdr)
		) {
			compareAtMinPriceIdr = variant.compareAtPriceIdr;
		}

		const available = Math.max(
			0,
			variant.stockQuantity - variant.reservedQuantity,
		);
		totalAvailableStock += available;

		const colorKey = variant.colorName.toLowerCase();
		const existingColor = colorMap.get(colorKey);
		if (!existingColor) {
			colorMap.set(colorKey, {
				colorName: variant.colorName,
				colorHex: variant.colorHex,
				inStock: available > 0,
			});
		} else if (available > 0) {
			existingColor.inStock = true;
		}

		if (!sizeMap.has(variant.sizeLabel)) {
			sizeMap.set(variant.sizeLabel, variant.sizeSortOrder);
		}
	}

	const imageMedia = media.filter((m) => m.mediaType === "image");
	const mediaPool = imageMedia.length > 0 ? imageMedia : media;

	const primaryImage = mediaPool[0] ?? null;
	const hoverImage =
		mediaPool.find(
			(m) =>
				m.id !== primaryImage?.id &&
				m.colorName &&
				primaryImage?.colorName &&
				m.colorName.toLowerCase() === primaryImage.colorName.toLowerCase(),
		) ??
		mediaPool.find((m) => m.id !== primaryImage?.id) ??
		null;

	const colors: ProductColorSummary[] = Array.from(colorMap.values()).map(
		(color) => {
			const colorMedia = mediaPool.filter(
				(m) => m.colorName?.toLowerCase() === color.colorName.toLowerCase(),
			);
			const colorPrimary = colorMedia[0] ?? primaryImage;
			const colorHover =
				colorMedia[1] ??
				(hoverImage && hoverImage.id !== colorPrimary?.id ? hoverImage : null);

			return {
				colorName: color.colorName,
				colorHex: color.colorHex,
				inStock: color.inStock,
				primaryImageUrl: colorPrimary?.url ?? null,
				hoverImageUrl: colorHover?.url ?? null,
			};
		},
	);

	const sizes = Array.from(sizeMap.entries())
		.sort((a, b) => a[1] - b[1])
		.map(([label]) => label);

	return {
		priceRange: {
			minPriceIdr,
			maxPriceIdr,
			compareAtMinPriceIdr,
		},
		colors,
		sizes,
		totalAvailableStock,
		inStock: totalAvailableStock > 0,
		primaryImage,
		hoverImage,
	};
}

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveCategoryIds(
	database: Database,
	categorySlugOrId: string,
	activeOnly = true,
): Promise<string[] | null> {
	const matchFilter = UUID_REGEX.test(categorySlugOrId)
		? eq(categories.id, categorySlugOrId)
		: eq(categories.slug, categorySlugOrId);

	const [matched] = await database
		.select({ id: categories.id })
		.from(categories)
		.where(
			activeOnly
				? and(matchFilter, eq(categories.isActive, true))
				: matchFilter,
		)
		.limit(1);

	if (!matched) {
		return null;
	}

	const childRows = await database
		.select({ id: categories.id })
		.from(categories)
		.where(
			activeOnly
				? and(
						eq(categories.parentId, matched.id),
						eq(categories.isActive, true),
					)
				: eq(categories.parentId, matched.id),
		);

	return [matched.id, ...childRows.map((c) => c.id)];
}

function buildProductSearchPredicate(
	database: Database,
	search: string,
	activeVariantsOnly = true,
): SQL | undefined {
	const pattern = `%${escapeLikePattern(search)}%`;
	const variantConditions: SQL[] = [
		eq(productVariants.productId, products.id),
		ilike(productVariants.sku, pattern),
	];
	if (activeVariantsOnly) {
		variantConditions.push(eq(productVariants.isActive, true));
	}

	return or(
		ilike(products.name, pattern),
		ilike(products.brand, pattern),
		ilike(products.parentSku, pattern),
		ilike(products.description, pattern),
		exists(
			database
				.select({ one: sql`1` })
				.from(productVariants)
				.where(and(...variantConditions)),
		),
	);
}

function buildProductWhereClause(
	database: Database,
	filter: CatalogFilter,
	categoryIds?: string[],
): SQL | undefined {
	const conditions: SQL[] = [eq(products.status, "published")];

	if (categoryIds) {
		conditions.push(inArray(products.categoryId, categoryIds));
	}

	if (filter.collection) {
		conditions.push(
			exists(
				database
					.select({ one: sql`1` })
					.from(productCollections)
					.innerJoin(
						collections,
						eq(collections.id, productCollections.collectionId),
					)
					.where(
						and(
							eq(productCollections.productId, products.id),
							eq(collections.slug, filter.collection),
							eq(collections.isActive, true),
						),
					),
			),
		);
	}

	if (filter.genderAudience) {
		conditions.push(eq(products.genderAudience, filter.genderAudience));
	}

	if (filter.search) {
		const searchPredicate = buildProductSearchPredicate(
			database,
			filter.search,
			true,
		);
		if (searchPredicate) {
			conditions.push(searchPredicate);
		}
	}

	const variantConditions: SQL[] = [
		eq(productVariants.productId, products.id),
		eq(productVariants.isActive, true),
	];

	if (filter.size && filter.size.length > 0) {
		variantConditions.push(
			inArray(
				sql`lower(${productVariants.sizeLabel})`,
				filter.size.map((s) => s.toLowerCase()),
			),
		);
	}

	if (filter.color && filter.color.length > 0) {
		variantConditions.push(
			inArray(
				sql`lower(${productVariants.colorName})`,
				filter.color.map((c) => c.toLowerCase()),
			),
		);
	}

	if (filter.minPrice !== undefined) {
		variantConditions.push(gte(productVariants.priceIdr, filter.minPrice));
	}

	if (filter.maxPrice !== undefined) {
		variantConditions.push(lte(productVariants.priceIdr, filter.maxPrice));
	}

	if (filter.inStock === true) {
		variantConditions.push(
			sql`(${productVariants.stockQuantity} - ${productVariants.reservedQuantity}) > 0`,
		);
	}

	// Enforce unified variant predicate so combined variant filters match the same SKU
	if (variantConditions.length > 2) {
		conditions.push(
			exists(
				database
					.select({ one: sql`1` })
					.from(productVariants)
					.where(and(...variantConditions)),
			),
		);
	}

	return and(...conditions);
}

const minVariantPriceSql = sql<number>`COALESCE(
	(
		SELECT MIN(${productVariants.priceIdr})
		FROM ${productVariants}
		WHERE ${productVariants.productId} = ${products.id}
		AND ${productVariants.isActive} = true
	),
	${products.basePriceIdr}
)`;

function resolveProductOrderBy(sort: CatalogSortOption): SQL[] {
	const popularityScoreSql = sql<number>`COALESCE(
		(
			SELECT SUM(${orderItems.quantity})
			FROM ${orderItems}
			INNER JOIN ${orders} ON ${orders.id} = ${orderItems.orderId}
			INNER JOIN ${productVariants} ON ${productVariants.id} = ${orderItems.variantId}
			WHERE ${productVariants.productId} = ${products.id}
			AND ${orders.orderStatus} NOT IN ('cancelled', 'returned')
		),
		0
	)`;

	const publishedRecencySql = sql`COALESCE(${products.publishedAt}, ${products.createdAt})`;

	const sortMap: Record<CatalogSortOption, SQL[]> = {
		newest: [desc(publishedRecencySql), desc(products.id)],
		price_asc: [asc(minVariantPriceSql), asc(products.id)],
		price_desc: [desc(minVariantPriceSql), desc(products.id)],
		popularity: [
			desc(popularityScoreSql),
			desc(publishedRecencySql),
			desc(products.id),
		],
	};

	return sortMap[sort];
}

function resolveAdminProductOrderBy(sort: AdminProductSortOption): SQL[] {
	const totalStockSql = sql<number>`COALESCE(
		(
			SELECT SUM(GREATEST(0, ${productVariants.stockQuantity} - ${productVariants.reservedQuantity}))
			FROM ${productVariants}
			WHERE ${productVariants.productId} = ${products.id}
			AND ${productVariants.isActive} = true
		),
		0
	)`;

	const sortMap: Record<AdminProductSortOption, SQL[]> = {
		updated_desc: [desc(products.updatedAt), desc(products.id)],
		newest: [desc(products.createdAt), desc(products.id)],
		price_asc: [asc(minVariantPriceSql), asc(products.id)],
		price_desc: [desc(minVariantPriceSql), desc(products.id)],
		stock_asc: [asc(totalStockSql), asc(products.id)],
		stock_desc: [desc(totalStockSql), desc(products.id)],
	};

	return sortMap[sort];
}

async function fetchProductEnrichment(
	database: Database,
	productIds: string[],
) {
	const [variantRows, mediaRows] = await Promise.all([
		database
			.select({
				productId: productVariants.productId,
				colorName: productVariants.colorName,
				colorHex: productVariants.colorHex,
				sizeLabel: productVariants.sizeLabel,
				sizeSortOrder: productVariants.sizeSortOrder,
				priceIdr: productVariants.priceIdr,
				compareAtPriceIdr: productVariants.compareAtPriceIdr,
				stockQuantity: productVariants.stockQuantity,
				reservedQuantity: productVariants.reservedQuantity,
			})
			.from(productVariants)
			.where(
				and(
					inArray(productVariants.productId, productIds),
					eq(productVariants.isActive, true),
				),
			)
			.orderBy(
				asc(productVariants.sizeSortOrder),
				asc(productVariants.colorName),
			),
		database
			.select({
				id: productMedia.id,
				productId: productMedia.productId,
				colorName: productMedia.colorName,
				url: productMedia.url,
				altText: productMedia.altText,
				mediaType: productMedia.mediaType,
				isPrimary: productMedia.isPrimary,
				sortOrder: productMedia.sortOrder,
			})
			.from(productMedia)
			.where(inArray(productMedia.productId, productIds))
			.orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder)),
	]);

	const variantsByProduct = new Map<string, VariantAggregationRow[]>();
	for (const variant of variantRows) {
		const bucket = variantsByProduct.get(variant.productId);
		if (bucket) {
			bucket.push(variant);
		} else {
			variantsByProduct.set(variant.productId, [variant]);
		}
	}

	const mediaByProduct = new Map<string, MediaAggregationRow[]>();
	for (const media of mediaRows) {
		const bucket = mediaByProduct.get(media.productId);
		if (bucket) {
			bucket.push(media);
		} else {
			mediaByProduct.set(media.productId, [media]);
		}
	}

	return { variantsByProduct, mediaByProduct };
}

type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

async function validateProductRelations(
	tx: DbTransaction,
	categoryId: string,
	sizeGuideId: string | null | undefined,
	collectionIds: readonly string[],
) {
	const [category] = await tx
		.select({ id: categories.id })
		.from(categories)
		.where(eq(categories.id, categoryId))
		.limit(1);

	if (!category) {
		throw new HTTPException(400, {
			message: "Kategori produk tidak ditemukan.",
		});
	}

	if (sizeGuideId) {
		const [sizeGuide] = await tx
			.select({ id: sizeGuides.id })
			.from(sizeGuides)
			.where(eq(sizeGuides.id, sizeGuideId))
			.limit(1);

		if (!sizeGuide) {
			throw new HTTPException(400, {
				message: "Panduan ukuran tidak ditemukan.",
			});
		}
	}

	if (collectionIds.length > 0) {
		const foundCollections = await tx
			.select({ id: collections.id })
			.from(collections)
			.where(inArray(collections.id, [...collectionIds]));

		if (foundCollections.length !== collectionIds.length) {
			throw new HTTPException(400, {
				message: "Satu atau lebih koleksi tidak ditemukan.",
			});
		}
	}
}

export function createCatalogService(deps: CatalogServiceDeps = {}) {
	const database = deps.db ?? db;

	return {
		async listProducts(filter: CatalogFilter): Promise<ProductListResponse> {
			let categoryIds: string[] | undefined;
			if (filter.category) {
				const resolved = await resolveCategoryIds(database, filter.category);
				if (!resolved) {
					return {
						items: [],
						pagination: buildPaginationMeta(filter.page, filter.limit, 0),
					};
				}
				categoryIds = resolved;
			}

			const whereClause = buildProductWhereClause(
				database,
				filter,
				categoryIds,
			);
			const orderByColumns = resolveProductOrderBy(filter.sort);
			const offset = (filter.page - 1) * filter.limit;

			const [countRows, productRows] = await Promise.all([
				database.select({ total: count() }).from(products).where(whereClause),
				database
					.select({
						id: products.id,
						slug: products.slug,
						parentSku: products.parentSku,
						name: products.name,
						brand: products.brand,
						genderAudience: products.genderAudience,
						fitType: products.fitType,
						basePriceIdr: products.basePriceIdr,
						publishedAt: products.publishedAt,
						categoryId: categories.id,
						categoryName: categories.name,
						categorySlug: categories.slug,
					})
					.from(products)
					.innerJoin(categories, eq(categories.id, products.categoryId))
					.where(whereClause)
					.orderBy(...orderByColumns)
					.limit(filter.limit)
					.offset(offset),
			]);

			const total = Number(countRows[0]?.total ?? 0);
			const pagination = buildPaginationMeta(filter.page, filter.limit, total);

			if (productRows.length === 0) {
				return { items: [], pagination };
			}

			const { variantsByProduct, mediaByProduct } =
				await fetchProductEnrichment(
					database,
					productRows.map((row) => row.id),
				);

			const items: ProductListItem[] = productRows.map((row) => {
				const summary = aggregateVariantsAndMedia(
					row.basePriceIdr,
					variantsByProduct.get(row.id) ?? [],
					mediaByProduct.get(row.id) ?? [],
				);

				return {
					id: row.id,
					slug: row.slug,
					parentSku: row.parentSku,
					name: row.name,
					brand: row.brand,
					genderAudience: row.genderAudience,
					fitType: row.fitType,
					basePriceIdr: row.basePriceIdr,
					publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
					category: {
						id: row.categoryId,
						name: row.categoryName,
						slug: row.categorySlug,
					},
					...summary,
				};
			});

			return { items, pagination };
		},

		async getProductBySlug(slug: string) {
			const product = await database.query.products.findFirst({
				where: {
					slug,
					status: "published",
				},
				with: {
					category: true,
					sizeGuide: true,
					variants: {
						where: { isActive: true },
						orderBy: { sizeSortOrder: "asc", colorName: "asc" },
					},
					media: {
						orderBy: { isPrimary: "desc", sortOrder: "asc" },
					},
					productCollections: {
						orderBy: { sortOrder: "asc" },
						with: {
							collection: true,
						},
					},
				},
			});

			if (!product) {
				throw new HTTPException(404, {
					message: `Produk dengan slug '${slug}' tidak ditemukan.`,
				});
			}

			const summary = aggregateVariantsAndMedia(
				product.basePriceIdr,
				product.variants,
				product.media,
			);

			return {
				id: product.id,
				categoryId: product.categoryId,
				sizeGuideId: product.sizeGuideId,
				parentSku: product.parentSku,
				name: product.name,
				slug: product.slug,
				brand: product.brand,
				description: product.description,
				genderAudience: product.genderAudience,
				materialComposition: product.materialComposition,
				careInstructions: product.careInstructions,
				fitType: product.fitType,
				basePriceIdr: product.basePriceIdr,
				status: product.status,
				publishedAt: product.publishedAt
					? product.publishedAt.toISOString()
					: null,
				createdAt: product.createdAt.toISOString(),
				updatedAt: product.updatedAt.toISOString(),
				category: product.category,
				sizeGuide: product.sizeGuide,
				collections: product.productCollections
					.map((pc) => pc.collection)
					.filter((c): c is NonNullable<typeof c> => Boolean(c?.isActive)),
				variants: product.variants.map((variant) => ({
					...variant,
					availableQuantity: Math.max(
						0,
						variant.stockQuantity - variant.reservedQuantity,
					),
					createdAt: variant.createdAt.toISOString(),
					updatedAt: variant.updatedAt.toISOString(),
				})),
				media: product.media.map((item) => ({
					...item,
					createdAt: item.createdAt.toISOString(),
				})),
				priceRange: summary.priceRange,
				colors: summary.colors,
				sizes: summary.sizes,
				totalAvailableStock: summary.totalAvailableStock,
				inStock: summary.inStock,
			};
		},

		async createAdminProduct(input: ProductInput, actor: CatalogActor) {
			const uniqueCollectionIds = Array.from(new Set(input.collectionIds));

			try {
				return await database.transaction(async (tx) => {
					await validateProductRelations(
						tx,
						input.categoryId,
						input.sizeGuideId,
						uniqueCollectionIds,
					);

					const now = new Date();
					const [createdProduct] = await tx
						.insert(products)
						.values({
							categoryId: input.categoryId,
							sizeGuideId: input.sizeGuideId ?? null,
							parentSku: input.parentSku,
							name: input.name,
							slug: input.slug,
							brand: input.brand,
							description: input.description,
							genderAudience: input.genderAudience,
							materialComposition: input.materialComposition ?? null,
							careInstructions: input.careInstructions ?? null,
							fitType: input.fitType ?? null,
							basePriceIdr: input.basePriceIdr,
							status: input.status,
							publishedAt: input.status === "published" ? now : null,
						})
						.returning();

					const insertedVariants = await tx
						.insert(productVariants)
						.values(
							input.variants.map((variant) => ({
								productId: createdProduct.id,
								sku: variant.sku,
								colorName: variant.colorName,
								colorHex: variant.colorHex,
								sizeLabel: variant.sizeLabel,
								sizeSortOrder: variant.sizeSortOrder,
								priceIdr: variant.priceIdr,
								compareAtPriceIdr: variant.compareAtPriceIdr ?? null,
								stockQuantity: variant.stockQuantity,
								reservedQuantity: 0,
								weightGrams: variant.weightGrams,
								lengthCm: variant.lengthCm,
								widthCm: variant.widthCm,
								heightCm: variant.heightCm,
								isActive: variant.isActive,
							})),
						)
						.returning();

					const initialStockMovements = insertedVariants
						.filter((variant) => variant.stockQuantity > 0)
						.map((variant) => ({
							variantId: variant.id,
							movementType: "restock" as const,
							quantityDelta: variant.stockQuantity,
							referenceType: "initial_import",
							referenceId: createdProduct.id,
							actorId: actor.id,
							notes: `Initial stock import on product creation (${variant.sku})`,
						}));

					if (initialStockMovements.length > 0) {
						await tx.insert(stockMovements).values(initialStockMovements);
					}

					const insertedMedia =
						input.media.length > 0
							? await tx
									.insert(productMedia)
									.values(
										input.media.map((media, index) => ({
											productId: createdProduct.id,
											colorName: media.colorName ?? null,
											url: media.url,
											altText: media.altText,
											mediaType: media.mediaType,
											isPrimary: media.isPrimary,
											sortOrder: media.sortOrder ?? index,
										})),
									)
									.returning()
							: [];

					if (uniqueCollectionIds.length > 0) {
						await tx.insert(productCollections).values(
							uniqueCollectionIds.map((collectionId, index) => ({
								productId: createdProduct.id,
								collectionId,
								sortOrder: index,
							})),
						);
					}

					return {
						product: {
							...createdProduct,
							publishedAt: createdProduct.publishedAt
								? createdProduct.publishedAt.toISOString()
								: null,
							createdAt: createdProduct.createdAt.toISOString(),
							updatedAt: createdProduct.updatedAt.toISOString(),
							variants: insertedVariants.map((v) => ({
								...v,
								availableQuantity: v.stockQuantity - v.reservedQuantity,
								createdAt: v.createdAt.toISOString(),
								updatedAt: v.updatedAt.toISOString(),
							})),
							media: insertedMedia.map((m) => ({
								...m,
								createdAt: m.createdAt.toISOString(),
							})),
							collectionIds: uniqueCollectionIds,
						},
					};
				});
			} catch (err) {
				mapProductWriteError(err);
			}
		},

		async listAdminProducts(
			filter: AdminCatalogFilter,
		): Promise<AdminProductListResponse> {
			let categoryIds: string[] | undefined;
			if (filter.category) {
				const resolved = await resolveCategoryIds(
					database,
					filter.category,
					false,
				);
				if (!resolved) {
					return {
						items: [],
						pagination: buildPaginationMeta(filter.page, filter.limit, 0),
					};
				}
				categoryIds = resolved;
			}

			const conditions: SQL[] = [];
			if (categoryIds) {
				conditions.push(inArray(products.categoryId, categoryIds));
			}
			if (filter.status) {
				conditions.push(eq(products.status, filter.status));
			}
			if (filter.search) {
				const searchPredicate = buildProductSearchPredicate(
					database,
					filter.search,
					false,
				);
				if (searchPredicate) {
					conditions.push(searchPredicate);
				}
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;
			const orderByColumns = resolveAdminProductOrderBy(filter.sort);
			const offset = (filter.page - 1) * filter.limit;

			const [countRows, productRows] = await Promise.all([
				database.select({ total: count() }).from(products).where(whereClause),
				database
					.select({
						id: products.id,
						slug: products.slug,
						parentSku: products.parentSku,
						name: products.name,
						brand: products.brand,
						genderAudience: products.genderAudience,
						fitType: products.fitType,
						basePriceIdr: products.basePriceIdr,
						status: products.status,
						publishedAt: products.publishedAt,
						createdAt: products.createdAt,
						updatedAt: products.updatedAt,
						categoryId: categories.id,
						categoryName: categories.name,
						categorySlug: categories.slug,
					})
					.from(products)
					.innerJoin(categories, eq(categories.id, products.categoryId))
					.where(whereClause)
					.orderBy(...orderByColumns)
					.limit(filter.limit)
					.offset(offset),
			]);

			const total = Number(countRows[0]?.total ?? 0);
			const pagination = buildPaginationMeta(filter.page, filter.limit, total);

			if (productRows.length === 0) {
				return { items: [], pagination };
			}

			const { variantsByProduct, mediaByProduct } =
				await fetchProductEnrichment(
					database,
					productRows.map((row) => row.id),
				);

			const items: AdminProductListItem[] = productRows.map((row) => {
				const activeVariants = variantsByProduct.get(row.id) ?? [];
				const summary = aggregateVariantsAndMedia(
					row.basePriceIdr,
					activeVariants,
					mediaByProduct.get(row.id) ?? [],
				);

				return {
					id: row.id,
					slug: row.slug,
					parentSku: row.parentSku,
					name: row.name,
					brand: row.brand,
					genderAudience: row.genderAudience,
					fitType: row.fitType,
					basePriceIdr: row.basePriceIdr,
					status: row.status,
					publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
					createdAt: row.createdAt.toISOString(),
					updatedAt: row.updatedAt.toISOString(),
					category: {
						id: row.categoryId,
						name: row.categoryName,
						slug: row.categorySlug,
					},
					priceRange: summary.priceRange,
					variantCount: activeVariants.length,
					totalAvailableStock: summary.totalAvailableStock,
					inStock: summary.inStock,
					primaryImage: summary.primaryImage,
				};
			});

			return { items, pagination };
		},

		async getAdminProductById(id: string) {
			const product = await database.query.products.findFirst({
				where: { id },
				with: {
					category: true,
					sizeGuide: true,
					variants: {
						where: { isActive: true },
						orderBy: { sizeSortOrder: "asc", colorName: "asc" },
					},
					media: {
						orderBy: { isPrimary: "desc", sortOrder: "asc" },
					},
					productCollections: {
						orderBy: { sortOrder: "asc" },
						with: {
							collection: true,
						},
					},
				},
			});

			if (!product) {
				throw new HTTPException(404, {
					message: "Produk tidak ditemukan.",
				});
			}

			return {
				id: product.id,
				categoryId: product.categoryId,
				sizeGuideId: product.sizeGuideId,
				parentSku: product.parentSku,
				name: product.name,
				slug: product.slug,
				brand: product.brand,
				description: product.description,
				genderAudience: product.genderAudience,
				materialComposition: product.materialComposition,
				careInstructions: product.careInstructions,
				fitType: product.fitType,
				basePriceIdr: product.basePriceIdr,
				status: product.status,
				publishedAt: product.publishedAt
					? product.publishedAt.toISOString()
					: null,
				createdAt: product.createdAt.toISOString(),
				updatedAt: product.updatedAt.toISOString(),
				category: product.category,
				sizeGuide: product.sizeGuide,
				collectionIds: product.productCollections.map((pc) => pc.collectionId),
				variants: product.variants.map((variant) => ({
					...variant,
					availableQuantity: Math.max(
						0,
						variant.stockQuantity - variant.reservedQuantity,
					),
					createdAt: variant.createdAt.toISOString(),
					updatedAt: variant.updatedAt.toISOString(),
				})),
				media: product.media.map((item) => ({
					...item,
					createdAt: item.createdAt.toISOString(),
				})),
			};
		},

		async updateAdminProduct(
			id: string,
			input: ProductAdminUpdateInput,
			actor: CatalogActor,
		) {
			const uniqueCollectionIds = Array.from(new Set(input.collectionIds));

			try {
				return await database.transaction(async (tx) => {
					const [existingProduct] = await tx
						.select()
						.from(products)
						.where(eq(products.id, id))
						.limit(1);

					if (!existingProduct) {
						throw new HTTPException(404, {
							message: "Produk tidak ditemukan.",
						});
					}

					await validateProductRelations(
						tx,
						input.categoryId,
						input.sizeGuideId,
						uniqueCollectionIds,
					);

					const now = new Date();
					const publishedAt =
						input.status === "published"
							? (existingProduct.publishedAt ?? now)
							: existingProduct.publishedAt;

					const [updatedProduct] = await tx
						.update(products)
						.set({
							categoryId: input.categoryId,
							sizeGuideId: input.sizeGuideId ?? null,
							parentSku: input.parentSku,
							name: input.name,
							slug: input.slug,
							brand: input.brand,
							description: input.description,
							genderAudience: input.genderAudience,
							materialComposition: input.materialComposition ?? null,
							careInstructions: input.careInstructions ?? null,
							fitType: input.fitType ?? null,
							basePriceIdr: input.basePriceIdr,
							status: input.status,
							publishedAt,
							updatedAt: now,
						})
						.where(eq(products.id, id))
						.returning();

					const existingVariants = await tx
						.select()
						.from(productVariants)
						.where(eq(productVariants.productId, id))
						.orderBy(asc(productVariants.id))
						.for("update");

					const existingById = new Map(existingVariants.map((v) => [v.id, v]));
					const existingByColorSize = new Map(
						existingVariants.map((v) => [
							`${v.colorName.toLowerCase()}::${v.sizeLabel.toUpperCase()}`,
							v,
						]),
					);
					const existingBySku = new Map(
						existingVariants.map((v) => [v.sku.toUpperCase(), v]),
					);

					const matchedExistingIds = new Set<string>();
					const persistedVariants: (typeof productVariants.$inferSelect)[] = [];

					for (const variantInput of input.variants) {
						const colorSizeKey = `${variantInput.colorName.toLowerCase()}::${variantInput.sizeLabel.toUpperCase()}`;
						const candidate =
							(variantInput.id
								? existingById.get(variantInput.id)
								: undefined) ??
							existingByColorSize.get(colorSizeKey) ??
							existingBySku.get(variantInput.sku.toUpperCase());

						if (candidate && !matchedExistingIds.has(candidate.id)) {
							matchedExistingIds.add(candidate.id);
							if (variantInput.stockQuantity < candidate.reservedQuantity) {
								throw new HTTPException(409, {
									message: `Stok SKU '${variantInput.sku}' (${variantInput.stockQuantity}) lebih kecil dari stok tereservasi (${candidate.reservedQuantity}).`,
								});
							}

							const [updatedVariant] = await tx
								.update(productVariants)
								.set({
									sku: variantInput.sku,
									colorName: variantInput.colorName,
									colorHex: variantInput.colorHex,
									sizeLabel: variantInput.sizeLabel,
									sizeSortOrder: variantInput.sizeSortOrder,
									priceIdr: variantInput.priceIdr,
									compareAtPriceIdr: variantInput.compareAtPriceIdr ?? null,
									stockQuantity: variantInput.stockQuantity,
									weightGrams: variantInput.weightGrams,
									lengthCm: variantInput.lengthCm,
									widthCm: variantInput.widthCm,
									heightCm: variantInput.heightCm,
									isActive: variantInput.isActive,
									updatedAt: now,
								})
								.where(eq(productVariants.id, candidate.id))
								.returning();

							persistedVariants.push(updatedVariant);

							const delta =
								variantInput.stockQuantity - candidate.stockQuantity;
							if (delta !== 0) {
								await tx.insert(stockMovements).values({
									variantId: candidate.id,
									movementType: "manual_adjust",
									quantityDelta: delta,
									referenceType: "admin_product_edit",
									referenceId: id,
									actorId: actor.id,
									notes: `Stock updated via product edit (${variantInput.sku})`,
								});
							}
						} else {
							const [insertedVariant] = await tx
								.insert(productVariants)
								.values({
									productId: id,
									sku: variantInput.sku,
									colorName: variantInput.colorName,
									colorHex: variantInput.colorHex,
									sizeLabel: variantInput.sizeLabel,
									sizeSortOrder: variantInput.sizeSortOrder,
									priceIdr: variantInput.priceIdr,
									compareAtPriceIdr: variantInput.compareAtPriceIdr ?? null,
									stockQuantity: variantInput.stockQuantity,
									reservedQuantity: 0,
									weightGrams: variantInput.weightGrams,
									lengthCm: variantInput.lengthCm,
									widthCm: variantInput.widthCm,
									heightCm: variantInput.heightCm,
									isActive: variantInput.isActive,
								})
								.returning();

							persistedVariants.push(insertedVariant);

							if (insertedVariant.stockQuantity > 0) {
								await tx.insert(stockMovements).values({
									variantId: insertedVariant.id,
									movementType: "restock",
									quantityDelta: insertedVariant.stockQuantity,
									referenceType: "product_edit_add",
									referenceId: id,
									actorId: actor.id,
									notes: `Initial stock on variant add (${insertedVariant.sku})`,
								});
							}
						}
					}

					for (const existingVariant of existingVariants) {
						if (!matchedExistingIds.has(existingVariant.id)) {
							if (existingVariant.reservedQuantity > 0) {
								throw new HTTPException(409, {
									message: `Varian SKU '${existingVariant.sku}' memiliki stok tereservasi (${existingVariant.reservedQuantity}) dan tidak dapat dinonaktifkan.`,
								});
							}
							if (existingVariant.isActive) {
								await tx
									.update(productVariants)
									.set({ isActive: false, updatedAt: now })
									.where(eq(productVariants.id, existingVariant.id));
							}
						}
					}

					await tx.delete(productMedia).where(eq(productMedia.productId, id));

					const insertedMedia =
						input.media.length > 0
							? await tx
									.insert(productMedia)
									.values(
										input.media.map((media, index) => ({
											productId: id,
											colorName: media.colorName ?? null,
											url: media.url,
											altText: media.altText,
											mediaType: media.mediaType,
											isPrimary: media.isPrimary,
											sortOrder: media.sortOrder ?? index,
										})),
									)
									.returning()
							: [];

					await tx
						.delete(productCollections)
						.where(eq(productCollections.productId, id));

					if (uniqueCollectionIds.length > 0) {
						await tx.insert(productCollections).values(
							uniqueCollectionIds.map((collectionId, index) => ({
								productId: id,
								collectionId,
								sortOrder: index,
							})),
						);
					}

					return {
						product: {
							...updatedProduct,
							publishedAt: updatedProduct.publishedAt
								? updatedProduct.publishedAt.toISOString()
								: null,
							createdAt: updatedProduct.createdAt.toISOString(),
							updatedAt: updatedProduct.updatedAt.toISOString(),
							variants: persistedVariants.map((v) => ({
								...v,
								availableQuantity: v.stockQuantity - v.reservedQuantity,
								createdAt: v.createdAt.toISOString(),
								updatedAt: v.updatedAt.toISOString(),
							})),
							media: insertedMedia.map((m) => ({
								...m,
								createdAt: m.createdAt.toISOString(),
							})),
							collectionIds: uniqueCollectionIds,
						},
					};
				});
			} catch (err) {
				mapProductWriteError(err);
			}
		},

		async updateAdminProductStatus(id: string, status: ProductStatus) {
			const [existing] = await database
				.select({
					id: products.id,
					publishedAt: products.publishedAt,
				})
				.from(products)
				.where(eq(products.id, id))
				.limit(1);

			if (!existing) {
				throw new HTTPException(404, {
					message: "Produk tidak ditemukan.",
				});
			}

			const now = new Date();
			const [updated] = await database
				.update(products)
				.set({
					status,
					publishedAt:
						status === "published"
							? (existing.publishedAt ?? now)
							: existing.publishedAt,
					updatedAt: now,
				})
				.where(eq(products.id, id))
				.returning({
					id: products.id,
					status: products.status,
					publishedAt: products.publishedAt,
					updatedAt: products.updatedAt,
				});

			return {
				id: updated.id,
				status: updated.status,
				publishedAt: updated.publishedAt
					? updated.publishedAt.toISOString()
					: null,
				updatedAt: updated.updatedAt.toISOString(),
			};
		},

		async checkSkuAvailability(sku: string, excludeProductId?: string) {
			const normalized = sku.trim().toLowerCase();
			const conditions: SQL[] = [
				sql`lower(${productVariants.sku}) = ${normalized}`,
			];
			if (excludeProductId) {
				conditions.push(ne(productVariants.productId, excludeProductId));
			}

			const [existing] = await database
				.select({ id: productVariants.id })
				.from(productVariants)
				.where(and(...conditions))
				.limit(1);

			return {
				sku: sku.trim(),
				available: !existing,
			};
		},

		async listSizeGuides() {
			const rows = await database
				.select({
					id: sizeGuides.id,
					name: sizeGuides.name,
					garmentType: sizeGuides.garmentType,
					measurementsJson: sizeGuides.measurementsJson,
					modelNote: sizeGuides.modelNote,
				})
				.from(sizeGuides)
				.orderBy(asc(sizeGuides.name));

			return { sizeGuides: rows };
		},

		async listCategories() {
			const rows = await database
				.select({
					id: categories.id,
					parentId: categories.parentId,
					name: categories.name,
					slug: categories.slug,
					description: categories.description,
					imageUrl: categories.imageUrl,
					sortOrder: categories.sortOrder,
				})
				.from(categories)
				.where(eq(categories.isActive, true))
				.orderBy(asc(categories.sortOrder), asc(categories.name));

			return { categories: rows };
		},

		async listCollections() {
			const rows = await database
				.select({
					id: collections.id,
					name: collections.name,
					slug: collections.slug,
					subtitle: collections.subtitle,
					bannerUrl: collections.bannerUrl,
					startsAt: collections.startsAt,
					endsAt: collections.endsAt,
				})
				.from(collections)
				.where(eq(collections.isActive, true))
				.orderBy(desc(collections.startsAt), asc(collections.name));

			return {
				collections: rows.map((row) => ({
					...row,
					startsAt: row.startsAt ? row.startsAt.toISOString() : null,
					endsAt: row.endsAt ? row.endsAt.toISOString() : null,
				})),
			};
		},
	};
}

export const catalogService = createCatalogService();
export type CatalogService = ReturnType<typeof createCatalogService>;
export type ProductDetail = Awaited<
	ReturnType<CatalogService["getProductBySlug"]>
>;
