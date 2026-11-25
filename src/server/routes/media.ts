import { Hono, type MiddlewareHandler } from "hono";
import type { Role } from "@/lib/auth-access";
import { uploadSignatureRequestSchema } from "@/shared/schemas/media";
import { type AuthEnv, requireAuth } from "../middleware/auth";
import { zodValidator } from "../middleware/validate";
import { type MediaService, mediaService } from "../services/media.service";

export interface MediaRouteOptions {
	service?: MediaService;
	authMiddleware?: MiddlewareHandler<AuthEnv>;
}

export function createMediaRoute({
	service = mediaService,
	authMiddleware = requireAuth,
}: MediaRouteOptions = {}) {
	return new Hono<AuthEnv>().post(
		"/upload-signature",
		authMiddleware,
		zodValidator("json", uploadSignatureRequestSchema),
		async (c) => {
			const user = c.get("user");
			const payload = c.req.valid("json");

			const signature = await service.generateUploadSignature(payload, {
				id: user.id,
				role: (user.role as Role) || "customer",
			});

			return c.json(signature, 200);
		},
	);
}

export const mediaRoute = createMediaRoute();
