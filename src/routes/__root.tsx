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
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { useGuestCartHydration } from "@/hooks/use-cart-count";
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
	notFoundComponent: RootNotFoundComponent,
	shellComponent: RootDocument,
});

function RootStatusShell({
	eyebrow,
	title,
	description,
	actions,
}: {
	eyebrow?: string;
	title: string;
	description: string;
	actions: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
			<div className="max-w-md w-full text-center space-y-4 p-8 border border-border">
				<Link
					to="/"
					className="font-display text-xl font-bold tracking-[0.24em] uppercase block hover:opacity-80 transition-opacity"
				>
					NOCTURA
				</Link>
				<div className="space-y-1.5">
					{eyebrow ? (
						<p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
							{eyebrow}
						</p>
					) : null}
					<h1 className="text-sm font-semibold tracking-wider uppercase">
						{title}
					</h1>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{description}
					</p>
				</div>
				<div className="pt-4 flex gap-3 justify-center">{actions}</div>
			</div>
		</div>
	);
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
	const errorMessage =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: "An unexpected error occurred during rendering.";

	return (
		<RootStatusShell
			title="Application Notice"
			description={errorMessage}
			actions={
				<>
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
				</>
			}
		/>
	);
}

function RootNotFoundComponent() {
	return (
		<RootStatusShell
			eyebrow="404 Not Found"
			title="Page Not Found"
			description="The page or collection piece you are looking for may have been moved or is no longer available."
			actions={
				<>
					<button
						type="button"
						onClick={() => window.history.back()}
						className="px-4 py-2 border border-border text-xs uppercase tracking-wider hover:bg-muted/30 transition-colors"
					>
						Go Back
					</button>
					<Link
						to="/"
						className="px-4 py-2 bg-foreground text-background text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
					>
						Storefront
					</Link>
				</>
			}
		/>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	useGuestCartHydration();

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<NuqsAdapter>{children}</NuqsAdapter>
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
