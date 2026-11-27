import { createFormHookContexts } from "@tanstack/react-form";
import type { z } from "zod";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

export function formatFormError(error: unknown): string {
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		const msg = (error as { message?: unknown }).message;
		if (typeof msg === "string") return msg;
	}
	return String(error);
}

export function formatFieldErrors(errors: readonly unknown[]): string | null {
	const messages = errors
		.filter((err) => err !== undefined && err !== null && err !== "")
		.map(formatFormError);
	return messages.length > 0 ? messages.join(" · ") : null;
}

export function validateWithZodSchema<T>(
	schema: z.ZodType<T, unknown>,
	value: T,
	fallbackMessage = "Periksa kembali input form.",
) {
	const parsed = schema.safeParse(value);
	if (parsed.success) {
		return undefined;
	}

	const fields: Record<string, string> = {};
	for (const issue of parsed.error.issues) {
		const path = issue.path
			.map((segment, idx) =>
				typeof segment === "number"
					? `[${segment}]`
					: idx === 0
						? String(segment)
						: `.${String(segment)}`,
			)
			.join("");
		if (path && !fields[path]) {
			fields[path] = issue.message;
		}
	}

	return {
		form: parsed.error.issues[0]?.message ?? fallbackMessage,
		fields,
	};
}
