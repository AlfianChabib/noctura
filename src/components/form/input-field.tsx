import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormFieldShell } from "./field-shell";
import { formatFieldErrors, useFieldContext } from "./form-context";

export interface InputFieldProps {
	label: string;
	description?: string;
	id?: string;
	type?: React.HTMLInputTypeAttribute;
	placeholder?: string;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	readOnly?: boolean;
	className?: string;
	inputClassName?: string;
	onValueChange?: (value: string) => void;
}

export function InputField({
	label,
	description,
	id,
	type = "text",
	placeholder,
	min,
	max,
	step,
	disabled,
	readOnly,
	className,
	inputClassName,
	onValueChange,
}: InputFieldProps) {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const field = useFieldContext<string | number | null | undefined>();
	const error = formatFieldErrors(field.state.meta.errors);

	const displayValue =
		type === "number" ? field.state.value || "" : (field.state.value ?? "");

	return (
		<FormFieldShell
			label={label}
			htmlFor={inputId}
			description={description}
			error={error}
			className={className}
		>
			<Input
				id={inputId}
				type={type}
				min={min}
				max={max}
				step={step}
				disabled={disabled}
				readOnly={readOnly}
				value={displayValue}
				onBlur={field.handleBlur}
				onChange={(e) => {
					const raw = e.target.value;
					if (type === "number") {
						field.handleChange(Number.parseInt(raw || "0", 10));
					} else {
						field.handleChange(raw);
					}
					onValueChange?.(raw);
				}}
				placeholder={placeholder}
				aria-invalid={Boolean(error)}
				className={cn(
					type === "number" && "font-mono",
					inputClassName,
					error && "border-destructive",
				)}
			/>
		</FormFieldShell>
	);
}
