import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { type Database, db } from "@/db";
import { users } from "@/db/schema/auth";
import { products, productVariants, stockMovements } from "@/db/schema/catalog";
import type { Role } from "@/lib/auth-access";
import type {
	InventoryFilter,
	StockAdjustmentInput,
	StockMovementFilter,
} from "@/shared/schemas/inventory";
import { buildPaginationMeta, escapeLikePattern } from "../lib/query-utils";

export interface InventoryActor {
	id: string;
	role: Role;
}

export interface InventoryServiceDeps {
	db?: Database;
}

const LOW_STOCK_THRESHOLD = 5;

export function createInventoryService(deps: InventoryServiceDeps = {}) {
	const database = deps.db ?? db;

	return {
		async adjustStock(input: StockAdjustmentInput, actor: InventoryActor) {
			return database.transaction(async (tx) => {
				const [variant] = await tx
					.select()
					.from(productVariants)
					.where(eq(productVariants.id, input.variantId))
					.for("update");

				if (!variant) {
					throw new HTTPException(404, {
						message: "Varian SKU tidak ditemukan.",
					});
				}

				const nextStockQuantity = variant.stockQuantity + input.quantityDelta;

				if (nextStockQuantity < 0) {
					throw new HTTPException(409, {
						message: `Penyesuaian stok ditolak: stok fisik (${variant.stockQuantity}) tidak mencukupi untuk pengurangan ${Math.abs(input.quantityDelta)}.`,
					});
				}

				if (nextStockQuantity < variant.reservedQuantity) {
					throw new HTTPException(409, {
						message: `Penyesuaian stok ditolak: stok fisik baru (${nextStockQuantity}) lebih kecil dari stok tereservasi (${variant.reservedQuantity}).`,
					});
				}

				const [updatedVariant] = await tx
					.update(productVariants)
					.set({
						stockQuantity: nextStockQuantity,
						updatedAt: new Date(),
					})
					.where(eq(productVariants.id, variant.id))
					.returning();

				const [createdMovement] = await tx
					.insert(stockMovements)
					.values({
						variantId: variant.id,
						movementType: input.movementType,
						quantityDelta: input.quantityDelta,
						referenceType: input.referenceType,
						referenceId: input.referenceId ?? null,
						actorId: actor.id,
						notes: input.notes,
					})
					.returning();

				return {
					variant: {
						...updatedVariant,
						availableQuantity:
							updatedVariant.stockQuantity - updatedVariant.reservedQuantity,
						createdAt: updatedVariant.createdAt.toISOString(),
						updatedAt: updatedVariant.updatedAt.toISOString(),
					},
					movement: {
						...createdMovement,
						createdAt: createdMovement.createdAt.toISOString(),
					},
				};
			});
		},

		async listInventory(filter: InventoryFilter) {
			const availableExpr = sql<number>`(${productVariants.stockQuantity} - ${productVariants.reservedQuantity})`;
			const conditions = [];

			if (filter.search) {
				const pattern = `%${escapeLikePattern(filter.search)}%`;
				const searchPredicate = or(
					ilike(productVariants.sku, pattern),
					ilike(productVariants.colorName, pattern),
					ilike(products.name, pattern),
					ilike(products.parentSku, pattern),
				);
				if (searchPredicate) {
					conditions.push(searchPredicate);
				}
			}

			if (filter.stockStatus === "out_of_stock") {
				conditions.push(sql`${availableExpr} <= 0`);
			} else if (filter.stockStatus === "low_stock") {
				conditions.push(
					sql`${availableExpr} > 0 AND ${availableExpr} < ${LOW_STOCK_THRESHOLD}`,
				);
			} else if (filter.stockStatus === "in_stock") {
				conditions.push(sql`${availableExpr} >= ${LOW_STOCK_THRESHOLD}`);
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;
			const offset = (filter.page - 1) * filter.limit;

			const [countRows, rows] = await Promise.all([
				database
					.select({ total: count() })
					.from(productVariants)
					.innerJoin(products, eq(products.id, productVariants.productId))
					.where(whereClause),
				database
					.select({
						id: productVariants.id,
						productId: productVariants.productId,
						productName: products.name,
						productSlug: products.slug,
						productStatus: products.status,
						sku: productVariants.sku,
						colorName: productVariants.colorName,
						colorHex: productVariants.colorHex,
						sizeLabel: productVariants.sizeLabel,
						priceIdr: productVariants.priceIdr,
						stockQuantity: productVariants.stockQuantity,
						reservedQuantity: productVariants.reservedQuantity,
						weightGrams: productVariants.weightGrams,
						isActive: productVariants.isActive,
						updatedAt: productVariants.updatedAt,
					})
					.from(productVariants)
					.innerJoin(products, eq(products.id, productVariants.productId))
					.where(whereClause)
					.orderBy(asc(availableExpr), asc(productVariants.sku))
					.limit(filter.limit)
					.offset(offset),
			]);

			const total = Number(countRows[0]?.total ?? 0);

			return {
				items: rows.map((row) => ({
					...row,
					availableQuantity: Math.max(
						0,
						row.stockQuantity - row.reservedQuantity,
					),
					updatedAt: row.updatedAt.toISOString(),
				})),
				pagination: buildPaginationMeta(filter.page, filter.limit, total),
			};
		},

		async listStockMovements(filter: StockMovementFilter) {
			const conditions = [];

			if (filter.variantId) {
				conditions.push(eq(stockMovements.variantId, filter.variantId));
			}

			if (filter.movementType) {
				conditions.push(eq(stockMovements.movementType, filter.movementType));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;
			const offset = (filter.page - 1) * filter.limit;

			const [countRows, rows] = await Promise.all([
				database
					.select({ total: count() })
					.from(stockMovements)
					.where(whereClause),
				database
					.select({
						id: stockMovements.id,
						variantId: stockMovements.variantId,
						sku: productVariants.sku,
						colorName: productVariants.colorName,
						sizeLabel: productVariants.sizeLabel,
						movementType: stockMovements.movementType,
						quantityDelta: stockMovements.quantityDelta,
						referenceType: stockMovements.referenceType,
						referenceId: stockMovements.referenceId,
						actorId: stockMovements.actorId,
						actorName: users.name,
						actorEmail: users.email,
						notes: stockMovements.notes,
						createdAt: stockMovements.createdAt,
					})
					.from(stockMovements)
					.innerJoin(
						productVariants,
						eq(productVariants.id, stockMovements.variantId),
					)
					.leftJoin(users, eq(users.id, stockMovements.actorId))
					.where(whereClause)
					.orderBy(desc(stockMovements.createdAt), desc(stockMovements.id))
					.limit(filter.limit)
					.offset(offset),
			]);

			const total = Number(countRows[0]?.total ?? 0);

			return {
				items: rows.map((row) => ({
					...row,
					createdAt: row.createdAt.toISOString(),
				})),
				pagination: buildPaginationMeta(filter.page, filter.limit, total),
			};
		},
	};
}

export const inventoryService = createInventoryService();
export type InventoryService = ReturnType<typeof createInventoryService>;
