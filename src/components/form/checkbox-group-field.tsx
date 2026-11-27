import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatFieldErrors, useFieldContext } from "./form-context";
import type { SelectFieldOption } from "./select-field";

export interface CheckboxGroupFieldProps {
	label: string;
	options: readonly SelectFieldOption[];
	emptyMessage?: string;
	idPrefix?: string;
	className?: string;
	listClassName?: string;
}

export function CheckboxGroupField({
	label,
	options,
	emptyMessage = "Belum ada opsi tersedia.",
	idPrefix,
	className,
	listClassName,
}: CheckboxGroupFieldProps) {
	const generatedPrefix = useId();
	const prefix = idPrefix ?? generatedPrefix;
	const field = useFieldContext<string[]>();
	const error = formatFieldErrors(field.state.meta.errors);
	const selectedValues = field.state.value ?? [];

	return (
		<div className={cn("space-y-2", className)}>
			<Label className="text-xs uppercase tracking-wider text-muted-foreground">
				{label}
			</Label>
			{options.length === 0 ? (
				<p className="text-xs text-muted-foreground">{emptyMessage}</p>
			) : (
				<div
					className={cn(
						"space-y-2 max-h-44 overflow-y-auto pr-1",
						listClassName,
					)}
				>
					{options.map((option) => {
						const checkboxId = `${prefix}-${option.value}`;
						const checked = selectedValues.includes(option.value);
						return (
							<div
								key={option.value}
								className="flex items-center gap-2.5 text-xs"
							>
								<Checkbox
									id={checkboxId}
									checked={checked}
									onCheckedChange={(nextChecked) => {
										if (nextChecked) {
											field.handleChange([...selectedValues, option.value]);
										} else {
											field.handleChange(
												selectedValues.filter((val) => val !== option.value),
											);
										}
									}}
								/>
								<label htmlFor={checkboxId} className="cursor-pointer">
									{option.label}
								</label>
							</div>
						);
					})}
				</div>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
