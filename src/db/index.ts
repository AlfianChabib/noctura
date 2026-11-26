import { neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { normalizeDatabaseUrl } from "./connection-url.ts";
import * as schema from "./schema/index.ts";

// Use stateless HTTPS fetch() for non-transactional queries so Cloudflare Workers
// never hold/reuse TCP sockets across request contexts, while closing pooled
// WebSocket clients immediately after each transaction (`maxUses: 1`).
neonConfig.poolQueryViaFetch = true;

const rawConnectionString =
	process.env.DATABASE_URL_POOLER ||
	process.env.DATABASE_URL_POOLED ||
	process.env.DATABASE_URL;

if (!rawConnectionString) {
	throw new Error(
		"Database connection string is missing. Please set DATABASE_URL or DATABASE_URL_POOLER in environment.",
	);
}

const connectionString = normalizeDatabaseUrl(rawConnectionString);

export const db = drizzle({
	connection: {
		connectionString,
		maxUses: 1,
	},
	relations: schema.relations,
	logger: true,
});
export type Database = typeof db;
export { schema };
