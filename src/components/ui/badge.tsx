import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center justify-center rounded-none font-medium leading-none whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
	{
		variants: {
			variant: {
				default:
					"border border-transparent bg-primary text-primary-foreground",
				secondary:
					"border border-transparent bg-secondary text-secondary-foreground hover:bg-accent",
				outline:
					"border border-border bg-transparent text-foreground",
				editorial:
					"border border-foreground/25 bg-background text-foreground tracking-[0.1em] uppercase",
				sale:
					"border border-destructive/30 bg-destructive/10 text-destructive tracking-[0.08em] uppercase",
				muted:
					"border border-transparent bg-muted text-muted-foreground tracking-[0.06em] uppercase",
			},
			size: {
				default: "px-2 py-1 text-[11px]",
				sm: "px-1.5 py-0.5 text-[10px]",
				lg: "px-2.5 py-1.5 text-xs tracking-[0.1em]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
	return (
		<div
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
