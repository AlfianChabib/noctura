import { AlertCircle, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import type * as React from "react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import {
	buildFashionImageUrl,
	buildFashionLqipUrl,
	buildFashionSrcSet,
} from "@/lib/imagekit";
import { cn } from "@/lib/utils";
import {
	ALLOWED_IMAGE_MIME_TYPES,
	imagekitUploadResponseSchema,
	MAX_IMAGE_SIZE_BYTES,
	type ProductMediaItem,
	type UploadSignatureRequest,
	type UploadSignatureResponse,
	uploadSignatureResponseSchema,
	validateImageFile,
} from "@/shared/schemas/media";

export type ImageUploadValue = ProductMediaItem;

export interface ImageUploadProps {
	purpose: "product" | "evidence";
	categorySlug?: string;
	orderId?: string;
	value: ImageUploadValue[];
	onChange: (items: ImageUploadValue[]) => void;
	defaultColorName?: string;
	maxFiles?: number;
	disabled?: boolean;
	className?: string;
}

interface UploadingItem {
	id: string;
	fileName: string;
	progress: number;
}

const ACCEPT_ATTR = ALLOWED_IMAGE_MIME_TYPES.join(",");
const MAX_SIZE_MB = Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024));

function buildSignaturePayload(
	purpose: "product" | "evidence",
	file: File,
	categorySlug?: string,
	orderId?: string,
): UploadSignatureRequest | null {
	if (purpose === "product") {
		if (!categorySlug?.trim()) return null;
		return {
			purpose: "product",
			categorySlug: categorySlug.trim(),
			fileName: file.name,
			mimeType: file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
			fileSize: file.size,
		};
	}

	if (!orderId?.trim()) return null;
	return {
		purpose: "evidence",
		orderId: orderId.trim(),
		fileName: file.name,
		mimeType: file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
		fileSize: file.size,
	};
}

async function requestUploadSignature(
	payload: UploadSignatureRequest,
): Promise<UploadSignatureResponse> {
	const res = await api.media["upload-signature"].$post({
		json: payload,
	});

	if (!res.ok) {
		const errorBody = (await res.json().catch(() => null)) as {
			message?: string;
			error?: { message?: string } | string;
		} | null;
		const serverMessage =
			(typeof errorBody?.error === "object"
				? errorBody.error?.message
				: undefined) ?? errorBody?.message;
		throw new Error(
			serverMessage ||
				`Gagal mendapatkan signature upload (HTTP ${res.status}).`,
		);
	}

	const raw = await res.json();
	const parsed = uploadSignatureResponseSchema.safeParse(raw);
	if (!parsed.success) {
		throw new Error("Respons signature upload dari server tidak valid.");
	}
	return parsed.data;
}

function uploadDirectToImageKit(
	file: File,
	sig: UploadSignatureResponse,
	onProgress: (percent: number) => void,
) {
	return new Promise<ReturnType<typeof imagekitUploadResponseSchema.parse>>(
		(resolve, reject) => {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("fileName", sig.sanitizedFileName);
			formData.append("publicKey", sig.publicKey);
			formData.append("token", sig.token);
			formData.append("expire", String(sig.expire));
			formData.append("signature", sig.signature);
			formData.append("folder", sig.folder);
			formData.append("useUniqueFileName", "true");

			const xhr = new XMLHttpRequest();
			xhr.open("POST", sig.uploadUrl);

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable && event.total > 0) {
					onProgress(Math.round((event.loaded / event.total) * 100));
				}
			};

			xhr.onload = () => {
				let body: unknown = null;
				try {
					body = JSON.parse(xhr.responseText);
				} catch {
					reject(new Error("Respons ImageKit tidak dapat dibaca."));
					return;
				}

				if (xhr.status < 200 || xhr.status >= 300) {
					const errObj = body as { message?: string } | null;
					reject(
						new Error(
							errObj?.message ||
								`Upload ke ImageKit gagal (HTTP ${xhr.status}).`,
						),
					);
					return;
				}

				const parsed = imagekitUploadResponseSchema.safeParse(body);
				if (!parsed.success) {
					reject(new Error("Format respons upload ImageKit tidak valid."));
					return;
				}

				resolve(parsed.data);
			};

			xhr.onerror = () => {
				reject(new Error("Koneksi jaringan ke ImageKit terputus saat upload."));
			};

			xhr.onabort = () => {
				reject(new Error("Proses upload dibatalkan."));
			};

			xhr.send(formData);
		},
	);
}

function deriveDefaultAltText(fileName: string): string {
	const stem = fileName
		.replace(/\.[^.]+$/, "")
		.replace(/[-_]+/g, " ")
		.trim();
	return stem || "Noctura garment photo";
}

function PreviewImage({ url, altText }: { url: string; altText: string }) {
	const [loaded, setLoaded] = useState(false);
	const lqipUrl = buildFashionLqipUrl(url);
	const transformedUrl = buildFashionImageUrl(url);
	const srcSet = buildFashionSrcSet(url);

	return (
		<div className="relative aspect-3/4 w-full overflow-hidden bg-studio">
			{lqipUrl && (
				<img
					src={lqipUrl}
					alt=""
					aria-hidden="true"
					className={cn(
						"absolute inset-0 h-full w-full scale-105 object-cover object-top blur-md transition-opacity duration-300",
						loaded ? "opacity-0" : "opacity-100",
					)}
				/>
			)}
			<img
				src={transformedUrl}
				srcSet={srcSet || undefined}
				sizes="(max-width: 640px) 50vw, 240px"
				alt={altText || "Uploaded preview"}
				loading="lazy"
				decoding="async"
				onLoad={() => setLoaded(true)}
				className={cn(
					"relative h-full w-full object-cover object-top transition-opacity duration-300",
					loaded ? "opacity-100" : "opacity-0",
				)}
			/>
		</div>
	);
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
	purpose,
	categorySlug,
	orderId,
	value,
	onChange,
	defaultColorName = "",
	maxFiles,
	disabled = false,
	className,
}) => {
	const inputId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const latestValueRef = useRef<ImageUploadValue[]>(value);
	latestValueRef.current = value;

	const [isDragging, setIsDragging] = useState(false);
	const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const effectiveMaxFiles = maxFiles ?? (purpose === "product" ? 8 : 4);
	const remainingSlots = Math.max(
		0,
		effectiveMaxFiles - value.length - uploadingItems.length,
	);

	const handleFilesSelected = async (fileList: FileList | File[]) => {
		if (disabled) return;
		setErrorMessage(null);

		const files = Array.from(fileList);
		if (files.length === 0) return;

		if (files.length > remainingSlots) {
			setErrorMessage(
				remainingSlots === 0
					? `Batas maksimal ${effectiveMaxFiles} foto telah tercapai.`
					: `Maksimal dapat menambah ${remainingSlots} foto lagi (batas ${effectiveMaxFiles} foto).`,
			);
			return;
		}

		for (const file of files) {
			const validation = validateImageFile({
				name: file.name,
				type: file.type,
				size: file.size,
			});
			if (!validation.ok) {
				setErrorMessage(`${file.name}: ${validation.message}`);
				return;
			}
		}

		const targetMissingMessage =
			purpose === "product"
				? "Pilih kategori produk (categorySlug) terlebih dahulu sebelum mengunggah foto."
				: "ID pesanan (orderId) diperlukan untuk mengunggah bukti retur.";

		for (const file of files) {
			const sigPayload = buildSignaturePayload(
				purpose,
				file,
				categorySlug,
				orderId,
			);
			if (!sigPayload) {
				setErrorMessage(targetMissingMessage);
				return;
			}

			const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			setUploadingItems((prev) => [
				...prev,
				{ id: uploadId, fileName: file.name, progress: 0 },
			]);

			try {
				const signature = await requestUploadSignature(sigPayload);
				const uploaded = await uploadDirectToImageKit(
					file,
					signature,
					(progress) => {
						setUploadingItems((prev) =>
							prev.map((item) =>
								item.id === uploadId ? { ...item, progress } : item,
							),
						);
					},
				);

				const fashionUrl = buildFashionImageUrl(uploaded.url);
				const currentItems = latestValueRef.current;
				const nextItem: ImageUploadValue = {
					url: fashionUrl,
					altText: deriveDefaultAltText(file.name),
					...(purpose === "product"
						? { colorName: defaultColorName.trim() }
						: {}),
					fileId: uploaded.fileId,
					isPrimary: currentItems.length === 0,
				};

				const nextItems = [...currentItems, nextItem];
				latestValueRef.current = nextItems;
				onChange(nextItems);
			} catch (err) {
				setErrorMessage(
					err instanceof Error
						? err.message
						: "Terjadi kesalahan saat mengunggah gambar.",
				);
			} finally {
				setUploadingItems((prev) =>
					prev.filter((item) => item.id !== uploadId),
				);
			}
		}
	};

	const handleItemFieldChange = (
		index: number,
		patch: Partial<ImageUploadValue>,
	) => {
		const next = value.map((item, idx) =>
			idx === index ? { ...item, ...patch } : item,
		);
		onChange(next);
	};

	const handleSetPrimary = (index: number) => {
		const next = value.map((item, idx) => ({
			...item,
			isPrimary: idx === index,
		}));
		onChange(next);
	};

	const handleRemove = (index: number) => {
		const filtered = value.filter((_, idx) => idx !== index);
		if (filtered.length > 0 && !filtered.some((item) => item.isPrimary)) {
			filtered[0] = { ...filtered[0], isPrimary: true };
		}
		onChange(filtered);
	};

	return (
		<div className={cn("space-y-4", className)}>
			<section
				aria-label={
					purpose === "product"
						? "Area unggah foto produk"
						: "Area unggah foto bukti retur"
				}
				onDragOver={(e) => {
					e.preventDefault();
					if (!disabled && remainingSlots > 0) setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setIsDragging(false);
					if (!disabled && e.dataTransfer.files.length > 0) {
						void handleFilesSelected(e.dataTransfer.files);
					}
				}}
				className={cn(
					"flex flex-col items-center justify-center border border-dashed px-6 py-8 text-center transition-colors rounded-none",
					isDragging
						? "border-foreground bg-secondary"
						: "border-border bg-background",
					disabled || remainingSlots === 0
						? "opacity-60 cursor-not-allowed"
						: "hover:border-foreground/60",
				)}
			>
				<input
					ref={fileInputRef}
					id={inputId}
					type="file"
					accept={ACCEPT_ATTR}
					multiple={effectiveMaxFiles > 1}
					disabled={disabled || remainingSlots === 0}
					onChange={(e) => {
						if (e.target.files) {
							void handleFilesSelected(e.target.files);
							e.target.value = "";
						}
					}}
					className="sr-only"
				/>
				<ImagePlus className="mb-3 h-6 w-6 stroke-[1.5] text-muted-foreground" />
				<p className="font-display text-xs uppercase tracking-[0.12em] text-foreground">
					{purpose === "product"
						? "Upload Product Studio Photography"
						: "Upload Return Evidence Photo"}
				</p>
				<p className="mt-1.5 text-xs text-muted-foreground">
					JPEG, PNG, atau WEBP · Maks. {MAX_SIZE_MB} MB per foto · Tersisa{" "}
					{remainingSlots} slot
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled || remainingSlots === 0}
					onClick={() => fileInputRef.current?.click()}
					className="mt-4"
				>
					Pilih Foto
				</Button>
			</section>

			{errorMessage && (
				<div
					role="alert"
					className="flex items-start gap-2.5 border border-destructive/40 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
				>
					<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
					<span>{errorMessage}</span>
				</div>
			)}

			{uploadingItems.length > 0 && (
				<div className="space-y-2">
					{uploadingItems.map((item) => (
						<div
							key={item.id}
							className="border border-border bg-secondary/40 px-3.5 py-2.5 text-xs"
						>
							<div className="flex items-center justify-between gap-2">
								<span className="flex items-center gap-2 truncate font-medium text-foreground">
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									{item.fileName}
								</span>
								<span className="font-mono text-muted-foreground">
									{item.progress}%
								</span>
							</div>
							<div className="mt-2 h-1 w-full bg-border">
								<div
									className="h-full bg-foreground transition-all duration-150"
									style={{ width: `${item.progress}%` }}
								/>
							</div>
						</div>
					))}
				</div>
			)}

			{value.length > 0 && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{value.map((item, idx) => (
						<div
							key={item.fileId || `${item.url}-${idx}`}
							className="flex flex-col border border-border bg-background"
						>
							<div className="relative">
								<PreviewImage url={item.url} altText={item.altText} />
								<div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
									<button
										type="button"
										disabled={disabled}
										onClick={() => handleSetPrimary(idx)}
										aria-label={
											item.isPrimary
												? "Foto utama"
												: `Jadikan foto ${idx + 1} sebagai foto utama`
										}
										className={cn(
											"inline-flex items-center gap-1 border px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors",
											item.isPrimary
												? "border-foreground bg-foreground text-background"
												: "border-border bg-background/90 text-foreground hover:border-foreground",
										)}
									>
										<Star
											className={cn(
												"h-3 w-3",
												item.isPrimary && "fill-current",
											)}
										/>
										<span>{item.isPrimary ? "Primary" : "Set Main"}</span>
									</button>
									<button
										type="button"
										disabled={disabled}
										onClick={() => handleRemove(idx)}
										aria-label={`Hapus foto ${item.altText || idx + 1}`}
										className="inline-flex h-7 w-7 items-center justify-center border border-border bg-background/90 text-foreground transition-colors hover:border-destructive hover:text-destructive"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>

							<div className="space-y-3 border-t border-border p-3">
								<div className="space-y-1">
									<Label htmlFor={`${inputId}-alt-${idx}`}>Alt Text</Label>
									<Input
										id={`${inputId}-alt-${idx}`}
										type="text"
										value={item.altText}
										disabled={disabled}
										maxLength={255}
										placeholder="Deskripsi visual produk..."
										onChange={(e) =>
											handleItemFieldChange(idx, { altText: e.target.value })
										}
										className="h-8 text-xs"
									/>
								</div>

								{purpose === "product" && (
									<div className="space-y-1">
										<Label htmlFor={`${inputId}-color-${idx}`}>
											Color Name
										</Label>
										<Input
											id={`${inputId}-color-${idx}`}
											type="text"
											value={item.colorName ?? ""}
											disabled={disabled}
											maxLength={60}
											placeholder="mis. Navy, Obsidian, Sage"
											onChange={(e) =>
												handleItemFieldChange(idx, {
													colorName: e.target.value,
												})
											}
											className="h-8 text-xs"
										/>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
