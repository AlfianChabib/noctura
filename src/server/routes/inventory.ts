import { Hono, type MiddlewareHandler } from "hono";
import type { Role } from "@/lib/auth-access";
import {
	inventoryFilterSchema,
	stockAdjustmentSchema,
	stockMovementFilterSchema,
} from "@/shared/schemas/inventory";
import { type AuthEnv, requireRole } from "../middleware/auth";
import { zodValidator } from "../middleware/validate";
import {
	type InventoryService,
	inventoryService,
} from "../services/inventory.service";

export interface InventoryRouteOptions {
	service?: InventoryService;
	readMiddleware?: MiddlewareHandler<AuthEnv>;
	adjustMiddleware?: MiddlewareHandler<AuthEnv>;
}

export function createInventoryRoute({
	service = inventoryService,
	readMiddleware = requireRole(["warehouse_staff", "merchandiser", "cs_staff"]),
	adjustMiddleware = requireRole(["warehouse_staff"]),
}: InventoryRouteOptions = {}) {
	return new Hono<AuthEnv>()
		.get(
			"/",
			readMiddleware,
			zodValidator("query", inventoryFilterSchema),
			async (c) => {
				const filter = c.req.valid("query");
				const result = await service.listInventory(filter);
				return c.json(result, 200);
			},
		)
		.get(
			"/movements",
			readMiddleware,
			zodValidator("query", stockMovementFilterSchema),
			async (c) => {
				const filter = c.req.valid("query");
				const result = await service.listStockMovements(filter);
				return c.json(result, 200);
			},
		)
		.patch(
			"/adjust",
			adjustMiddleware,
			zodValidator("json", stockAdjustmentSchema),
			async (c) => {
				const user = c.get("user");
				const payload = c.req.valid("json");
				const result = await service.adjustStock(payload, {
					id: user.id,
					role: (user.role as Role) || "customer",
				});
				return c.json(result, 200);
			},
		);
}

export const inventoryRoute = createInventoryRoute();
