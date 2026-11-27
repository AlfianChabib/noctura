import { createFormHook } from "@tanstack/react-form";
import { CheckboxGroupField } from "./checkbox-group-field";
import { fieldContext, formContext } from "./form-context";
import { InputField } from "./input-field";
import { SelectField } from "./select-field";
import { SubmitButton } from "./submit-button";
import { TextareaField } from "./textarea-field";

export const {
	useAppForm,
	withForm,
	withFieldGroup,
	useTypedAppFormContext,
	extendForm,
} = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		InputField,
		TextareaField,
		SelectField,
		CheckboxGroupField,
	},
	formComponents: {
		SubmitButton,
	},
});

export {
	CheckboxGroupField,
	type CheckboxGroupFieldProps,
} from "./checkbox-group-field";
export { FormFieldShell, type FormFieldShellProps } from "./field-shell";
export {
	fieldContext,
	formatFieldErrors,
	formatFormError,
	formContext,
	useFieldContext,
	useFormContext,
	validateWithZodSchema,
} from "./form-context";
export { InputField, type InputFieldProps } from "./input-field";
export {
	SelectField,
	type SelectFieldOption,
	type SelectFieldProps,
} from "./select-field";
export { SubmitButton, type SubmitButtonProps } from "./submit-button";
export { TextareaField, type TextareaFieldProps } from "./textarea-field";
