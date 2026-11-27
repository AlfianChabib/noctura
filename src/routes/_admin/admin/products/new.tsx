import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";
import { createEmptyProductFormValues } from "@/components/admin/product-form-config";
import {
	categoriesQueryOptions,
	collectionsQueryOptions,
	sizeGuidesQueryOptions,
} from "@/lib/queries/admin-catalog";

export const Route = createFileRoute("/_admin/admin/products/new")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.query({
				...categoriesQueryOptions(),
				staleTime: "static",
			}),
			context.queryClient.query({
				...collectionsQueryOptions(),
				staleTime: "static",
			}),
			context.queryClient.query({
				...sizeGuidesQueryOptions(),
				staleTime: "static",
			}),
		]);
	},
	component: NewAdminProductPage,
});

function NewAdminProductPage() {
	const { data: categoriesData } = useSuspenseQuery(categoriesQueryOptions());
	const { data: collectionsData } = useSuspenseQuery(collectionsQueryOptions());
	const { data: sizeGuidesData } = useSuspenseQuery(sizeGuidesQueryOptions());

	const defaultCategoryId = categoriesData.categories[0]?.id ?? "";

	return (
		<ProductForm
			mode="create"
			initialValues={createEmptyProductFormValues(defaultCategoryId)}
			categories={categoriesData.categories}
			collections={collectionsData.collections}
			sizeGuides={sizeGuidesData.sizeGuides}
		/>
	);
}
