import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";
import { productDetailToFormValues } from "@/components/admin/product-form-config";
import {
	adminProductDetailQueryOptions,
	categoriesQueryOptions,
	collectionsQueryOptions,
	sizeGuidesQueryOptions,
} from "@/lib/queries/admin-catalog";

export const Route = createFileRoute("/_admin/admin/products/$id/edit")({
	loader: async ({ context, params }) => {
		const [product] = await Promise.all([
			context.queryClient.query({
				...adminProductDetailQueryOptions(params.id),
				staleTime: "static",
			}),
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

		if (!product) {
			throw notFound();
		}
	},
	component: EditAdminProductPage,
});

function EditAdminProductPage() {
	const { id } = Route.useParams();
	const { data: product } = useSuspenseQuery(
		adminProductDetailQueryOptions(id),
	);
	const { data: categoriesData } = useSuspenseQuery(categoriesQueryOptions());
	const { data: collectionsData } = useSuspenseQuery(collectionsQueryOptions());
	const { data: sizeGuidesData } = useSuspenseQuery(sizeGuidesQueryOptions());

	if (!product) {
		return null;
	}

	return (
		<ProductForm
			mode="edit"
			productId={id}
			initialValues={productDetailToFormValues(product)}
			categories={categoriesData.categories}
			collections={collectionsData.collections}
			sizeGuides={sizeGuidesData.sizeGuides}
		/>
	);
}
