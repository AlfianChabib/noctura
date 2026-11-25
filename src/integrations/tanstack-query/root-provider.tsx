import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				gcTime: 5 * 60_000,
			},
		},
	});
}

export function getContext() {
	const queryClient = createQueryClient();

	return {
		queryClient,
	};
}

export default function TanstackQueryProvider() {}
