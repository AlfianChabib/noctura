import type * as React from "react";
import type { GridDensity } from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

interface GridDensitySwitchProps {
	density: GridDensity;
	onChangeDensity: (density: GridDensity) => void;
	className?: string;
}

interface DensityOption {
	id: GridDensity;
	label: string;
	title: string;
	icon: React.ReactNode;
}

export const GridDensitySwitch: React.FC<GridDensitySwitchProps> = ({
	density,
	onChangeDensity,
	className,
}) => {
	const options: DensityOption[] = [
		{
			id: "2",
			label: "2 Columns",
			title: "2 Columns (Editorial scale)",
			icon: (
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="currentColor"
					aria-hidden="true"
					className="shrink-0"
				>
					<rect x="1" y="2" width="5" height="10" />
					<rect x="8" y="2" width="5" height="10" />
				</svg>
			),
		},
		{
			id: "3",
			label: "3 Columns",
			title: "3 Columns (Standard view)",
			icon: (
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="currentColor"
					aria-hidden="true"
					className="shrink-0"
				>
					<rect x="1" y="2" width="3" height="10" />
					<rect x="5.5" y="2" width="3" height="10" />
					<rect x="10" y="2" width="3" height="10" />
				</svg>
			),
		},
		{
			id: "4",
			label: "4 Columns",
			title: "4 Columns (Dense catalog)",
			icon: (
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="currentColor"
					aria-hidden="true"
					className="shrink-0"
				>
					<rect x="1" y="2" width="2.2" height="10" />
					<rect x="4.4" y="2" width="2.2" height="10" />
					<rect x="7.8" y="2" width="2.2" height="10" />
					<rect x="11" y="2" width="2.2" height="10" />
				</svg>
			),
		},
		{
			id: "minimal",
			label: "Lookbook",
			title: "Minimal Lookbook Mode (Pure imagery)",
			icon: (
				<svg
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					aria-hidden="true"
					className="shrink-0"
				>
					<rect x="1.5" y="1.5" width="11" height="11" />
					<circle cx="7" cy="7" r="2" fill="currentColor" />
				</svg>
			),
		},
	];

	return (
		<div
			role="toolbar"
			aria-label="Grid layout density"
			className={cn(
				"inline-flex items-center rounded-none border border-border divide-x divide-border bg-background",
				className,
			)}
		>
			{options.map((opt) => {
				const isActive = density === opt.id;
				return (
					<button
						key={opt.id}
						type="button"
						onClick={() => onChangeDensity(opt.id)}
						aria-label={opt.label}
						aria-pressed={isActive}
						title={opt.title}
						className={cn(
							"inline-flex h-9 w-9 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:z-10",
							isActive
								? "bg-foreground text-background font-medium"
								: "bg-background text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
						)}
					>
						{opt.icon}
					</button>
				);
			})}
		</div>
	);
};
