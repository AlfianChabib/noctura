import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";
import {
	backdropVariants,
	sheetLeftVariants,
	sheetRightVariants,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
	React.ComponentRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay ref={ref} asChild {...props}>
		<motion.div
			variants={backdropVariants}
			initial="hidden"
			animate="visible"
			exit="exit"
			className={cn(
				"fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]",
				className,
			)}
		/>
	</DialogPrimitive.Overlay>
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface SheetContentProps
	extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
	side?: "left" | "right";
}

const SheetContent = React.forwardRef<
	React.ComponentRef<typeof DialogPrimitive.Content>,
	SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
	<SheetPortal forceMount>
		<SheetOverlay />
		<DialogPrimitive.Content ref={ref} asChild {...props}>
			<motion.div
				variants={side === "right" ? sheetRightVariants : sheetLeftVariants}
				initial="hidden"
				animate="visible"
				exit="exit"
				className={cn(
					"fixed inset-y-0 z-50 flex w-full flex-col rounded-none bg-background text-foreground focus:outline-none sm:max-w-[440px]",
					side === "right"
						? "right-0 border-l border-border"
						: "left-0 border-r border-border",
					className,
				)}
			>
				{children}
				<DialogPrimitive.Close
					aria-label="Close panel"
					className="absolute right-5 top-4 inline-flex h-10 w-10 items-center justify-center rounded-none text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				>
					<X className="h-4 w-4 stroke-[1.5]" />
				</DialogPrimitive.Close>
			</motion.div>
		</DialogPrimitive.Content>
	</SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetTitle = React.forwardRef<
	React.ComponentRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn(
			"font-display text-sm font-medium tracking-[0.06em] uppercase text-foreground",
			className,
		)}
		{...props}
	/>
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
	React.ComponentRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn("text-xs text-muted-foreground", className)}
		{...props}
	/>
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetOverlay,
	SheetPortal,
	SheetTitle,
	SheetTrigger,
};
