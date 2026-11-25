import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldAlert, Store, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/unauthorized")({
	component: UnauthorizedPage,
});

function UnauthorizedPage() {
	const handleSwitchAccount = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = "/auth/login";
				},
			},
		});
	};

	return (
		<div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground px-4 py-12">
			<div className="w-full max-w-lg space-y-6">
				{/* Brand */}
				<div className="text-center space-y-2">
					<Link
						to="/"
						className="inline-block font-display text-2xl font-bold tracking-[0.28em] text-foreground hover:opacity-80 transition-opacity"
					>
						NOCTURA
					</Link>
					<p className="text-xs uppercase tracking-widest text-muted-foreground font-sans">
						Access Control & Policy Enforcement
					</p>
				</div>

				<Card className="rounded-none border-border">
					<CardHeader className="text-center pb-4">
						<div className="mx-auto mb-3 h-12 w-12 flex items-center justify-center border border-destructive/30 bg-destructive/10 text-destructive">
							<ShieldAlert className="h-6 w-6" />
						</div>
						<Badge
							variant="outline"
							className="mx-auto text-[10px] tracking-widest uppercase font-mono"
						>
							HTTP 403 Forbidden
						</Badge>
						<CardTitle className="text-xl font-semibold tracking-wide uppercase font-sans mt-2">
							Access Restricted
						</CardTitle>
						<CardDescription className="text-xs leading-relaxed max-w-sm mx-auto">
							Your current session does not hold the necessary staff permissions
							to access this area. This resource is restricted to authorized
							atelier personnel:
							<span className="block mt-1 font-mono text-[11px] text-foreground">
								[admin, warehouse_staff, cs_staff, merchandiser]
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 pt-2">
						<div className="grid gap-2 sm:grid-cols-2">
							<Button
								asChild
								variant="default"
								className="rounded-none uppercase tracking-widest text-xs h-10"
							>
								<Link to="/">
									<Store className="h-3.5 w-3.5 mr-1.5" />
									Storefront
								</Link>
							</Button>

							<Button
								asChild
								variant="outline"
								className="rounded-none uppercase tracking-widest text-xs h-10"
							>
								<Link to="/account">
									<User className="h-3.5 w-3.5 mr-1.5" />
									Client Profile
								</Link>
							</Button>
						</div>

						<div className="pt-2 text-center">
							<button
								type="button"
								onClick={handleSwitchAccount}
								className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 tracking-wider uppercase transition-colors"
							>
								Sign in with another account
							</button>
						</div>
					</CardContent>
				</Card>

				<div className="text-center">
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Return to NOCTURA Home
					</Link>
				</div>
			</div>
		</div>
	);
}
