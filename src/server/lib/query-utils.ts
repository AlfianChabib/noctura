export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

/**
 * Escapes PostgreSQL LIKE/ILIKE wildcard characters (`%`, `_`, `\`)
 * so user search queries match literal substrings safely.
 */
export function escapeLikePattern(term: string): string {
	return term.replace(/[%_\\]/g, "\\$&");
}

/**
 * Computes consistent pagination metadata across list endpoints.
 */
export function buildPaginationMeta(
	page: number,
	limit: number,
	total: number,
): PaginationMeta {
	const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
	return {
		page,
		limit,
		total,
		totalPages,
		hasNextPage: page < totalPages,
		hasPrevPage: page > 1 && total > 0,
	};
}
