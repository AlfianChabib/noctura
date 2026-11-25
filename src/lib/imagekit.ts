export const IMAGEKIT_UPLOAD_URL =
	"https://upload.imagekit.io/api/v1/files/upload";

export const FASHION_DEFAULT_TRANSFORM = "ar-3-4,c-maintain_ratio,f-auto,q-80";

export interface FashionImageOptions {
	width?: number;
	quality?: number;
	aspectRatio?: string;
	crop?: "maintain_ratio" | "at_max" | "at_least" | "force";
	format?: "auto" | "webp" | "avif" | "jpg" | "png";
	blur?: number;
	endpoint?: string;
}

const DEFAULT_WIDTHS = [400, 800, 1200] as const;

function getClientImageKitEndpoint(): string | undefined {
	if (typeof import.meta !== "undefined" && import.meta.env) {
		const metaEnv = import.meta.env as unknown as Record<
			string,
			string | undefined
		>;
		return metaEnv.VITE_IMAGEKIT_URL_ENDPOINT;
	}
	return undefined;
}

/**
 * Rejects dangerous URI protocols (such as javascript: or data:text/html)
 * before placing any URL into DOM image attributes.
 */
export function isSafeImageUrl(rawUrl: string): boolean {
	const trimmed = rawUrl.trim();
	if (!trimmed) return false;
	if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
		return !/[\r\n\0]/.test(trimmed);
	}
	try {
		const parsed = new URL(trimmed);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
}

function isImageKitHost(hostname: string, endpoint?: string): boolean {
	const normalizedHost = hostname.toLowerCase();
	if (
		normalizedHost === "ik.imagekit.io" ||
		normalizedHost.endsWith(".imagekit.io")
	) {
		return true;
	}
	if (!endpoint) return false;
	try {
		return new URL(endpoint).hostname.toLowerCase() === normalizedHost;
	} catch {
		return false;
	}
}

/**
 * Builds the comma-separated ImageKit `tr` transformation parameter string.
 * Defaults to `ar-3-4,c-maintain_ratio,f-auto,q-80`.
 */
export function buildFashionTransformString(
	options: FashionImageOptions = {},
): string {
	const {
		width,
		quality = 80,
		aspectRatio = "3-4",
		crop = "maintain_ratio",
		format = "auto",
		blur,
	} = options;

	const tokens: string[] = [];

	if (typeof width === "number" && Number.isFinite(width) && width > 0) {
		tokens.push(`w-${Math.round(width)}`);
	}

	tokens.push(`ar-${aspectRatio}`, `c-${crop}`);

	if (typeof blur === "number" && Number.isFinite(blur) && blur > 0) {
		const clampedBlur = Math.min(100, Math.max(1, Math.round(blur)));
		tokens.push(`bl-${clampedBlur}`);
	}

	const clampedQuality = Math.min(100, Math.max(1, Math.round(quality)));
	tokens.push(`f-${format}`, `q-${clampedQuality}`);

	return tokens.join(",");
}

function applyTransformQuery(url: URL, transformString: string): string {
	const params = new URLSearchParams(url.search);
	params.delete("tr");
	const remaining = params.toString();
	const base = `${url.origin}${url.pathname}`;
	const queryPrefix = remaining ? `?${remaining}&` : "?";
	return `${base}${queryPrefix}tr=${transformString}${url.hash}`;
}

/**
 * Formats an ImageKit asset URL with fashion 3:4 portrait aspect ratio and
 * automatic WebP/AVIF negotiation (`tr=ar-3-4,c-maintain_ratio,f-auto,q-80`).
 * Non-ImageKit local assets (e.g. `/assets/...`) are returned untouched.
 */
export function buildFashionImageUrl(
	src: string,
	options: FashionImageOptions = {},
): string {
	const trimmed = src.trim();
	if (!isSafeImageUrl(trimmed)) {
		return "";
	}

	const endpoint = options.endpoint ?? getClientImageKitEndpoint();
	const transformString = buildFashionTransformString(options);

	if (trimmed.startsWith("/")) {
		const isImageKitRelativePath =
			trimmed.startsWith("/products/") || trimmed.startsWith("/evidence/");
		if (!endpoint || (!options.endpoint && !isImageKitRelativePath)) {
			return trimmed;
		}
		try {
			const baseEndpoint = endpoint.replace(/\/+$/, "");
			const parsed = new URL(`${baseEndpoint}${trimmed}`);
			return applyTransformQuery(parsed, transformString);
		} catch {
			return trimmed;
		}
	}

	try {
		const parsed = new URL(trimmed);
		if (!isImageKitHost(parsed.hostname, endpoint)) {
			return trimmed;
		}
		return applyTransformQuery(parsed, transformString);
	} catch {
		return "";
	}
}

/**
 * Generates a lightweight, blurred Low Quality Image Placeholder (LQIP) URL
 * to prevent layout shift and improve perceived LCP.
 */
export function buildFashionLqipUrl(src: string, endpoint?: string): string {
	return buildFashionImageUrl(src, {
		width: 40,
		quality: 20,
		blur: 30,
		format: "auto",
		crop: "maintain_ratio",
		aspectRatio: "3-4",
		endpoint,
	});
}

/**
 * Generates a responsive `srcSet` string across standard fashion grid widths.
 */
export function buildFashionSrcSet(
	src: string,
	widths: readonly number[] = DEFAULT_WIDTHS,
	options: Omit<FashionImageOptions, "width"> = {},
): string {
	return widths
		.filter((width) => Number.isFinite(width) && width > 0)
		.map((width) => {
			const url = buildFashionImageUrl(src, { ...options, width });
			return url ? `${url} ${Math.round(width)}w` : "";
		})
		.filter(Boolean)
		.join(", ");
}
