import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export interface ApiErrorResponse {
	success: false;
	error: {
		message: string;
		status: number;
		code?: string;
		stack?: string;
	};
}

export const errorHandler: ErrorHandler = (err, c) => {
	console.error(`[API Error] ${c.req.method} ${c.req.path}:`, err);

	if (err instanceof HTTPException) {
		return c.json<ApiErrorResponse>(
			{
				success: false,
				error: {
					message: err.message,
					status: err.status,
				},
			},
			err.status,
		);
	}

	const isDev = process.env.NODE_ENV === "development";
	return c.json<ApiErrorResponse>(
		{
			success: false,
			error: {
				message: err.message || "Internal Server Error",
				status: 500,
				...(isDev && err.stack ? { stack: err.stack } : {}),
			},
		},
		500,
	);
};

export const notFoundHandler: NotFoundHandler = (c) => {
	return c.json<ApiErrorResponse>(
		{
			success: false,
			error: {
				message: `Route not found: ${c.req.method} ${c.req.path}`,
				status: 404,
			},
		},
		404,
	);
};
