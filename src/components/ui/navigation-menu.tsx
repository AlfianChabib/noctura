import { cva } from "class-variance-authority";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

const NavigationMenu = React.forwardRef<
	React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
	<NavigationMenuPrimitive.Root
		ref={ref}
		className={cn("relative z-20 flex items-center justify-center", className)}
		{...props}
	>
		{children}
	</NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
	React.ComponentRef<typeof NavigationMenuPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.List
		ref={ref}
		className={cn(
			"group flex flex-1 list-none items-center justify-center gap-7",
			className,
		)}
		{...props}
	/>
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
	"group relative inline-flex h-10 items-center justify-center whitespace-nowrap shrink-0 rounded-none bg-transparent px-0 py-2 text-[13px] font-normal tracking-[0.02em] text-foreground/80 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:text-foreground data-[state=open]:text-foreground",
);

const NavigationMenuTrigger = React.forwardRef<
	React.ComponentRef<typeof NavigationMenuPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<NavigationMenuPrimitive.Trigger
		ref={ref}
		className={cn(navigationMenuTriggerStyle(), className)}
		{...props}
	>
		{children}
	</NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuLink = React.forwardRef<
	React.ComponentRef<typeof NavigationMenuPrimitive.Link>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.Link
		ref={ref}
		className={cn(navigationMenuTriggerStyle(), className)}
		{...props}
	/>
));
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

export {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
};
