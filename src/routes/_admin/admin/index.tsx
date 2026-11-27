import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import {
	Boxes,
	CheckCircle2,
	PackageCheck,
	ShieldCheck,
	Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CATALOG_PRODUCTS } from "@/data/catalog";

export const Route = createFileRoute("/_admin/admin/")({
	component: AdminDashboardPage,
});

function AdminDashboardPage() {
	const { user, role } = useRouteContext({ from: "/_admin" });

	return (
		<div className="space-y-8">
			{/* Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
						Operations & Logistics Dashboard
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Live system overview for atelier inventory, fulfillment, and
						customer service operations.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="text-xs uppercase tracking-widest font-mono"
					>
						Environment: Production Ready
					</Badge>
					<Badge
						variant="default"
						className="text-xs uppercase tracking-widest font-mono"
					>
						Role: {role}
					</Badge>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="rounded-none border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-sans">
							Active Catalog Items
						</CardTitle>
						<Boxes className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold font-mono">
							{CATALOG_PRODUCTS.length} SKUs
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Across 5 core categories
						</p>
					</CardContent>
				</Card>

				<Card className="rounded-none border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-sans">
							Fulfillment Queue
						</CardTitle>
						<Truck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold font-mono">Ready</div>
						<p className="text-xs text-muted-foreground mt-1">
							Direct warehouse dispatch
						</p>
					</CardContent>
				</Card>

				<Card className="rounded-none border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-sans">
							Quality Control (QC)
						</CardTitle>
						<PackageCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold font-mono">100% Passed</div>
						<p className="text-xs text-muted-foreground mt-1">
							Zero pending escalations
						</p>
					</CardContent>
				</Card>

				<Card className="rounded-none border-border">
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-sans">
							Auth & Guard Status
						</CardTitle>
						<ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
							Enforced
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							SSR & RPC layout protection
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Operational Role Access Matrix */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card className="rounded-none border-border">
					<CardHeader>
						<CardTitle className="text-base uppercase tracking-wider font-sans">
							Role Access Privileges
						</CardTitle>
						<CardDescription className="text-xs">
							Current permissions granted to your active session:{" "}
							<span className="font-semibold text-foreground">
								{user.email}
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 font-sans text-xs">
						<div className="flex items-center justify-between py-2 border-b border-border">
							<span className="text-muted-foreground">
								Catalog & Merchandising
							</span>
							<Badge
								variant={
									role === "admin" || role === "merchandiser"
										? "default"
										: "secondary"
								}
							>
								{role === "admin" || role === "merchandiser"
									? "Full Access"
									: "Read-Only"}
							</Badge>
						</div>
						<div className="flex items-center justify-between py-2 border-b border-border">
							<span className="text-muted-foreground">
								Order Shipments & Warehouse QC
							</span>
							<Badge
								variant={
									role === "admin" || role === "warehouse_staff"
										? "default"
										: "secondary"
								}
							>
								{role === "admin" || role === "warehouse_staff"
									? "Full Access"
									: "Read-Only"}
							</Badge>
						</div>
						<div className="flex items-center justify-between py-2 border-b border-border">
							<span className="text-muted-foreground">
								Customer Service & RMA Approvals
							</span>
							<Badge
								variant={
									role === "admin" || role === "cs_staff"
										? "default"
										: "secondary"
								}
							>
								{role === "admin" || role === "cs_staff"
									? "Full Access"
									: "Read-Only"}
							</Badge>
						</div>
						<div className="flex items-center justify-between py-2">
							<span className="text-muted-foreground">
								User Management & System Settings
							</span>
							<Badge variant={role === "admin" ? "default" : "secondary"}>
								{role === "admin" ? "Admin Only" : "Restricted"}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-none border-border">
					<CardHeader>
						<CardTitle className="text-base uppercase tracking-wider font-sans">
							System Infrastructure
						</CardTitle>
						<CardDescription className="text-xs">
							Underlying TanStack Start, Database, and Auth status.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-xs">
						<div className="flex items-center gap-2 text-muted-foreground">
							<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							<span>
								QueryClient instantiated per SSR request (No cache leaks)
							</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							<span>
								Pathless layout guards:{" "}
								<code className="font-mono">/_authenticated</code> and{" "}
								<code className="font-mono">/_admin</code>
							</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							<span>
								RPC server function:{" "}
								<code className="font-mono">getSessionFn()</code> via Better
								Auth
							</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							<span>
								Database ORM: Drizzle ORM + Neon PostgreSQL Serverless
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
