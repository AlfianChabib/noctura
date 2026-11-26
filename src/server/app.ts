import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "@/lib/auth";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { timingMiddleware } from "./middleware/timing";
import { authGuardRoute } from "./routes/auth-guard";
import { catalogRoute } from "./routes/catalog";
import { healthRoute } from "./routes/health";
import { inventoryRoute } from "./routes/inventory";
import { mediaRoute } from "./routes/media";

export const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", timingMiddleware());
app.use("*", secureHeaders());
app.use(
	"*",
	cors({
		origin: (origin) => origin || "*",
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	}),
);

app.onError(errorHandler);
app.notFound(notFoundHandler);

app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));

const routes = app
	.route("/health", healthRoute)
	.route("/auth-guard", authGuardRoute)
	.route("/media", mediaRoute)
	.route("/", catalogRoute)
	.route("/admin/inventory", inventoryRoute);

export type AppType = typeof routes;
export default app;
