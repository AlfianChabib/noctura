import { motion } from "framer-motion";
import type * as React from "react";
import { COS_SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface CategoryPillItem {
	id: string;
	label: string;
	count?: number;
}

interface CategoryPillsNavProps {
	categories: (CategoryPillItem | string)[];
	activeCategory: string;
	onSelectCategory: (id: string) => void;
	className?: string;
	layoutIdPrefix?: string;
}

export const CategoryPillsNav: React.FC<CategoryPillsNavProps> = ({
	categories,
	activeCategory,
	onSelectCategory,
	className,
	layoutIdPrefix = "category-pills",
}) => {
	const normalizedItems: CategoryPillItem[] = categories.map((cat) =>
		typeof cat === "string" ? { id: cat, label: cat } : cat,
	);

	return (
		<nav
			aria-label="Category quick navigation"
			className={cn("w-full overflow-hidden", className)}
		>
			<div
				role="tablist"
				aria-orientation="horizontal"
				className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
			>
				{normalizedItems.map((item) => {
					const isActive = activeCategory === item.id;
					return (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							onClick={() => onSelectCategory(item.id)}
							className={cn(
								"group relative inline-flex items-center whitespace-nowrap rounded-none border px-3.5 py-1.5 text-xs font-mono tracking-[0.06em] uppercase transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0",
								isActive
									? "border-foreground bg-foreground text-background font-medium"
									: "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
							)}
						>
							{isActive && (
								<motion.span
									layoutId={`${layoutIdPrefix}-active-bg`}
									transition={COS_SPRING}
									className="absolute inset-0 bg-foreground -z-10"
								/>
							)}
							<span>{item.label}</span>
							{typeof item.count === "number" && (
								<span
									className={cn(
										"ml-1.5 text-[10px] tabular-nums transition-opacity",
										isActive
											? "text-background/80"
											: "text-muted-foreground group-hover:text-foreground",
									)}
								>
									{item.count}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</nav>
	);
};
