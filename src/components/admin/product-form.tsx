import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { ImageUpload } from "@/components/common/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { slugifyText, suggestParentSku } from "@/lib/admin/variant-matrix";
import { api } from "@/lib/api-client";
import {
	adminCatalogKeys,
	type CategoryOption,
	type CollectionOption,
	getApiErrorMessage,
	type SizeGuideOption,
} from "@/lib/queries/admin-catalog";
import { GENDER_AUDIENCES, PRODUCT_STATUSES } from "@/shared/schemas/catalog";
import {
	type ProductFormValues,
	productFormOpts,
	useProductAppForm,
	validateProductWithZod,
} from "./product-form-config";
import { VariantMatrixEditor } from "./variant-matrix-editor";

export interface ProductFormProps {
	mode: "create" | "edit";
	productId?: string;
	initialValues: ProductFormValues;
	categories: readonly CategoryOption[];
	collections: readonly CollectionOption[];
	sizeGuides: readonly SizeGuideOption[];
}

const STATUS_OPTIONS = PRODUCT_STATUSES.map((value) => ({
	value,
	label: value.toUpperCase(),
}));

const GENDER_OPTIONS = GENDER_AUDIENCES.map((value) => ({
	value,
	label: value.toUpperCase(),
}));

export function ProductForm({
	mode,
	productId,
	initialValues,
	categories,
	collections,
	sizeGuides,
}: ProductFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
	const [parentSkuManuallyEdited, setParentSkuManuallyEdited] = useState(
		mode === "edit",
	);
	const [serverError, setServerError] = useState<string | null>(null);

	const saveMutation = useMutation({
		mutationFn: async (values: ProductFormValues) => {
			if (mode === "edit" && productId) {
				const res = await api.admin.products[":id"].$patch({
					param: { id: productId },
					json: values,
				});
				if (!res.ok) {
					throw new Error(
						await getApiErrorMessage(res, "Gagal memperbarui produk"),
					);
				}
				return res.json();
			}

			const { variants, ...rest } = values;
			const createPayload = {
				...rest,
				variants: variants.map(({ id: _omit, ...variant }) => variant),
			};
			const res = await api.admin.products.$post({
				json: createPayload,
			});
			if (!res.ok) {
				throw new Error(await getApiErrorMessage(res, "Gagal membuat produk"));
			}
			return res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: adminCatalogKeys.all,
			});
			await navigate({ to: "/admin/products" });
		},
	});

	const form = useProductAppForm({
		...productFormOpts,
		defaultValues: initialValues,
		validators: {
			onSubmit: ({ value }) => validateProductWithZod(value),
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			try {
				await saveMutation.mutateAsync(value);
			} catch (err) {
				setServerError(
					err instanceof Error
						? err.message
						: "Terjadi kesalahan saat menyimpan produk.",
				);
			}
		},
	});

	const categorySlugById = useMemo(
		() => new Map(categories.map((c) => [c.id, c.slug])),
		[categories],
	);

	const categoryOptions = useMemo(
		() => categories.map((cat) => ({ value: cat.id, label: cat.name })),
		[categories],
	);

	const sizeGuideOptions = useMemo(
		() =>
			sizeGuides.map((guide) => ({
				value: guide.id,
				label: `${guide.name} (${guide.garmentType})`,
			})),
		[sizeGuides],
	);

	const collectionOptions = useMemo(
		() => collections.map((col) => ({ value: col.id, label: col.name })),
		[collections],
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void form.handleSubmit();
			}}
			className="space-y-8 pb-20"
		>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
				<div className="space-y-1">
					<Link
						to="/admin/products"
						className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Kembali ke Daftar Produk
					</Link>
					<h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
						{mode === "create"
							? "Tambah Produk Katalog"
							: `Edit Produk: ${initialValues.name}`}
					</h1>
				</div>

				<form.Subscribe selector={(s) => s.values.status}>
					{(status) => (
						<Badge
							variant={
								status === "published"
									? "success"
									: status === "draft"
										? "warning"
										: "muted"
							}
							className="w-fit font-mono text-xs"
						>
							Status: {status}
						</Badge>
					)}
				</form.Subscribe>
			</div>

			{serverError && (
				<div
					role="alert"
					className="flex items-start gap-2.5 border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive"
				>
					<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
					<span>{serverError}</span>
				</div>
			)}

			{/* Core Identity & Categorization */}
			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="rounded-none border-border lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-sm uppercase tracking-wider font-sans">
							Informasi Utama Produk
						</CardTitle>
						<CardDescription className="text-xs">
							Nama produk, slug URL otomatis, Parent SKU, dan detail editorial.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<form.AppField name="name">
								{(field) => (
									<field.InputField
										id="product-name"
										label="Nama Produk *"
										placeholder="mis. Double-Breasted Merino Wool Blazer"
										className="sm:col-span-2"
										onValueChange={(nextName) => {
											if (!slugManuallyEdited) {
												form.setFieldValue("slug", slugifyText(nextName));
											}
											if (!parentSkuManuallyEdited) {
												form.setFieldValue(
													"parentSku",
													suggestParentSku(nextName),
												);
											}
										}}
									/>
								)}
							</form.AppField>

							<form.AppField name="slug">
								{(field) => (
									<field.InputField
										id="product-slug"
										label="Slug URL *"
										placeholder="double-breasted-merino-wool-blazer"
										inputClassName="font-mono text-xs"
										onValueChange={() => setSlugManuallyEdited(true)}
									/>
								)}
							</form.AppField>

							<form.AppField name="parentSku">
								{(field) => (
									<field.InputField
										id="product-parent-sku"
										label="Parent SKU *"
										placeholder="NOC-DOUB-MERI"
										inputClassName="font-mono text-xs"
										onValueChange={() => setParentSkuManuallyEdited(true)}
									/>
								)}
							</form.AppField>

							<form.AppField name="brand">
								{(field) => (
									<field.InputField id="product-brand" label="Brand *" />
								)}
							</form.AppField>

							<form.AppField name="basePriceIdr">
								{(field) => (
									<field.InputField
										id="product-base-price"
										label="Harga Dasar (IDR) *"
										type="number"
										min={1}
									/>
								)}
							</form.AppField>
						</div>

						<form.AppField name="description">
							{(field) => (
								<field.TextareaField
									id="product-description"
									label="Deskripsi *"
									rows={4}
									placeholder="Deskripsikan siluet, struktur jahitan, dan detail styling..."
								/>
							)}
						</form.AppField>

						<div className="grid gap-4 sm:grid-cols-2">
							<form.AppField name="materialComposition">
								{(field) => (
									<field.InputField
										id="product-material"
										label="Komposisi Kain"
										placeholder="mis. 100% Virgin Merino Wool"
									/>
								)}
							</form.AppField>

							<form.AppField name="fitType">
								{(field) => (
									<field.InputField
										id="product-fit"
										label="Tipe Potongan (Fit)"
										placeholder="mis. Relaxed Tailored"
									/>
								)}
							</form.AppField>
						</div>

						<form.AppField name="careInstructions">
							{(field) => (
								<field.TextareaField
									id="product-care"
									label="Instruksi Perawatan"
									rows={3}
									placeholder="mis. Dry clean only. Do not tumble dry. Cool iron with pressing cloth."
								/>
							)}
						</form.AppField>
					</CardContent>
				</Card>

				{/* Classification Sidebar */}
				<Card className="rounded-none border-border">
					<CardHeader>
						<CardTitle className="text-sm uppercase tracking-wider font-sans">
							Klasifikasi &amp; Status
						</CardTitle>
						<CardDescription className="text-xs">
							Atur kategori, audiens, panduan ukuran, dan koleksi lookbook.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<form.AppField name="status">
							{(field) => (
								<field.SelectField
									id="product-status"
									label="Status Publikasi"
									options={STATUS_OPTIONS}
								/>
							)}
						</form.AppField>

						<form.AppField name="categoryId">
							{(field) => (
								<field.SelectField
									id="product-category"
									label="Kategori *"
									placeholder="Pilih kategori..."
									options={categoryOptions}
								/>
							)}
						</form.AppField>

						<form.AppField name="genderAudience">
							{(field) => (
								<field.SelectField
									id="product-gender"
									label="Target Gender"
									options={GENDER_OPTIONS}
								/>
							)}
						</form.AppField>

						<form.AppField name="sizeGuideId">
							{(field) => (
								<field.SelectField
									id="product-size-guide"
									label="Panduan Ukuran"
									placeholder="Tanpa panduan ukuran"
									nullable
									emptyLabel="Tanpa Panduan Ukuran"
									options={sizeGuideOptions}
								/>
							)}
						</form.AppField>

						<form.AppField name="collectionIds">
							{(field) => (
								<field.CheckboxGroupField
									label="Koleksi Editorial"
									idPrefix="product-collection"
									emptyMessage="Belum ada koleksi aktif."
									options={collectionOptions}
									className="pt-2 border-t border-border"
								/>
							)}
						</form.AppField>
					</CardContent>
				</Card>
			</div>

			{/* Studio Media Upload */}
			<Card className="rounded-none border-border">
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider font-sans">
						Galeri Foto Produk (ImageKit DAM)
					</CardTitle>
					<CardDescription className="text-xs">
						Unggah foto pakaian beresolusi tinggi dengan rasio 3:4 dan kaitkan
						Color Name agar swatch di PDP berganti otomatis.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form.Subscribe
						selector={(s) => ({
							categoryId: s.values.categoryId,
							firstColor: s.values.variants[0]?.colorName ?? "",
						})}
					>
						{({ categoryId, firstColor }) => {
							const selectedSlug =
								categorySlugById.get(categoryId) ?? "uncategorized";
							return (
								<form.Field name="media">
									{(mediaField) => (
										<ImageUpload
											purpose="product"
											categorySlug={selectedSlug}
											defaultColorName={firstColor}
											value={mediaField.state.value.map((m) => ({
												url: m.url,
												altText: m.altText,
												colorName: m.colorName,
												isPrimary: m.isPrimary,
											}))}
											onChange={(items) =>
												mediaField.handleChange(
													items.map((item, idx) => ({
														...item,
														mediaType: "image" as const,
														sortOrder: idx,
													})),
												)
											}
										/>
									)}
								</form.Field>
							);
						}}
					</form.Subscribe>
				</CardContent>
			</Card>

			{/* Variant SKU Matrix */}
			<Card className="rounded-none border-border">
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider font-sans">
						Matriks Varian SKU
					</CardTitle>
					<CardDescription className="text-xs">
						Generate kombinasi warna × ukuran, terapkan harga &amp; berat
						massal, dan validasi keunikan SKU secara real-time.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<VariantMatrixEditor form={form} productId={productId} />
				</CardContent>
			</Card>

			{/* Sticky Submit Bar */}
			<div className="sticky bottom-0 z-30 border border-border bg-background/95 backdrop-blur px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<form.Subscribe
					selector={(state) => ({
						isDirty: state.isDirty,
						errors: state.errors,
					})}
				>
					{({ isDirty, errors }) => (
						<>
							<div className="text-xs text-muted-foreground">
								{errors.length > 0 ? (
									<span className="text-destructive font-medium">
										Periksa kembali kolom yang memiliki error validasi.
									</span>
								) : isDirty ? (
									<span>Terdapat perubahan yang belum disimpan.</span>
								) : (
									<span>Siap disimpan ke katalog PostgreSQL.</span>
								)}
							</div>
							<div className="flex items-center gap-3">
								<Button variant="outline" size="sm" asChild>
									<Link to="/admin/products">Batal</Link>
								</Button>
								<form.AppForm>
									<form.SubmitButton isPending={saveMutation.isPending}>
										{mode === "create" ? "Simpan Produk" : "Perbarui Produk"}
									</form.SubmitButton>
								</form.AppForm>
							</div>
						</>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}
