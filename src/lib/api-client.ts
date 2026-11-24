import { hc } from "hono/client";
import type { AppType } from "@/server/app";

/**
 * Resolves the base URL dynamically:
 * - In browser environment: returns window.location.origin
 * - In SSR/Node environment: falls back to configured canonical URL or localhost to prevent URL parsing errors.
 */
export function getBaseUrl(): string {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	if (typeof process !== "undefined") {
		if (process.env.BETTER_AUTH_URL) {
			return process.env.BETTER_AUTH_URL;
		}
		if (process.env.VITE_APP_URL) {
			return process.env.VITE_APP_URL;
		}
		if (process.env.PORT) {
			return `http://localhost:${process.env.PORT}`;
		}
	}
	return "http://localhost:3000";
}

/**
 * Singleton RPC client instance.
 */
export const client = hc<AppType>(getBaseUrl());

/**
 * Direct accessor to the `/api` subroutes.
 * Allows type-safe calls like `await api.health.$get()`.
 */
export const api = client.api;

/**
 * Factory for creating custom RPC clients (e.g. with custom fetch, headers, or baseUrl).
 */
export const createApiClient = (
	baseUrl = getBaseUrl(),
	options?: Parameters<typeof hc>[1],
) => {
	return hc<AppType>(baseUrl, options);
};
