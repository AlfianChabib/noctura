import { createFileRoute } from "@tanstack/react-router";
import { CATALOG_PRODUCTS } from "@/data/catalog";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const origin =
					process.env.BETTER_AUTH_URL ||
					(request ? new URL(request.url).origin : "https://noctura.fashion");

				const staticRoutes = [
					{ path: "/", priority: "1.0", changefreq: "daily" },
					{ path: "/products", priority: "0.9", changefreq: "daily" },
					{ path: "/test", priority: "0.8", changefreq: "weekly" },
					{ path: "/auth/login", priority: "0.5", changefreq: "monthly" },
				];

				const productRoutes = CATALOG_PRODUCTS.map((product) => ({
					path: `/products/${product.id}`,
					priority: "0.7",
					changefreq: "weekly",
				}));

				const allEntries = [...staticRoutes, ...productRoutes];

				const xml = `<?xml version="1.0" encoding="UTF-8"?>
											<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
											${allEntries
												.map(
													(entry) => `  <url>
													<loc>${origin}${entry.path}</loc>
													<changefreq>${entry.changefreq}</changefreq>
													<priority>${entry.priority}</priority>
												</url>`,
												)
												.join("\n")}
											</urlset>`;

				return new Response(xml, {
					status: 200,
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=3600, s-maxage=86400",
					},
				});
			},
		},
	},
});
