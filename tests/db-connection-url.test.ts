import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDatabaseUrl } from "@/db/connection-url";

test("normalizeDatabaseUrl upgrades legacy sslmode values to verify-full", () => {
	assert.equal(
		normalizeDatabaseUrl(
			"postgresql://user:pass@db.example.com:5432/app?sslmode=require",
		),
		"postgresql://user:pass@db.example.com:5432/app?sslmode=verify-full",
	);
	assert.equal(
		normalizeDatabaseUrl(
			"postgresql://user:pass@db.example.com:5432/app?channel_binding=require&sslmode=prefer",
		),
		"postgresql://user:pass@db.example.com:5432/app?channel_binding=require&sslmode=verify-full",
	);
	assert.equal(
		normalizeDatabaseUrl(
			"postgresql://user:pass@db.example.com:5432/app?sslmode=verify-ca",
		),
		"postgresql://user:pass@db.example.com:5432/app?sslmode=verify-full",
	);
	// Respects explicit uselibpqcompat opt-in
	const libpqCompatUrl =
		"postgresql://user:pass@db.example.com:5432/app?uselibpqcompat=true&sslmode=require";
	assert.equal(normalizeDatabaseUrl(libpqCompatUrl), libpqCompatUrl);
	// Leaves local non-SSL URLs untouched
	const localUrl = "postgresql://user:pass@localhost:5432/noctura_dev";
	assert.equal(normalizeDatabaseUrl(localUrl), localUrl);
});
