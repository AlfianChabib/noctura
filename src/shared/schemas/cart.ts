import { z } from "zod";

export const MAX_GUEST_CART_ITEMS = 50;
export const MAX_CART_ITEM_QUANTITY = 99;

/**
 * Strict schema for persisted guest cart items.
 * Deliberately excludes price fields so pricing cannot be tampered in localStorage.
 */
export const guestCartItemSchema = z.strictObject({
	variantId: z.uuid({ error: "Variant ID must be a valid UUID." }),
	quantity: z
		.number()
		.int({ error: "Quantity must be a whole integer." })
		.min(1, "Quantity must be at least 1.")
		.max(
			MAX_CART_ITEM_QUANTITY,
			`Quantity cannot exceed ${MAX_CART_ITEM_QUANTITY}.`,
		),
});

export type GuestCartItem = z.infer<typeof guestCartItemSchema>;

export const guestCartStateSchema = z.strictObject({
	items: z
		.array(guestCartItemSchema)
		.max(
			MAX_GUEST_CART_ITEMS,
			`Guest cart cannot exceed ${MAX_GUEST_CART_ITEMS} distinct variants.`,
		),
});

export type GuestCartState = z.infer<typeof guestCartStateSchema>;

/**
 * Validates the full Zustand `persist` StorageValue envelope stored in localStorage.
 */
export const guestCartStorageSchema = z.strictObject({
	state: guestCartStateSchema,
	version: z.number().int().nonnegative().optional(),
});

export type GuestCartStorageValue = z.infer<typeof guestCartStorageSchema>;

/**
 * Query schema for resolving authoritative variant pricing and stock from the database.
 */
export const resolveCartVariantsQuerySchema = z.object({
	ids: z
		.union([z.string(), z.array(z.string())])
		.transform((val) => {
			const raw = Array.isArray(val) ? val : val.split(",");
			return Array.from(
				new Set(
					raw.map((item) => item.trim()).filter((item) => item.length > 0),
				),
			);
		})
		.pipe(
			z
				.array(z.uuid({ error: "Each variant ID must be a valid UUID." }))
				.max(
					MAX_GUEST_CART_ITEMS,
					`Cannot resolve more than ${MAX_GUEST_CART_ITEMS} variants at once.`,
				),
		),
});

export type ResolveCartVariantsQuery = z.infer<
	typeof resolveCartVariantsQuerySchema
>;
