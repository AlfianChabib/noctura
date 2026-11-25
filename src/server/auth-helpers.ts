import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { Session, User } from "@/lib/auth";

export type AuthSessionResult = {
	user: User;
	session: Session["session"];
} | null;

/**
 * Type-safe RPC server function to retrieve the authenticated session.
 * Reads request headers (including HTTP-only cookies) via TanStack Start.
 * Uses dynamic import so that `@/lib/auth` and database drivers are never bundled into client code.
 */
export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthSessionResult> => {
		try {
			const { auth } = await import("@/lib/auth");
			const headers = getRequestHeaders();
			const session = await auth.api.getSession({
				headers: headers ?? new Headers(),
			});
			return session;
		} catch (error) {
			console.error("[auth-helpers] Failed to read session:", error);
			return null;
		}
	},
);
