import type { StorefrontProductDetail } from "@/lib/queries/storefront-catalog";
import { cn } from "@/lib/utils";

export interface ColorSwatchPickerProps {
	colors: StorefrontProductDetail["colors"];
	selectedColorName: string;
	onSelectColor: (colorName: string) => void;
}

export function ColorSwatchPicker({
	colors,
	selectedColorName,
	onSelectColor,
}: ColorSwatchPickerProps) {
	if (colors.length === 0) {
		return null;
	}

	const activeColor =
		colors.find(
			(color) =>
				color.colorName.toLowerCase() === selectedColorName.toLowerCase(),
		) ?? colors[0];

	return (
		<div className="space-y-3 border-t border-border pt-5">
			<div className="flex items-center justify-between text-xs">
				<span className="font-mono uppercase tracking-[0.08em] text-muted-foreground">
					Colour
				</span>
				<span
					data-testid="pdp-selected-color-label"
					className="font-medium text-foreground"
				>
					{activeColor.colorName}
					{!activeColor.inStock ? " — Sold Out" : ""}
				</span>
			</div>

			<fieldset
				aria-label="Select colour"
				className="m-0 flex flex-wrap items-center gap-2 border-0 p-0"
			>
				{colors.map((color) => {
					const isActive =
						color.colorName.toLowerCase() ===
						activeColor.colorName.toLowerCase();

					return (
						<button
							key={color.colorName}
							type="button"
							onClick={() => onSelectColor(color.colorName)}
							aria-pressed={isActive}
							aria-label={`Select colour ${color.colorName}${color.inStock ? "" : " (out of stock)"}`}
							title={color.colorName}
							className={cn(
								"relative flex h-8 w-8 items-center justify-center rounded-none border p-0.75 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
								isActive
									? "border-foreground"
									: "border-border hover:border-foreground/60",
								!color.inStock && "opacity-60",
							)}
						>
							<span
								className="block h-full w-full border border-black/15 dark:border-white/15"
								style={{ backgroundColor: color.colorHex }}
							/>
							{!color.inStock && (
								<span
									aria-hidden="true"
									className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_left,transparent_47%,hsl(var(--foreground)/0.75)_48%,hsl(var(--foreground)/0.75)_52%,transparent_53%)]"
								/>
							)}
						</button>
					);
				})}
			</fieldset>
		</div>
	);
}
