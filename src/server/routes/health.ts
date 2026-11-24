import { Hono } from "hono";

export const healthRoute = new Hono().get("/", (c) => {
	const uptime =
		typeof process !== "undefined" && typeof process.uptime === "function"
			? process.uptime()
			: 0;

	return c.json(
		{
			status: "ok" as const,
			timestamp: new Date().toISOString(),
			uptime,
			env: process.env.NODE_ENV || "development",
		},
		200,
	);
});
