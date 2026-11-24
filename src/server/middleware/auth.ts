import type { MiddlewareHandler } from "hono";
import { auth, type Role, type Session, type User } from "@/lib/auth";

export interface AuthVariables {
	user: User;
	session: Session["session"];
}

export type AuthEnv = {
	Variables: AuthVariables;
};

export const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user) {
		return c.json(
			{
				error: "Unauthorized",
				message: "Autentikasi diperlukan untuk mengakses resource ini.",
			},
			401,
		);
	}

	if (session.user.banned) {
		return c.json(
			{
				error: "Forbidden",
				message: session.user.banReason
					? `Akun Anda dinonaktifkan: ${session.user.banReason}`
					: "Akun Anda telah dinonaktifkan.",
			},
			403,
		);
	}

	c.set("user", session.user);
	c.set("session", session.session);

	await next();
};

export const requireRole = (
	allowedRoles: Role[],
): MiddlewareHandler<AuthEnv> => {
	return async (c, next) => {
		let user = c.get("user");

		if (!user) {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session?.user) {
				return c.json(
					{
						error: "Unauthorized",
						message: "Autentikasi diperlukan untuk mengakses resource ini.",
					},
					401,
				);
			}

			if (session.user.banned) {
				return c.json(
					{
						error: "Forbidden",
						message: session.user.banReason
							? `Akun Anda dinonaktifkan: ${session.user.banReason}`
							: "Akun Anda telah dinonaktifkan.",
					},
					403,
				);
			}

			user = session.user;
			c.set("user", session.user);
			c.set("session", session.session);
		}

		const userRole = (user.role as Role) || "customer";
		const isSuperAdmin = userRole === "admin";
		const hasPermission = allowedRoles.includes(userRole) || isSuperAdmin;

		if (!hasPermission) {
			return c.json(
				{
					error: "Forbidden",
					message: `Akses ditolak: role '${userRole}' tidak memiliki izin yang cukup. Dibutuhkan salah satu dari: [${allowedRoles.join(", ")}].`,
				},
				403,
			);
		}

		await next();
	};
};
