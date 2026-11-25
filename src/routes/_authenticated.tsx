import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouteContext,
} from "@tanstack/react-router";
import { LogOut, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getSessionFn } from "@/server/auth-helpers";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ location }) => {
		const session = await getSessionFn();

		if (!session?.user) {
			throw redirect({
				to: "/auth/login",
				search: { redirect: location.href },
			});
		}

		if (session.user.banned) {
			throw redirect({
				to: "/auth/login",
				search: { redirect: location.href },
			});
		}

		return { user: session.user };
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const { user } = useRouteContext({ from: "/_authenticated" });

	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = "/";
				},
			},
		});
	};

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			{/* Top Account Navigation */}
			<header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
					<div className="flex items-center gap-8">
						<Link
							to="/"
							className="font-display text-lg font-semibold tracking-[0.24em] text-foreground hover:opacity-80 transition-opacity"
						>
							NOCTURA
						</Link>

						<nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-muted-foreground font-sans">
							<Link to="/" className="hover:text-foreground transition-colors">
								Storefront
							</Link>
							<Link
								to="/account"
								className="text-foreground font-medium flex items-center gap-1.5"
							>
								<UserIcon className="h-3.5 w-3.5" />
								Account
							</Link>
						</nav>
					</div>

					<div className="flex items-center gap-4">
						<div className="hidden sm:flex items-center gap-2">
							<span className="text-xs text-muted-foreground">
								{user.email}
							</span>
							<Badge
								variant="outline"
								className="text-[10px] tracking-wider uppercase"
							>
								{user.role || "customer"}
							</Badge>
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={handleSignOut}
							className="text-xs tracking-wider uppercase h-8 px-3"
						>
							<LogOut className="h-3 w-3 mr-1.5" />
							Sign Out
						</Button>
					</div>
				</div>
			</header>

			{/* Main Protected Content */}
			<main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				<Outlet />
			</main>

			{/* Footer */}
			<footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
				<div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="tracking-widest uppercase">
						NOCTURA © {new Date().getFullYear()} — Client Portal
					</p>
					<div className="flex gap-6 text-[11px] tracking-wider uppercase">
						<Link to="/" className="hover:underline">
							Back to Storefront
						</Link>
						<a href="#privacy" className="hover:underline">
							Privacy Policy
						</a>
						<a href="#terms" className="hover:underline">
							Terms & Conditions
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
