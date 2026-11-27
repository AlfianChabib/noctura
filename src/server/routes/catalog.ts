import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod";
import type { Role } from "@/lib/auth-access";
import {
	adminCatalogFilterSchema,
	adminProductStatusUpdateSchema,
	catalogFilterSchema,
	productAdminUpdateSchema,
	productInputSchema,
	skuAvailabilityQuerySchema,
} from "@/shared/schemas/catalog";
import { type AuthEnv, requireRole } from "../middleware/auth";
import { zodValidator } from "../middleware/validate";
import {
	type CatalogService,
	catalogService,
} from "../services/catalog.service";

const productSlugParamSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1, "Product slug is required.")
		.max(220, "Product slug must not exceed 220 characters."),
});

const productIdParamSchema = z.object({
	id: z.uuid({ error: "Invalid product ID." }),
});

export interface CatalogRouteOptions {
	service?: CatalogService;
	merchandiserMiddleware?: MiddlewareHandler<AuthEnv>;
}

export function createCatalogRoute({
	service = catalogService,
	merchandiserMiddleware = requireRole(["merchandiser"]),
}: CatalogRouteOptions = {}) {
	return new Hono<AuthEnv>()
		.get("/products", zodValidator("query", catalogFilterSchema), async (c) => {
			const filter = c.req.valid("query");
			const result = await service.listProducts(filter);
			return c.json(result, 200);
		})
		.get(
			"/products/:slug",
			zodValidator("param", productSlugParamSchema),
			async (c) => {
				const { slug } = c.req.valid("param");
				const product = await service.getProductBySlug(slug);
				return c.json(product, 200);
			},
		)
		.get("/categories", async (c) => {
			const result = await service.listCategories();
			return c.json(result, 200);
		})
		.get("/collections", async (c) => {
			const result = await service.listCollections();
			return c.json(result, 200);
		})
		.get("/size-guides", async (c) => {
			const result = await service.listSizeGuides();
			return c.json(result, 200);
		})
		.get(
			"/admin/products",
			merchandiserMiddleware,
			zodValidator("query", adminCatalogFilterSchema),
			async (c) => {
				const filter = c.req.valid("query");
				const result = await service.listAdminProducts(filter);
				return c.json(result, 200);
			},
		)
		.get(
			"/admin/products/check-sku",
			merchandiserMiddleware,
			zodValidator("query", skuAvailabilityQuerySchema),
			async (c) => {
				const { sku, excludeProductId } = c.req.valid("query");
				const result = await service.checkSkuAvailability(
					sku,
					excludeProductId,
				);
				return c.json(result, 200);
			},
		)
		.get(
			"/admin/products/:id",
			merchandiserMiddleware,
			zodValidator("param", productIdParamSchema),
			async (c) => {
				const { id } = c.req.valid("param");
				const product = await service.getAdminProductById(id);
				return c.json(product, 200);
			},
		)
		.post(
			"/admin/products",
			merchandiserMiddleware,
			zodValidator("json", productInputSchema),
			async (c) => {
				const user = c.get("user");
				const payload = c.req.valid("json");
				const created = await service.createAdminProduct(payload, {
					id: user.id,
					role: (user.role as Role) || "customer",
				});
				return c.json(created, 201);
			},
		)
		.patch(
			"/admin/products/:id",
			merchandiserMiddleware,
			zodValidator("param", productIdParamSchema),
			zodValidator("json", productAdminUpdateSchema),
			async (c) => {
				const user = c.get("user");
				const { id } = c.req.valid("param");
				const payload = c.req.valid("json");
				const updated = await service.updateAdminProduct(id, payload, {
					id: user.id,
					role: (user.role as Role) || "customer",
				});
				return c.json(updated, 200);
			},
		)
		.patch(
			"/admin/products/:id/status",
			merchandiserMiddleware,
			zodValidator("param", productIdParamSchema),
			zodValidator("json", adminProductStatusUpdateSchema),
			async (c) => {
				const { id } = c.req.valid("param");
				const { status } = c.req.valid("json");
				const updated = await service.updateAdminProductStatus(id, status);
				return c.json(updated, 200);
			},
		);
}

export const catalogRoute = createCatalogRoute();
