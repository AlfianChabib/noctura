import { Hono, type MiddlewareHandler } from "hono";
import { z } from "zod";
import type { Role } from "@/lib/auth-access";
import {
	catalogFilterSchema,
	productInputSchema,
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
		);
}

export const catalogRoute = createCatalogRoute();
