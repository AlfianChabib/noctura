import { Loader2, Save } from "lucide-react";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useFormContext } from "./form-context";

export interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
	isPending?: boolean;
	icon?: ReactNode;
}

export function SubmitButton({
	isPending = false,
	icon,
	disabled,
	children,
	size = "sm",
	...props
}: SubmitButtonProps) {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => {
				const loading = isSubmitting || isPending;
				return (
					<Button
						type="submit"
						size={size}
						disabled={disabled || loading}
						{...props}
					>
						{loading ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							(icon ?? <Save className="h-3.5 w-3.5" />)
						)}
						{children}
					</Button>
				);
			}}
		</form.Subscribe>
	);
}
