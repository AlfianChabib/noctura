import { useId } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FormFieldShell } from "./field-shell";
import { formatFieldErrors, useFieldContext } from "./form-context";

export interface TextareaFieldProps {
	label: string;
	description?: string;
	id?: string;
	rows?: number;
	placeholder?: string;
	disabled?: boolean;
	readOnly?: boolean;
	className?: string;
	textareaClassName?: string;
}

export function TextareaField({
	label,
	description,
	id,
	rows = 3,
	placeholder,
	disabled,
	readOnly,
	className,
	textareaClassName,
}: TextareaFieldProps) {
	const generatedId = useId();
	const textareaId = id ?? generatedId;
	const field = useFieldContext<string | null | undefined>();
	const error = formatFieldErrors(field.state.meta.errors);

	return (
		<FormFieldShell
			label={label}
			htmlFor={textareaId}
			description={description}
			error={error}
			className={className}
		>
			<Textarea
				id={textareaId}
				rows={rows}
				disabled={disabled}
				readOnly={readOnly}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				placeholder={placeholder}
				aria-invalid={Boolean(error)}
				className={cn(textareaClassName, error && "border-destructive")}
			/>
		</FormFieldShell>
	);
}
