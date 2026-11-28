import { AnimatePresence } from "framer-motion";
import { Ruler } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { StorefrontProductDetail } from "@/lib/queries/storefront-catalog";
import { cn } from "@/lib/utils";
import type { SizeGuideUnit } from "@/shared/schemas/catalog";

export interface SizeGuideModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sizeGuide: NonNullable<StorefrontProductDetail["sizeGuide"]>;
	productName: string;
	fitType?: string | null;
}

const KNOWN_DIMENSION_LABELS: Record<string, string> = {
	chestWidthCm: "Chest Width",
	bodyLengthCm: "Body Length",
	waistWidthCm: "Waist Width",
	hipWidthCm: "Hip Width",
	sleeveLengthCm: "Sleeve Length",
	shoulderWidthCm: "Shoulder Width",
	inseamCm: "Inseam",
};

function formatDimensionHeader(key: string): string {
	if (KNOWN_DIMENSION_LABELS[key]) {
		return KNOWN_DIMENSION_LABELS[key];
	}
	return key
		.replace(/Cm$/i, "")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function convertMeasurementValue(
	value: string | number | undefined,
	sourceUnit: SizeGuideUnit,
	targetUnit: SizeGuideUnit,
): string {
	if (value === undefined || value === null || value === "") {
		return "—";
	}
	if (typeof value === "string") {
		return value;
	}
	if (sourceUnit === targetUnit) {
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}
	const converted =
		sourceUnit === "cm" && targetUnit === "inch" ? value / 2.54 : value * 2.54;
	return converted.toFixed(1);
}

export function SizeGuideModal({
	open,
	onOpenChange,
	sizeGuide,
	productName,
	fitType,
}: SizeGuideModalProps) {
	const sourceUnit: SizeGuideUnit = sizeGuide.measurementsJson.unit ?? "cm";
	const [displayUnit, setDisplayUnit] = useState<SizeGuideUnit>(sourceUnit);

	useEffect(() => {
		setDisplayUnit(sourceUnit);
	}, [sourceUnit]);

	const dimensionColumns = useMemo(() => {
		const keys: string[] = [];
		const seen = new Set<string>();
		for (const row of sizeGuide.measurementsJson.rows) {
			for (const [key, val] of Object.entries(row)) {
				if (key === "size" || val === undefined || seen.has(key)) continue;
				seen.add(key);
				keys.push(key);
			}
		}
		return keys;
	}, [sizeGuide.measurementsJson.rows]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<AnimatePresence>
				{open && (
					<DialogContent className="max-w-2xl p-6 sm:p-8">
						<div className="space-y-6">
							<div className="space-y-2 pr-10">
								<div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
									<Ruler className="h-3.5 w-3.5 stroke-[1.5]" />
									<span>{sizeGuide.garmentType}</span>
									{fitType && (
										<>
											<span aria-hidden="true">/</span>
											<span>{fitType}</span>
										</>
									)}
								</div>
								<DialogTitle>{sizeGuide.name}</DialogTitle>
								<DialogDescription>
									Garment measurements for {productName}. Measure a similar
									piece laid flat and compare against the matrix below.
								</DialogDescription>
							</div>

							{/* Unit Switcher (cm / inch) */}
							<div className="flex items-center justify-between border-y border-border py-3">
								<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
									Measurement Unit
								</span>
								<fieldset
									aria-label="Measurement unit"
									className="m-0 inline-flex border border-border p-0"
								>
									{(["cm", "inch"] as const).map((unit) => {
										const active = displayUnit === unit;
										return (
											<button
												key={unit}
												type="button"
												onClick={() => setDisplayUnit(unit)}
												aria-pressed={active}
												className={cn(
													"px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
													active
														? "bg-primary text-primary-foreground"
														: "bg-background text-muted-foreground hover:text-foreground",
												)}
											>
												{unit}
											</button>
										);
									})}
								</fieldset>
							</div>

							{/* Measurement Matrix Table */}
							<div className="overflow-x-auto border border-border">
								<table className="w-full border-collapse text-left text-xs">
									<thead>
										<tr className="border-b border-border bg-secondary/50">
											<th
												scope="col"
												className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-foreground"
											>
												Size
											</th>
											{dimensionColumns.map((columnKey) => (
												<th
													key={columnKey}
													scope="col"
													className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
												>
													{formatDimensionHeader(columnKey)} ({displayUnit})
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{sizeGuide.measurementsJson.rows.map((row) => (
											<tr
												key={row.size}
												className="transition-colors hover:bg-secondary/25"
											>
												<th
													scope="row"
													className="px-4 py-3 font-mono font-medium text-foreground"
												>
													{row.size}
												</th>
												{dimensionColumns.map((columnKey) => (
													<td
														key={`${row.size}-${columnKey}`}
														className="px-4 py-3 tabular-nums text-foreground/85"
													>
														{convertMeasurementValue(
															row[columnKey],
															sourceUnit,
															displayUnit,
														)}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Model Note & Measuring Instructions */}
							<div className="grid gap-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground sm:grid-cols-2">
								<div className="space-y-1">
									<p className="font-mono text-[11px] uppercase tracking-wider text-foreground">
										How to Measure
									</p>
									<p>
										Lay a well-fitting garment flat. Measure chest width 2.5 cm
										below the armhole seam, and body length from the highest
										shoulder point to the hem.
									</p>
								</div>
								{sizeGuide.modelNote ? (
									<div className="space-y-1">
										<p className="font-mono text-[11px] uppercase tracking-wider text-foreground">
											Model &amp; Fit Note
										</p>
										<p>{sizeGuide.modelNote}</p>
									</div>
								) : (
									<div className="space-y-1">
										<p className="font-mono text-[11px] uppercase tracking-wider text-foreground">
											Tolerance &amp; Exchange
										</p>
										<p>
											Allow a ±1 cm tolerance due to fabric drape and finishing.
											Complimentary 7-day size exchange applies on unworn
											pieces.
										</p>
									</div>
								)}
							</div>
						</div>
					</DialogContent>
				)}
			</AnimatePresence>
		</Dialog>
	);
}
