import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldShellProps {
	label: string;
	htmlFor?: string;
	description?: string;
	error?: string | null;
	className?: string;
	labelClassName?: string;
	children: ReactNode;
}

export function FormFieldShell({
	label,
	htmlFor,
	description,
	error,
	className,
	labelClassName,
	children,
}: FormFieldShellProps) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label htmlFor={htmlFor} className={labelClassName}>
				{label}
			</Label>
			{children}
			{description && !error && (
				<p className="text-[11px] text-muted-foreground">{description}</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
}
