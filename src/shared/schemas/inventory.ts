import { z } from "zod";
import { createPaginationQueryShape } from "./catalog";

export const STOCK_MOVEMENT_TYPES = [
	"restock",
	"reserve",
	"release",
	"commit",
	"return_restock",
	"manual_adjust",
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const ADMIN_STOCK_ADJUSTMENT_TYPES = [
	"restock",
	"manual_adjust",
	"return_restock",
] as const;
export type AdminStockAdjustmentType =
	(typeof ADMIN_STOCK_ADJUSTMENT_TYPES)[number];

export const STOCK_REFERENCE_TYPES = [
	"order",
	"return_request",
	"manual",
	"initial_import",
	"system_expiry",
] as const;
export type StockReferenceType = (typeof STOCK_REFERENCE_TYPES)[number];

export const INVENTORY_STOCK_STATUSES = [
	"all",
	"in_stock",
	"low_stock",
	"out_of_stock",
] as const;
export type InventoryStockStatus = (typeof INVENTORY_STOCK_STATUSES)[number];

export const stockMovementTypeSchema = z.enum(STOCK_MOVEMENT_TYPES, {
	error:
		"Movement type must be one of: restock, reserve, release, commit, return_restock, or manual_adjust.",
});

export const adminStockAdjustmentTypeSchema = z.enum(
	ADMIN_STOCK_ADJUSTMENT_TYPES,
	{
		error:
			"Adjustment type must be one of: restock, manual_adjust, or return_restock.",
	},
);

export const stockReferenceTypeSchema = z.enum(STOCK_REFERENCE_TYPES, {
	error:
		"Reference type must be one of: order, return_request, manual, initial_import, or system_expiry.",
});

export const inventoryStockStatusSchema = z.enum(INVENTORY_STOCK_STATUSES, {
	error:
		"Stock status filter must be one of: all, in_stock, low_stock, or out_of_stock.",
});

const nonZeroIntDeltaSchema = z
	.int({ error: "Quantity delta must be a whole integer." })
	.refine((delta) => delta !== 0, {
		error: "Quantity delta cannot be zero.",
	});

export const stockAdjustmentSchema = z
	.object({
		variantId: z.uuid({ error: "Invalid variant ID." }),
		movementType: adminStockAdjustmentTypeSchema.default("manual_adjust"),
		quantityDelta: nonZeroIntDeltaSchema,
		notes: z
			.string()
			.trim()
			.min(3, "Adjustment reason must be at least 3 characters.")
			.max(500, "Adjustment notes must not exceed 500 characters."),
		referenceType: stockReferenceTypeSchema.default("manual"),
		referenceId: z
			.uuid({ error: "Invalid reference ID." })
			.nullable()
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (
			(data.movementType === "restock" ||
				data.movementType === "return_restock") &&
			data.quantityDelta <= 0
		) {
			ctx.addIssue({
				code: "custom",
				path: ["quantityDelta"],
				message: `Quantity delta must be positive for ${data.movementType}.`,
			});
		}
	});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type StockAdjustmentFormInput = z.input<typeof stockAdjustmentSchema>;

export const stockMovementCreateSchema = z.object({
	variantId: z.uuid({ error: "Invalid variant ID." }),
	movementType: stockMovementTypeSchema,
	quantityDelta: nonZeroIntDeltaSchema,
	referenceType: z
		.string()
		.trim()
		.min(1, "Reference type is required.")
		.max(30, "Reference type must not exceed 30 characters."),
	referenceId: z.uuid({ error: "Invalid reference ID." }).nullable().optional(),
	actorId: z.uuid({ error: "Invalid actor ID." }).nullable().optional(),
	notes: z
		.string()
		.trim()
		.max(500, "Notes must not exceed 500 characters.")
		.nullable()
		.optional(),
});

export type StockMovementCreateInput = z.infer<
	typeof stockMovementCreateSchema
>;

export const inventoryFilterSchema = z.object({
	search: z
		.string()
		.trim()
		.max(120, "Search query must not exceed 120 characters.")
		.optional(),
	stockStatus: inventoryStockStatusSchema.default("all"),
	...createPaginationQueryShape(25, 100),
});

export type InventoryFilter = z.infer<typeof inventoryFilterSchema>;

export const stockMovementFilterSchema = z.object({
	variantId: z.uuid({ error: "Invalid variant ID." }).optional(),
	movementType: stockMovementTypeSchema.optional(),
	...createPaginationQueryShape(25, 100),
});

export type StockMovementFilter = z.infer<typeof stockMovementFilterSchema>;
