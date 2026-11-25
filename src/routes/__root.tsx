import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "NOCTURA",
			},
			{
				name: "description",
				content:
					"Centred on impeccable craftsmanship, the NOCTURA collection is led by modern suiting and assured foundational pieces",
			},
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	errorComponent: RootErrorComponent,
	shellComponent: RootDocument,
});

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
	const errorMessage =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: "An unexpected error occurred during rendering.";

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
			<div className="max-w-md w-full text-center space-y-4 p-8 border border-border">
				<span className="font-display text-xl font-bold tracking-[0.24em] uppercase block">
					NOCTURA
				</span>
				<div className="space-y-1">
					<h1 className="text-sm font-semibold tracking-wider uppercase">
						Application Notice
					</h1>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{errorMessage}
					</p>
				</div>
				<div className="pt-4 flex gap-3 justify-center">
					<button
						type="button"
						onClick={() => reset()}
						className="px-4 py-2 border border-border text-xs uppercase tracking-wider hover:bg-muted/30 transition-colors"
					>
						Try Again
					</button>
					<Link
						to="/"
						className="px-4 py-2 bg-foreground text-background text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
					>
						Storefront
					</Link>
				</div>
			</div>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
