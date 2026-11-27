import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CATALOG_SORT_OPTIONS,
	type CatalogSortOption,
} from "@/shared/schemas/catalog";

const SORT_LABELS: Record<CatalogSortOption, string> = {
	newest: "New Arrivals",
	popularity: "Most Popular",
	price_asc: "Price: Low to High",
	price_desc: "Price: High to Low",
};

export interface SortDropdownProps {
	value: CatalogSortOption;
	onChange: (value: CatalogSortOption) => void;
	className?: string;
}

export function SortDropdown({
	value,
	onChange,
	className,
}: SortDropdownProps) {
	return (
		<div className="flex items-center gap-2">
			<span className="hidden text-[11px] font-mono uppercase tracking-wider text-muted-foreground sm:inline-block">
				Sort
			</span>
			<Select
				value={value}
				onValueChange={(next) => onChange(next as CatalogSortOption)}
			>
				<SelectTrigger
					size="sm"
					aria-label="Sort products"
					className={
						className ??
						"h-9 min-w-44 rounded-none border-border text-xs font-mono uppercase tracking-[0.04em]"
					}
				>
					<SelectValue placeholder="Sort by" />
				</SelectTrigger>
				<SelectContent>
					{CATALOG_SORT_OPTIONS.map((option) => (
						<SelectItem
							key={option}
							value={option}
							className="text-xs font-mono uppercase tracking-[0.04em]"
						>
							{SORT_LABELS[option]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
