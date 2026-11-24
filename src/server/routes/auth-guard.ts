import { Hono } from "hono";
import { type AuthEnv, requireAuth, requireRole } from "../middleware/auth";

export const authGuardRoute = new Hono<AuthEnv>()
	.get("/me", requireAuth, (c) => {
		const user = c.get("user");
		return c.json({ user }, 200);
	})
	.get("/admin", requireRole(["admin"]), (c) => {
		const user = c.get("user");
		return c.json({ message: "Admin access granted", user }, 200);
	})
	.get("/warehouse", requireRole(["warehouse_staff"]), (c) => {
		const user = c.get("user");
		return c.json({ message: "Warehouse access granted", user }, 200);
	})
	.get("/merchandiser", requireRole(["merchandiser"]), (c) => {
		const user = c.get("user");
		return c.json({ message: "Merchandiser access granted", user }, 200);
	})
	.get("/cs", requireRole(["cs_staff"]), (c) => {
		const user = c.get("user");
		return c.json({ message: "CS access granted", user }, 200);
	});
