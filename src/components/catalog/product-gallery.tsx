import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useMemo, useState } from "react";
import {
	buildFashionImageUrl,
	buildFashionLqipUrl,
	buildFashionSrcSet,
	isSafeImageUrl,
} from "@/lib/imagekit";
import type { StorefrontProductDetail } from "@/lib/queries/storefront-catalog";
import { cn } from "@/lib/utils";

export interface ProductGalleryProps {
	media: StorefrontProductDetail["media"];
	selectedColorName: string;
	productName: string;
}

type GalleryItem = StorefrontProductDetail["media"][number];

/**
 * Resolves the media items for the selected color without triggering any
 * network request: color-specific media first, then general untagged media,
 * then full product media as a last resort.
 */
export function filterMediaByColor(
	media: readonly GalleryItem[],
	selectedColorName: string,
): GalleryItem[] {
	const normalizedColor = selectedColorName.trim().toLowerCase();
	if (normalizedColor) {
		const colorMatches = media.filter(
			(item) => item.colorName?.trim().toLowerCase() === normalizedColor,
		);
		if (colorMatches.length > 0) {
			return colorMatches;
		}
	}

	const neutralMedia = media.filter((item) => !item.colorName);
	if (neutralMedia.length > 0) {
		return neutralMedia;
	}

	return [...media];
}

export function ProductGallery({
	media,
	selectedColorName,
	productName,
}: ProductGalleryProps) {
	const galleryItems = useMemo(
		() => filterMediaByColor(media, selectedColorName),
		[media, selectedColorName],
	);

	const [selectionState, setSelectionState] = useState({
		colorName: selectedColorName,
		index: 0,
	});
	const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

	const activeIndex =
		selectionState.colorName === selectedColorName ? selectionState.index : 0;

	const safeIndex =
		galleryItems.length > 0
			? Math.min(activeIndex, galleryItems.length - 1)
			: 0;
	const activeItem = galleryItems[safeIndex] ?? null;
	const activeFailed = activeItem ? Boolean(failedIds[activeItem.id]) : false;

	const activeImageUrl =
		activeItem && activeItem.mediaType === "image"
			? buildFashionImageUrl(activeItem.url, { width: 1200 })
			: "";
	const activeSrcSet =
		activeItem && activeItem.mediaType === "image"
			? buildFashionSrcSet(activeItem.url, [400, 800, 1200, 1600])
			: "";
	const activeLqipUrl =
		activeItem && activeItem.mediaType === "image"
			? buildFashionLqipUrl(activeItem.url)
			: "";

	const setActiveIndex = (nextIndex: number) => {
		setSelectionState({ colorName: selectedColorName, index: nextIndex });
	};

	const handlePrev = () => {
		if (galleryItems.length <= 1) return;
		const nextIndex = safeIndex <= 0 ? galleryItems.length - 1 : safeIndex - 1;
		setActiveIndex(nextIndex);
	};

	const handleNext = () => {
		if (galleryItems.length <= 1) return;
		const nextIndex = safeIndex >= galleryItems.length - 1 ? 0 : safeIndex + 1;
		setActiveIndex(nextIndex);
	};

	return (
		<div
			data-testid="pdp-gallery"
			className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4"
		>
			{/* Thumbnail Rail (Horizontal on mobile, Vertical on desktop) */}
			{galleryItems.length > 1 && (
				<ul
					aria-label={`${productName} thumbnails for ${selectedColorName || "product"}`}
					className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1 lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:pb-0"
				>
					{galleryItems.map((item, idx) => {
						const isActive = idx === safeIndex;
						const thumbUrl =
							item.mediaType === "image"
								? buildFashionImageUrl(item.url, { width: 400 })
								: "";

						return (
							<li key={item.id} className="shrink-0">
								<button
									type="button"
									onClick={() => setActiveIndex(idx)}
									aria-label={`View image ${idx + 1} of ${galleryItems.length}${item.colorName ? ` (${item.colorName})` : ""}`}
									aria-current={isActive ? "true" : undefined}
									className={cn(
										"relative aspect-3/4 w-16 overflow-hidden border bg-studio transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:w-full",
										isActive
											? "border-foreground"
											: "border-border opacity-70 hover:opacity-100",
									)}
								>
									{item.mediaType === "video" ? (
										<div className="flex h-full w-full items-center justify-center bg-secondary text-foreground">
											<Play className="h-4 w-4 stroke-[1.5]" />
										</div>
									) : thumbUrl && !failedIds[item.id] ? (
										<img
											src={thumbUrl}
											alt={
												item.altText || `${productName} thumbnail ${idx + 1}`
											}
											loading="lazy"
											decoding="async"
											referrerPolicy="no-referrer"
											onError={() =>
												setFailedIds((prev) => ({ ...prev, [item.id]: true }))
											}
											className="h-full w-full object-cover object-top"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-secondary font-mono text-[10px] text-muted-foreground">
											{idx + 1}
										</div>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			)}

			{/* Primary 3:4 Studio Frame */}
			<div className="relative flex-1">
				<div
					className="relative aspect-3/4 w-full overflow-hidden border border-border bg-studio bg-cover bg-center"
					style={
						activeLqipUrl
							? { backgroundImage: `url(${activeLqipUrl})` }
							: undefined
					}
				>
					{activeItem?.mediaType === "video" &&
					isSafeImageUrl(activeItem.url) ? (
						<video
							key={activeItem.id}
							src={activeItem.url}
							controls
							playsInline
							aria-label={activeItem.altText || productName}
							className="h-full w-full object-cover object-center"
						>
							<track kind="captions" />
						</video>
					) : activeItem && activeImageUrl && !activeFailed ? (
						<img
							key={activeItem.id}
							src={activeImageUrl}
							srcSet={activeSrcSet || undefined}
							sizes="(max-width: 1024px) 100vw, 55vw"
							alt={
								activeItem.altText ||
								`${productName}${selectedColorName ? ` in ${selectedColorName}` : ""}`
							}
							loading={safeIndex === 0 ? "eager" : "lazy"}
							decoding="async"
							fetchPriority={safeIndex === 0 ? "high" : "auto"}
							referrerPolicy="no-referrer"
							onError={() =>
								setFailedIds((prev) => ({
									...prev,
									[activeItem.id]: true,
								}))
							}
							className="h-full w-full object-cover object-top transition-opacity duration-200"
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center bg-secondary px-6 text-center">
							<span className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
								NOCTURA Studio
							</span>
							<span className="mt-2 font-display text-base text-foreground">
								{productName}
							</span>
							{selectedColorName && (
								<span className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
									{selectedColorName}
								</span>
							)}
						</div>
					)}

					{galleryItems.length > 1 && (
						<>
							<button
								type="button"
								onClick={handlePrev}
								aria-label="Previous gallery image"
								className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-border bg-background/85 text-foreground backdrop-blur-xs transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<ChevronLeft className="h-4 w-4 stroke-[1.5]" />
							</button>
							<button
								type="button"
								onClick={handleNext}
								aria-label="Next gallery image"
								className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-border bg-background/85 text-foreground backdrop-blur-xs transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<ChevronRight className="h-4 w-4 stroke-[1.5]" />
							</button>

							<div className="pointer-events-none absolute bottom-3 right-3 border border-border bg-background/85 px-2.5 py-1 font-mono text-[11px] tabular-nums text-foreground backdrop-blur-xs">
								{safeIndex + 1} / {galleryItems.length}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
