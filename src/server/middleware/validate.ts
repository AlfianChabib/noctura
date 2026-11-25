import type { ValidationTargets } from "hono";
import { validator } from "hono/validator";
import { type ZodType, z } from "zod";

/**
 * Type-safe Hono validation middleware powered by Zod v4 `safeParse`.
 * Preserves full `hc<AppType>` RPC input and output inference without external adapters.
 */
export function zodValidator<
	Target extends keyof ValidationTargets,
	TSchema extends ZodType,
>(target: Target, schema: TSchema) {
	return validator(target, (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.json(
				{
					success: false as const,
					error: {
						message: "Validasi payload gagal.",
						status: 400,
						code: "VALIDATION_ERROR" as const,
						details: z.flattenError(parsed.error),
					},
				},
				400,
			);
		}
		return parsed.data as z.output<TSchema>;
	});
}
