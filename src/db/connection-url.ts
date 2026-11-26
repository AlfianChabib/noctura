const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

/**
 * Upgrades legacy `sslmode` values (`prefer`, `require`, `verify-ca`) to
 * `verify-full` unless `uselibpqcompat` is explicitly requested, preserving
 * full TLS certificate + hostname verification and silencing pg v9 warnings.
 */
export function normalizeDatabaseUrl(rawUrl: string): string {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch {
		return rawUrl;
	}

	if (parsed.searchParams.has("uselibpqcompat")) {
		return rawUrl;
	}

	const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
	if (sslMode && LEGACY_SSL_MODES.has(sslMode)) {
		parsed.searchParams.set("sslmode", "verify-full");
		return parsed.toString();
	}

	return rawUrl;
}
