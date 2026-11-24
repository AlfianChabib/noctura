import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.ts";

const connectionString =
	process.env.DATABASE_URL_POOLER ||
	process.env.DATABASE_URL_POOLED ||
	process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"Database connection string is missing. Please set DATABASE_URL or DATABASE_URL_POOLER in environment.",
	);
}

export const db = drizzle(connectionString, {
	relations: schema.relations,
});
export type Database = typeof db;
export { schema };
