import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";
import { backdropVariants, modalDialogVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
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
				"fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
				className,
			)}
		/>
	</DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
	React.ComponentRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPortal forceMount>
		<DialogOverlay />
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
			<DialogPrimitive.Content ref={ref} asChild {...props}>
				<motion.div
					variants={modalDialogVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					className={cn(
						"pointer-events-auto relative grid w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none border border-border bg-background text-foreground shadow-none focus:outline-none",
						className,
					)}
				>
					{children}
					<DialogPrimitive.Close
						aria-label="Close modal"
						className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-none bg-background/85 text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<X className="h-4 w-4 stroke-[1.5]" />
					</DialogPrimitive.Close>
				</motion.div>
			</DialogPrimitive.Content>
		</div>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
	React.ComponentRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn(
			"font-display text-xl font-medium tracking-[-0.02em] text-foreground",
			className,
		)}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ComponentRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
