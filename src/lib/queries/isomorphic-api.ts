import { createIsomorphicFn } from "@tanstack/react-start";
import { api, createApiClient } from "@/lib/api-client";

/**
 * Provides an SSR-safe Hono RPC client that forwards incoming request headers
 * directly to `app.request` on the server and uses the browser singleton on the client.
 */
export const getIsomorphicApi = createIsomorphicFn()
	.client(() => api)
	.server(async () => {
		const [{ getRequestHeaders }, { app }] = await Promise.all([
			import("@tanstack/react-start/server"),
			import("@/server/app"),
		]);
		const reqHeaders = getRequestHeaders();
		return createApiClient("http://localhost", {
			fetch: (input: RequestInfo | URL, init?: RequestInit) => {
				const merged = new Headers(reqHeaders);
				if (init?.headers) {
					new Headers(init.headers).forEach((value, key) => {
						merged.set(key, value);
					});
				}
				return Promise.resolve(
					app.request(input, {
						...init,
						headers: merged,
					}),
				);
			},
		}).api;
	});

/**
 * Extracts a human-readable error message from a failed Hono JSON response.
 */
export async function getApiErrorMessage(
	res: { status: number; json(): Promise<unknown> },
	fallback: string,
): Promise<string> {
	const body = (await res.json().catch(() => null)) as {
		message?: string;
		error?: string | { message?: string };
	} | null;

	const nested =
		typeof body?.error === "object" && body.error !== null
			? body.error.message
			: typeof body?.error === "string"
				? body.error
				: undefined;

	return body?.message || nested || `${fallback} (HTTP ${res.status}).`;
}
