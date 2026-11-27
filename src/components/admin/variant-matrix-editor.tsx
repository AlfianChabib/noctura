import { Grid3X3, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	applyBatchToVariants,
	buildVariantSku,
	generateVariantMatrix,
	type MatrixColorChoice,
	PRESET_COLORS,
	PRESET_SIZES,
} from "@/lib/admin/variant-matrix";
import { checkVariantSkuAvailability } from "@/lib/queries/admin-catalog";
import { cn } from "@/lib/utils";
import {
	HEX_COLOR_REGEX,
	type ProductVariantAdminInput,
} from "@/shared/schemas/catalog";
import {
	formatFieldErrors,
	productFormOpts,
	withProductForm,
} from "./product-form-config";

function parsePositiveIntInput(raw: string): number | undefined {
	if (!raw.trim()) return undefined;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeIntInput(raw: string): number | undefined {
	if (!raw.trim()) return undefined;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export const VariantMatrixEditor = withProductForm({
	...productFormOpts,
	props: {
		productId: undefined as string | undefined,
	},
	render: function VariantMatrixEditorRender({ form, productId }) {
		const [selectedColors, setSelectedColors] = useState<MatrixColorChoice[]>([
			PRESET_COLORS[0],
			PRESET_COLORS[2],
		]);
		const [selectedSizes, setSelectedSizes] = useState<string[]>([
			"S",
			"M",
			"L",
			"XL",
		]);
		const [customColorName, setCustomColorName] = useState("");
		const [customColorHex, setCustomColorHex] = useState("#1A1A1A");
		const [customSize, setCustomSize] = useState("");
		const [matrixNotice, setMatrixNotice] = useState<string | null>(null);

		const [batchPrice, setBatchPrice] = useState("");
		const [batchCompareAtPrice, setBatchCompareAtPrice] = useState("");
		const [batchWeight, setBatchWeight] = useState("");
		const [batchStock, setBatchStock] = useState("");
		const [batchLength, setBatchLength] = useState("");
		const [batchWidth, setBatchWidth] = useState("");
		const [batchHeight, setBatchHeight] = useState("");

		const togglePresetColor = (choice: MatrixColorChoice) => {
			setSelectedColors((prev) => {
				const exists = prev.some(
					(c) => c.colorName.toLowerCase() === choice.colorName.toLowerCase(),
				);
				if (exists) {
					return prev.filter(
						(c) => c.colorName.toLowerCase() !== choice.colorName.toLowerCase(),
					);
				}
				return [...prev, choice];
			});
		};

		const addCustomColor = () => {
			const name = customColorName.trim();
			const hex = customColorHex.trim().toUpperCase();
			if (name.length < 2 || !HEX_COLOR_REGEX.test(hex)) {
				setMatrixNotice(
					"Warna kustom membutuhkan nama minimal 2 karakter dan kode hex valid (#RRGGBB).",
				);
				return;
			}
			setMatrixNotice(null);
			setSelectedColors((prev) => {
				if (
					prev.some((c) => c.colorName.toLowerCase() === name.toLowerCase())
				) {
					return prev;
				}
				return [...prev, { colorName: name, colorHex: hex }];
			});
			setCustomColorName("");
		};

		const toggleSize = (size: string) => {
			setSelectedSizes((prev) =>
				prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
			);
		};

		const addCustomSize = () => {
			const size = customSize.trim();
			if (!size) return;
			setSelectedSizes((prev) =>
				prev.includes(size) ? prev : [...prev, size],
			);
			setCustomSize("");
		};

		const handleGenerateMatrix = () => {
			if (selectedColors.length === 0 || selectedSizes.length === 0) {
				setMatrixNotice(
					"Pilih minimal 1 warna dan 1 ukuran untuk men-generate matriks varian.",
				);
				return;
			}
			setMatrixNotice(null);
			const parentSku = form.getFieldValue("parentSku");
			const basePriceIdr = form.getFieldValue("basePriceIdr");
			const existingVariants = form.getFieldValue("variants");

			const nextVariants = generateVariantMatrix({
				parentSku,
				basePriceIdr,
				colors: selectedColors,
				sizes: selectedSizes,
				existingVariants,
				defaults: {
					priceIdr: parsePositiveIntInput(batchPrice) ?? basePriceIdr,
					compareAtPriceIdr: parsePositiveIntInput(batchCompareAtPrice) ?? null,
					stockQuantity: parseNonNegativeIntInput(batchStock) ?? 10,
					weightGrams: parsePositiveIntInput(batchWeight) ?? 350,
					lengthCm: parsePositiveIntInput(batchLength) ?? 32,
					widthCm: parsePositiveIntInput(batchWidth) ?? 24,
					heightCm: parsePositiveIntInput(batchHeight) ?? 4,
				},
			});

			form.setFieldValue("variants", nextVariants);
		};

		const handleApplyBatch = () => {
			const current = form.getFieldValue("variants");
			if (current.length === 0) return;

			const updated = applyBatchToVariants(current, {
				priceIdr: parsePositiveIntInput(batchPrice),
				compareAtPriceIdr:
					batchCompareAtPrice.trim() === ""
						? undefined
						: parsePositiveIntInput(batchCompareAtPrice),
				stockQuantity: parseNonNegativeIntInput(batchStock),
				weightGrams: parsePositiveIntInput(batchWeight),
				lengthCm: parsePositiveIntInput(batchLength),
				widthCm: parsePositiveIntInput(batchWidth),
				heightCm: parsePositiveIntInput(batchHeight),
			});

			form.setFieldValue("variants", updated);
			setMatrixNotice(
				`Nilai batch diterapkan ke ${updated.length} baris varian SKU.`,
			);
		};

		const combinationCount = selectedColors.length * selectedSizes.length;

		return (
			<div className="space-y-6">
				{/* Matrix Generator Panel */}
				<div className="border border-border bg-secondary/20 p-4 sm:p-5 space-y-5">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
						<div>
							<h3 className="font-display text-xs uppercase tracking-[0.14em] font-semibold flex items-center gap-2">
								<Grid3X3 className="h-4 w-4" />
								Generator Matriks Varian (Warna × Ukuran)
							</h3>
							<p className="text-xs text-muted-foreground mt-1">
								Pilih kombinasi warna dan ukuran untuk menghasilkan puluhan SKU
								secara otomatis sambil mempertahankan baris yang sudah diedit.
							</p>
						</div>
						<Badge variant="outline" className="font-mono text-[11px] w-fit">
							{selectedColors.length} Warna × {selectedSizes.length} Ukuran ={" "}
							{combinationCount} SKU
						</Badge>
					</div>

					{/* Color Selection */}
					<div className="space-y-2.5">
						<Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
							1. Pilih Warna
						</Label>
						<div className="flex flex-wrap gap-2">
							{PRESET_COLORS.map((color) => {
								const active = selectedColors.some(
									(c) =>
										c.colorName.toLowerCase() === color.colorName.toLowerCase(),
								);
								return (
									<button
										key={color.colorName}
										type="button"
										onClick={() => togglePresetColor(color)}
										className={cn(
											"inline-flex items-center gap-2 border px-2.5 py-1.5 text-xs transition-colors",
											active
												? "border-foreground bg-foreground text-background"
												: "border-border bg-background text-foreground hover:border-foreground/60",
										)}
									>
										<span
											className="h-3 w-3 border border-black/20 shrink-0"
											style={{ backgroundColor: color.colorHex }}
										/>
										<span>{color.colorName}</span>
									</button>
								);
							})}
						</div>

						{selectedColors.some(
							(c) =>
								!PRESET_COLORS.some(
									(p) =>
										p.colorName.toLowerCase() === c.colorName.toLowerCase(),
								),
						) && (
							<div className="flex flex-wrap gap-2 pt-1">
								{selectedColors
									.filter(
										(c) =>
											!PRESET_COLORS.some(
												(p) =>
													p.colorName.toLowerCase() ===
													c.colorName.toLowerCase(),
											),
									)
									.map((custom) => (
										<button
											key={custom.colorName}
											type="button"
											onClick={() => togglePresetColor(custom)}
											className="inline-flex items-center gap-2 border border-foreground bg-foreground text-background px-2.5 py-1 text-xs"
										>
											<span
												className="h-3 w-3 border border-white/30"
												style={{ backgroundColor: custom.colorHex }}
											/>
											<span>{custom.colorName}</span>
											<span className="text-[10px] opacity-75">×</span>
										</button>
									))}
							</div>
						)}

						<div className="flex flex-wrap items-center gap-2 pt-1">
							<Input
								type="text"
								value={customColorName}
								onChange={(e) => setCustomColorName(e.target.value)}
								placeholder="Warna kustom (mis. Charcoal)"
								className="h-8 w-48 text-xs"
							/>
							<input
								type="color"
								aria-label="Pilih kode warna hex"
								value={
									HEX_COLOR_REGEX.test(customColorHex)
										? customColorHex
										: "#1A1A1A"
								}
								onChange={(e) =>
									setCustomColorHex(e.target.value.toUpperCase())
								}
								className="h-8 w-10 border border-input bg-background p-0.5 cursor-pointer"
							/>
							<Input
								type="text"
								value={customColorHex}
								onChange={(e) => setCustomColorHex(e.target.value)}
								placeholder="#1A1A1A"
								maxLength={7}
								className="h-8 w-24 font-mono text-xs"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addCustomColor}
								className="h-8 text-xs"
							>
								+ Warna
							</Button>
						</div>
					</div>

					{/* Size Selection */}
					<div className="space-y-2.5">
						<Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
							2. Pilih Ukuran
						</Label>
						<div className="flex flex-wrap gap-1.5">
							{PRESET_SIZES.map((size) => {
								const active = selectedSizes.includes(size);
								return (
									<button
										key={size}
										type="button"
										onClick={() => toggleSize(size)}
										className={cn(
											"min-w-10 border px-2.5 py-1.5 font-mono text-xs transition-colors",
											active
												? "border-foreground bg-foreground text-background"
												: "border-border bg-background text-foreground hover:border-foreground/60",
										)}
									>
										{size}
									</button>
								);
							})}
						</div>
						<div className="flex items-center gap-2 pt-1">
							<Input
								type="text"
								value={customSize}
								onChange={(e) => setCustomSize(e.target.value)}
								placeholder="Ukuran kustom (mis. 38)"
								maxLength={20}
								className="h-8 w-44 font-mono text-xs"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addCustomSize}
								className="h-8 text-xs"
							>
								+ Ukuran
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={handleGenerateMatrix}
								className="ml-auto h-8 text-xs"
							>
								<Sparkles className="h-3.5 w-3.5" />
								Generate {combinationCount} Varian SKU
							</Button>
						</div>
					</div>

					{matrixNotice && (
						<p className="text-xs text-foreground border-l-2 border-foreground pl-3 py-0.5">
							{matrixNotice}
						</p>
					)}
				</div>

				{/* Batch Apply Toolbar */}
				<div className="border border-border bg-background p-4 space-y-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider">
								Batch Update Nilai Matriks
							</p>
							<p className="text-[11px] text-muted-foreground">
								Isi kolom yang ingin disamakan lalu klik Terapkan untuk mengisi
								seluruh baris SKU sekaligus.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleApplyBatch}
							className="h-8 text-xs"
						>
							Terapkan Harga &amp; Berat ke Semua
						</Button>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
						<div className="space-y-1">
							<Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
								Harga (IDR)
							</Label>
							<Input
								type="number"
								min={1}
								value={batchPrice}
								onChange={(e) => setBatchPrice(e.target.value)}
								placeholder="450000"
								className="h-8 font-mono text-xs"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
								Harga Coret
							</Label>
							<Input
								type="number"
								min={1}
								value={batchCompareAtPrice}
								onChange={(e) => setBatchCompareAtPrice(e.target.value)}
								placeholder="550000"
								className="h-8 font-mono text-xs"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
								Stok
							</Label>
							<Input
								type="number"
								min={0}
								value={batchStock}
								onChange={(e) => setBatchStock(e.target.value)}
								placeholder="10"
								className="h-8 font-mono text-xs"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
								Berat (g)
							</Label>
							<Input
								type="number"
								min={1}
								value={batchWeight}
								onChange={(e) => setBatchWeight(e.target.value)}
								placeholder="350"
								className="h-8 font-mono text-xs"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
								Panjang (cm)
							</Label>
							<Input
								type="number"
								min={1}
								value={batchLength}
								onChange={(e) => setBatchLength(e.target.value)}
								placeholder="32"
								className="h-8 font-mono text-xs"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
								Lebar (cm)
							</Label>
							<Input
								type="number"
								min={1}
								value={batchWidth}
								onChange={(e) => setBatchWidth(e.target.value)}
								placeholder="24"
								className="h-8 font-mono text-xs"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
								Tinggi (cm)
							</Label>
							<Input
								type="number"
								min={1}
								value={batchHeight}
								onChange={(e) => setBatchHeight(e.target.value)}
								placeholder="4"
								className="h-8 font-mono text-xs"
							/>
						</div>
					</div>
				</div>

				{/* Editable Variant Matrix Table */}
				<form.Field name="variants" mode="array">
					{(variantsField) => {
						const arrayError = formatFieldErrors(
							variantsField.state.meta.errors,
						);
						const rows = variantsField.state.value;

						const addSingleVariant = () => {
							const parentSku = form.getFieldValue("parentSku");
							const basePrice = form.getFieldValue("basePriceIdr") || 450_000;
							const nextIndex = rows.length + 1;
							const defaultVariant: ProductVariantAdminInput = {
								sku: buildVariantSku(parentSku, `CLR${nextIndex}`, "M"),
								colorName: `Color ${nextIndex}`,
								colorHex: "#121212",
								sizeLabel: "M",
								sizeSortOrder: nextIndex,
								priceIdr: basePrice,
								compareAtPriceIdr: null,
								stockQuantity: 10,
								weightGrams: 350,
								lengthCm: 32,
								widthCm: 24,
								heightCm: 4,
								isActive: true,
							};
							variantsField.pushValue(defaultVariant);
						};

						return (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-xs font-semibold uppercase tracking-wider">
											Daftar Varian SKU
										</span>
										<Badge
											variant="secondary"
											className="font-mono text-[11px]"
										>
											{rows.length} baris
										</Badge>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addSingleVariant}
										className="h-8 text-xs"
									>
										<Plus className="h-3.5 w-3.5" />
										Tambah Baris Manual
									</Button>
								</div>

								{arrayError && (
									<p className="text-xs text-destructive font-medium">
										{arrayError}
									</p>
								)}

								<div className="border border-border overflow-x-auto bg-background">
									<table className="w-full text-left border-collapse min-w-[980px]">
										<thead>
											<tr className="border-b border-border bg-secondary/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
												<th className="py-2.5 px-3">SKU</th>
												<th className="py-2.5 px-2">Warna &amp; Hex</th>
												<th className="py-2.5 px-2">Ukuran</th>
												<th className="py-2.5 px-2">Harga (IDR)</th>
												<th className="py-2.5 px-2">Harga Coret</th>
												<th className="py-2.5 px-2">Stok</th>
												<th className="py-2.5 px-2">Berat (g)</th>
												<th className="py-2.5 px-2">P × L × T (cm)</th>
												<th className="py-2.5 px-2 text-center">Aktif</th>
												<th className="py-2.5 px-2 text-right">Aksi</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{rows.map((variant, index) => (
												<VariantMatrixRow
													key={variant.id || `variant-row-${index}`}
													form={form}
													index={index}
													productId={productId}
													canRemove={rows.length > 1}
													onRemove={() => variantsField.removeValue(index)}
												/>
											))}
										</tbody>
									</table>
								</div>
							</div>
						);
					}}
				</form.Field>
			</div>
		);
	},
});

const VariantMatrixRow = withProductForm({
	...productFormOpts,
	props: {
		index: 0,
		productId: undefined as string | undefined,
		canRemove: true,
		onRemove: () => {},
	},
	render: function VariantMatrixRowRender({
		form,
		index,
		productId,
		canRemove,
		onRemove,
	}) {
		const rowPrefix = `variants[${index}]` as const;

		return (
			<>
				<tr className="align-top hover:bg-secondary/10 transition-colors">
					{/* SKU with 500ms debounced async uniqueness validation */}
					<td className="p-2.5 min-w-[180px]">
						<form.Field
							name={`${rowPrefix}.sku`}
							validators={{
								onChangeAsyncDebounceMs: 500,
								onChangeAsync: async ({ value, fieldApi }) => {
									const trimmed = value.trim();
									if (trimmed.length < 3) return undefined;

									const allVariants =
										fieldApi.form.getFieldValue("variants") ?? [];
									const duplicateLocal = allVariants.some(
										(item, itemIdx) =>
											itemIdx !== index &&
											item.sku.trim().toUpperCase() === trimmed.toUpperCase(),
									);
									if (duplicateLocal) {
										return `SKU "${trimmed}" duplikat di dalam matriks ini.`;
									}

									try {
										const check = await checkVariantSkuAvailability(
											trimmed,
											productId,
										);
										if (!check.available) {
											return `SKU "${trimmed}" sudah digunakan produk lain.`;
										}
									} catch {
										return undefined;
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="relative">
									<Input
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-label={`SKU baris ${index + 1}`}
										className={cn(
											"h-8 font-mono text-xs pr-7",
											field.state.meta.errors.length > 0 &&
												"border-destructive",
										)}
									/>
									{field.state.meta.isValidating && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground absolute right-2 top-2" />
									)}
								</div>
							)}
						</form.Field>
					</td>

					{/* Color Name & Hex */}
					<td className="p-2.5 min-w-[165px]">
						<div className="flex items-center gap-1.5">
							<form.Field name={`${rowPrefix}.colorHex`}>
								{(hexField) => (
									<input
										type="color"
										aria-label={`Warna hex baris ${index + 1}`}
										value={
											HEX_COLOR_REGEX.test(hexField.state.value)
												? hexField.state.value
												: "#121212"
										}
										onChange={(e) =>
											hexField.handleChange(e.target.value.toUpperCase())
										}
										className="h-8 w-8 shrink-0 border border-input bg-background p-0.5 cursor-pointer"
									/>
								)}
							</form.Field>
							<form.Field name={`${rowPrefix}.colorName`}>
								{(colorField) => (
									<Input
										value={colorField.state.value}
										onBlur={colorField.handleBlur}
										onChange={(e) => colorField.handleChange(e.target.value)}
										aria-label={`Nama warna baris ${index + 1}`}
										className="h-8 text-xs"
									/>
								)}
							</form.Field>
						</div>
					</td>

					{/* Size */}
					<td className="p-2.5 w-24">
						<form.Field name={`${rowPrefix}.sizeLabel`}>
							{(sizeField) => (
								<Input
									value={sizeField.state.value}
									onBlur={sizeField.handleBlur}
									onChange={(e) => sizeField.handleChange(e.target.value)}
									aria-label={`Ukuran baris ${index + 1}`}
									className="h-8 font-mono text-xs"
								/>
							)}
						</form.Field>
					</td>

					{/* Price IDR */}
					<td className="p-2.5 w-32">
						<form.Field name={`${rowPrefix}.priceIdr`}>
							{(priceField) => (
								<Input
									type="number"
									min={1}
									value={priceField.state.value || ""}
									onBlur={priceField.handleBlur}
									onChange={(e) =>
										priceField.handleChange(
											Number.parseInt(e.target.value || "0", 10),
										)
									}
									aria-label={`Harga IDR baris ${index + 1}`}
									className="h-8 font-mono text-xs"
								/>
							)}
						</form.Field>
					</td>

					{/* Compare-At Price */}
					<td className="p-2.5 w-32">
						<form.Field name={`${rowPrefix}.compareAtPriceIdr`}>
							{(compareField) => (
								<Input
									type="number"
									min={1}
									value={compareField.state.value ?? ""}
									onBlur={compareField.handleBlur}
									onChange={(e) => {
										const raw = e.target.value.trim();
										compareField.handleChange(
											raw ? Number.parseInt(raw, 10) : null,
										);
									}}
									placeholder="-"
									aria-label={`Harga coret baris ${index + 1}`}
									className="h-8 font-mono text-xs"
								/>
							)}
						</form.Field>
					</td>

					{/* Stock Quantity */}
					<td className="p-2.5 w-24">
						<form.Field name={`${rowPrefix}.stockQuantity`}>
							{(stockField) => (
								<Input
									type="number"
									min={0}
									value={stockField.state.value ?? 0}
									onBlur={stockField.handleBlur}
									onChange={(e) =>
										stockField.handleChange(
											Number.parseInt(e.target.value || "0", 10),
										)
									}
									aria-label={`Stok baris ${index + 1}`}
									className="h-8 font-mono text-xs"
								/>
							)}
						</form.Field>
					</td>

					{/* Weight */}
					<td className="p-2.5 w-24">
						<form.Field name={`${rowPrefix}.weightGrams`}>
							{(weightField) => (
								<Input
									type="number"
									min={1}
									value={weightField.state.value || ""}
									onBlur={weightField.handleBlur}
									onChange={(e) =>
										weightField.handleChange(
											Number.parseInt(e.target.value || "0", 10),
										)
									}
									aria-label={`Berat gram baris ${index + 1}`}
									className="h-8 font-mono text-xs"
								/>
							)}
						</form.Field>
					</td>

					{/* Dimensions L x W x H */}
					<td className="p-2.5 min-w-[155px]">
						<div className="grid grid-cols-3 gap-1">
							<form.Field name={`${rowPrefix}.lengthCm`}>
								{(lenField) => (
									<Input
										type="number"
										min={1}
										value={lenField.state.value || ""}
										onBlur={lenField.handleBlur}
										onChange={(e) =>
											lenField.handleChange(
												Number.parseInt(e.target.value || "0", 10),
											)
										}
										aria-label={`Panjang cm baris ${index + 1}`}
										className="h-8 px-1.5 font-mono text-xs text-center"
									/>
								)}
							</form.Field>
							<form.Field name={`${rowPrefix}.widthCm`}>
								{(widField) => (
									<Input
										type="number"
										min={1}
										value={widField.state.value || ""}
										onBlur={widField.handleBlur}
										onChange={(e) =>
											widField.handleChange(
												Number.parseInt(e.target.value || "0", 10),
											)
										}
										aria-label={`Lebar cm baris ${index + 1}`}
										className="h-8 px-1.5 font-mono text-xs text-center"
									/>
								)}
							</form.Field>
							<form.Field name={`${rowPrefix}.heightCm`}>
								{(heiField) => (
									<Input
										type="number"
										min={1}
										value={heiField.state.value || ""}
										onBlur={heiField.handleBlur}
										onChange={(e) =>
											heiField.handleChange(
												Number.parseInt(e.target.value || "0", 10),
											)
										}
										aria-label={`Tinggi cm baris ${index + 1}`}
										className="h-8 px-1.5 font-mono text-xs text-center"
									/>
								)}
							</form.Field>
						</div>
					</td>

					{/* Active */}
					<td className="p-2.5 text-center align-middle">
						<form.Field name={`${rowPrefix}.isActive`}>
							{(activeField) => (
								<Checkbox
									checked={activeField.state.value}
									onCheckedChange={(checked) =>
										activeField.handleChange(Boolean(checked))
									}
									aria-label={`Status aktif baris ${index + 1}`}
								/>
							)}
						</form.Field>
					</td>

					{/* Remove */}
					<td className="p-2.5 text-right align-middle">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={!canRemove}
							onClick={onRemove}
							aria-label={`Hapus varian baris ${index + 1}`}
							className="h-8 w-8 text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</td>
				</tr>

				{/* Per-row validation error line directly beneath the variant row */}
				<form.Subscribe
					selector={(state) => {
						const rowErrorPaths = [
							`${rowPrefix}.sku`,
							`${rowPrefix}.colorName`,
							`${rowPrefix}.colorHex`,
							`${rowPrefix}.sizeLabel`,
							`${rowPrefix}.priceIdr`,
							`${rowPrefix}.compareAtPriceIdr`,
							`${rowPrefix}.stockQuantity`,
							`${rowPrefix}.weightGrams`,
							`${rowPrefix}.lengthCm`,
							`${rowPrefix}.widthCm`,
							`${rowPrefix}.heightCm`,
						] as const;

						const messages: string[] = [];
						for (const path of rowErrorPaths) {
							const meta = state.fieldMeta[path];
							if (meta?.errors && meta.errors.length > 0) {
								const formatted = formatFieldErrors(meta.errors);
								if (formatted) messages.push(formatted);
							}
						}
						return messages;
					}}
				>
					{(rowErrors) =>
						rowErrors.length > 0 ? (
							<tr className="bg-destructive/5">
								<td
									colSpan={10}
									className="px-3 py-1.5 text-xs text-destructive"
								>
									<span className="font-mono font-medium mr-2">
										[Baris {index + 1}]
									</span>
									{rowErrors.join(" · ")}
								</td>
							</tr>
						) : null
					}
				</form.Subscribe>
			</>
		);
	},
});
