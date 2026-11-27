import { useId } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FormFieldShell } from "./field-shell";
import { formatFieldErrors, useFieldContext } from "./form-context";

export interface SelectFieldOption {
	value: string;
	label: string;
}

export interface SelectFieldProps {
	label: string;
	options: readonly SelectFieldOption[];
	placeholder?: string;
	description?: string;
	id?: string;
	nullable?: boolean;
	emptyLabel?: string;
	disabled?: boolean;
	className?: string;
	triggerClassName?: string;
}

const NONE_VALUE = "__none__";

export function SelectField({
	label,
	options,
	placeholder,
	description,
	id,
	nullable = false,
	emptyLabel = "Tidak dipilih",
	disabled,
	className,
	triggerClassName,
}: SelectFieldProps) {
	const generatedId = useId();
	const triggerId = id ?? generatedId;
	const field = useFieldContext<string | null | undefined>();
	const error = formatFieldErrors(field.state.meta.errors);

	const currentValue = nullable
		? (field.state.value ?? NONE_VALUE)
		: (field.state.value ?? "");

	return (
		<FormFieldShell
			label={label}
			htmlFor={triggerId}
			description={description}
			error={error}
			className={className}
		>
			<Select
				value={currentValue}
				disabled={disabled}
				onValueChange={(nextValue) => {
					if (nullable && nextValue === NONE_VALUE) {
						field.handleChange(null);
					} else {
						field.handleChange(nextValue);
					}
				}}
			>
				<SelectTrigger
					id={triggerId}
					aria-invalid={Boolean(error)}
					className={cn(
						"w-full",
						triggerClassName,
						error && "border-destructive",
					)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{nullable && <SelectItem value={NONE_VALUE}>{emptyLabel}</SelectItem>}
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FormFieldShell>
	);
}
