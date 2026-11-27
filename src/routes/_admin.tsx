import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouteContext,
} from "@tanstack/react-router";
import {
	BarChart3,
	Box,
	Headphones,
	LogOut,
	Package,
	Store,
	Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isStaffRole, STAFF_ROLES } from "@/lib/auth-access";
import { authClient } from "@/lib/auth-client";
import { getSessionFn } from "@/server/auth-helpers";

export const Route = createFileRoute("/_admin")({
	beforeLoad: async ({ location }) => {
		const session = await getSessionFn();

		// 1. If not logged in, redirect to login with return path
		if (!session?.user) {
			throw redirect({
				to: "/auth/login",
				search: { redirect: location.href },
			});
		}

		// 2. If banned, deny access
		if (session.user.banned) {
			throw redirect({
				to: "/unauthorized",
			});
		}

		// 3. Verify user has an authorized staff role
		const userRole = session.user.role;
		if (!isStaffRole(userRole)) {
			throw redirect({
				to: "/unauthorized",
			});
		}

		return {
			user: session.user,
			role: userRole,
		};
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { user, role } = useRouteContext({ from: "/_admin" });

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
			{/* Admin Header */}
			<header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
					<div className="flex items-center gap-6">
						<Link
							to="/admin"
							className="font-display text-base font-bold tracking-[0.22em] text-foreground flex items-center gap-2"
						>
							<span>NOCTURA</span>
							<span className="text-xs font-mono font-normal px-2 py-0.5 bg-foreground text-background">
								ATELIER OPS
							</span>
						</Link>

						<nav className="hidden lg:flex items-center gap-5 text-xs uppercase tracking-widest text-muted-foreground font-sans">
							<Link
								to="/admin"
								activeOptions={{ exact: true }}
								activeProps={{ className: "text-foreground font-medium" }}
								className="hover:text-foreground transition-colors flex items-center gap-1.5"
							>
								<BarChart3 className="h-3.5 w-3.5" />
								Dashboard
							</Link>
							<Link
								to="/admin/products"
								activeProps={{ className: "text-foreground font-medium" }}
								className="hover:text-foreground transition-colors flex items-center gap-1.5"
							>
								<Box className="h-3.5 w-3.5" />
								Catalog
							</Link>
							<Link
								to="/"
								className="hover:text-foreground transition-colors flex items-center gap-1.5"
							>
								<Store className="h-3.5 w-3.5" />
								View Store
							</Link>
						</nav>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2.5">
							<div className="text-right hidden sm:block">
								<p className="text-xs font-medium leading-none">
									{user.name || "Staff Member"}
								</p>
								<p className="text-[10px] text-muted-foreground font-mono mt-0.5">
									{user.email}
								</p>
							</div>
							<Badge
								variant="default"
								className="text-[10px] tracking-wider uppercase bg-primary text-primary-foreground"
							>
								{role}
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

			{/* Sub-header navigation bar for operational modules */}
			<div className="border-b border-border bg-muted/20">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-6 overflow-x-auto text-xs tracking-wider uppercase text-muted-foreground font-sans">
					<Link
						to="/admin/products"
						activeProps={{ className: "text-foreground font-medium" }}
						className="flex items-center gap-1.5 hover:text-foreground transition-colors whitespace-nowrap"
					>
						<Box className="h-3.5 w-3.5 text-primary" />
						Catalog &amp; Atelier
					</Link>
					<span className="flex items-center gap-1.5">
						<Package className="h-3.5 w-3.5" />
						Orders & Logistics
					</span>
					<span className="flex items-center gap-1.5">
						<Headphones className="h-3.5 w-3.5" />
						Customer Care & RMA
					</span>
					<span className="flex items-center gap-1.5">
						<Users className="h-3.5 w-3.5" />
						Staff Directory
					</span>
				</div>
			</div>

			{/* Main Content Area */}
			<main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
				<Outlet />
			</main>

			{/* Admin Footer */}
			<footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
				<div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
					<p className="font-mono text-[11px] tracking-widest uppercase">
						NOCTURA STAFF PORTAL • ROLE ENFORCED: [{STAFF_ROLES.join(", ")}]
					</p>
					<p className="text-[11px]">
						TanStack Start Layout & Auth Guards Active
					</p>
				</div>
			</footer>
		</div>
	);
}
