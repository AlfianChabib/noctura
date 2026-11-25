import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadMorePaginationProps {
	currentPage: number;
	totalPages: number;
	currentCount: number;
	totalCount: number;
	onPageChange: (page: number) => void;
	onLoadNextPage?: () => void;
	isLoading?: boolean;
	className?: string;
}

export const LoadMorePagination: React.FC<LoadMorePaginationProps> = ({
	currentPage,
	totalPages,
	currentCount,
	totalCount,
	onPageChange,
	onLoadNextPage,
	isLoading = false,
	className,
}) => {
	const hasNextPage = currentPage < totalPages;

	const handleLoadNext = () => {
		if (isLoading || !hasNextPage) return;
		if (onLoadNextPage) {
			onLoadNextPage();
		} else {
			onPageChange(currentPage + 1);
		}
	};

	const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

	return (
		<div
			className={cn(
				"w-full flex flex-col items-center justify-center pt-12 pb-6 space-y-6",
				className,
			)}
		>
			<div className="flex flex-col items-center space-y-2 text-center">
				<p className="font-mono text-xs text-muted-foreground uppercase tracking-widest tabular-nums">
					Viewing {currentCount} of {totalCount}{" "}
					{totalCount === 1 ? "piece" : "pieces"}
				</p>
				<div className="w-48 sm:w-64 h-0.5 bg-border overflow-hidden">
					<div
						className="h-full bg-foreground transition-all duration-300"
						style={{
							width: `${totalCount > 0 ? Math.min(100, Math.round((currentCount / totalCount) * 100)) : 0}%`,
						}}
					/>
				</div>
			</div>

			{hasNextPage && (
				<button
					type="button"
					onClick={handleLoadNext}
					disabled={isLoading}
					className="group relative flex min-h-13 w-full max-w-md items-center justify-between rounded-none bg-foreground px-6 py-3.5 text-sm font-sans font-medium uppercase tracking-[0.06em] text-background transition-colors duration-300 hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					<span>{isLoading ? "Loading Next Pieces..." : "Load Next Page"}</span>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin text-background" />
					) : (
						<ArrowRight className="h-4 w-4 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1" />
					)}
				</button>
			)}

			{totalPages > 1 && (
				<nav
					aria-label="Pagination"
					className="flex items-center justify-center gap-1 pt-2"
				>
					<button
						type="button"
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage <= 1 || isLoading}
						aria-label="Go to previous page"
						className="flex h-10 w-10 items-center justify-center rounded-none text-foreground transition-colors hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<ChevronLeft className="h-4 w-4 stroke-[1.5]" />
					</button>

					{pageNumbers.map((page) => {
						const isActive = page === currentPage;
						return (
							<button
								key={page}
								type="button"
								onClick={() => onPageChange(page)}
								disabled={isLoading}
								aria-current={isActive ? "page" : undefined}
								aria-label={`Page ${page}`}
								className={cn(
									"flex h-10 w-10 items-center justify-center rounded-none text-xs font-sans transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
									isActive
										? "font-semibold text-foreground border-b-2 border-foreground"
										: "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-foreground/30",
								)}
							>
								{page}
							</button>
						);
					})}

					<button
						type="button"
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage >= totalPages || isLoading}
						aria-label="Go to next page"
						className="flex h-10 w-10 items-center justify-center rounded-none text-foreground transition-colors hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<ChevronRight className="h-4 w-4 stroke-[1.5]" />
					</button>
				</nav>
			)}
		</div>
	);
};
