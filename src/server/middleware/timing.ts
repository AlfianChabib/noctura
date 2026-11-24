import type { MiddlewareHandler } from "hono";

export const timingMiddleware = (): MiddlewareHandler => {
	return async (c, next) => {
		const start = performance.now();
		await next();
		const duration = (performance.now() - start).toFixed(2);
		c.header("X-Response-Time", `${duration}ms`);
	};
};
