import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { timingMiddleware } from "./middleware/timing";
import { healthRoute } from "./routes/health";

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

const routes = app.route("/health", healthRoute);

export type AppType = typeof routes;
export default app;
