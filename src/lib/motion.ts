import type { Transition, Variants } from "framer-motion";

/**
 * Editorial architectural easing — smooth deceleration with zero overshoot.
 * Calibrated for minimalist European luxury retail micro-interactions.
 */
export const COS_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const COS_SPRING: Transition = {
	type: "spring",
	stiffness: 280,
	damping: 34,
	mass: 0.9,
};

export const COS_SUBTLE_TRANSITION: Transition = {
	duration: 0.32,
	ease: COS_EASE,
};

export const COS_IMAGE_TRANSITION: Transition = {
	duration: 0.65,
	ease: COS_EASE,
};

export const dropdownFadeVariants: Variants = {
	hidden: {
		opacity: 0,
		y: -6,
		transition: { duration: 0.2, ease: COS_EASE },
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.34, ease: COS_EASE },
	},
	exit: {
		opacity: 0,
		y: -4,
		transition: { duration: 0.22, ease: COS_EASE },
	},
};

export const quickAddVariants: Variants = {
	rest: {
		opacity: 0,
		y: 8,
		transition: { duration: 0.22, ease: COS_EASE },
	},
	hover: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.3, ease: COS_EASE },
	},
};

export const backdropVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { duration: 0.28, ease: COS_EASE },
	},
	exit: {
		opacity: 0,
		transition: { duration: 0.22, ease: COS_EASE },
	},
};

export const sheetRightVariants: Variants = {
	hidden: { x: "100%" },
	visible: {
		x: 0,
		transition: { type: "spring", stiffness: 300, damping: 36, mass: 0.95 },
	},
	exit: {
		x: "100%",
		transition: { duration: 0.26, ease: COS_EASE },
	},
};

export const sheetLeftVariants: Variants = {
	hidden: { x: "-100%" },
	visible: {
		x: 0,
		transition: { type: "spring", stiffness: 300, damping: 36, mass: 0.95 },
	},
	exit: {
		x: "-100%",
		transition: { duration: 0.24, ease: COS_EASE },
	},
};

export const modalDialogVariants: Variants = {
	hidden: {
		opacity: 0,
		scale: 0.985,
		y: 8,
	},
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: { duration: 0.32, ease: COS_EASE },
	},
	exit: {
		opacity: 0,
		scale: 0.99,
		y: 4,
		transition: { duration: 0.2, ease: COS_EASE },
	},
};
