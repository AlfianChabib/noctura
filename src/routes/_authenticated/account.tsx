import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { Calendar, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/account")({
	component: AccountPage,
});

function AccountPage() {
	const { user } = useRouteContext({ from: "/_authenticated" });

	return (
		<div className="space-y-8 max-w-4xl">
			<div>
				<h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
					Client Profile
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Manage your personal details, architectural sizing preferences, and
					security settings.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Personal Information */}
				<Card className="rounded-none border-border">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-base tracking-wide uppercase font-sans">
								Identity & Contact
							</CardTitle>
							<Badge
								variant="outline"
								className="uppercase text-[10px] tracking-widest"
							>
								{user.role || "customer"}
							</Badge>
						</div>
						<CardDescription className="text-xs">
							Details associated with your Noctura customer profile.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-1.5">
							<Label
								htmlFor="name"
								className="text-xs uppercase tracking-wider text-muted-foreground"
							>
								Full Name
							</Label>
							<Input
								id="name"
								value={user.name || "Customer"}
								readOnly
								className="rounded-none bg-muted/30 font-sans text-sm"
							/>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="email"
								className="text-xs uppercase tracking-wider text-muted-foreground"
							>
								Email Address
							</Label>
							<div className="relative">
								<Input
									id="email"
									value={user.email || ""}
									readOnly
									className="rounded-none bg-muted/30 font-sans text-sm pr-9"
								/>
								<Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						<div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
							<UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							<span>
								Active member since{" "}
								{new Date(user.createdAt).toLocaleDateString()}
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Security & Access */}
				<Card className="rounded-none border-border">
					<CardHeader>
						<CardTitle className="text-base tracking-wide uppercase font-sans">
							Account Security
						</CardTitle>
						<CardDescription className="text-xs">
							Authentication state and role-based access permissions.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-start justify-between p-3 border border-border bg-muted/10">
							<div className="space-y-1">
								<p className="text-xs font-medium uppercase tracking-wider">
									Email Verification
								</p>
								<p className="text-xs text-muted-foreground">
									{user.emailVerified
										? "Your email address is verified."
										: "Email verification pending."}
								</p>
							</div>
							<Badge
								variant={user.emailVerified ? "default" : "secondary"}
								className="text-[10px] uppercase tracking-wider"
							>
								{user.emailVerified ? "Verified" : "Pending"}
							</Badge>
						</div>

						<div className="flex items-start justify-between p-3 border border-border bg-muted/10">
							<div className="space-y-1">
								<p className="text-xs font-medium uppercase tracking-wider">
									Access Tier
								</p>
								<p className="text-xs text-muted-foreground">
									Assigned role:{" "}
									<span className="font-mono text-foreground">
										{user.role || "customer"}
									</span>
								</p>
							</div>
							<ShieldCheck className="h-4 w-4 text-muted-foreground" />
						</div>

						<div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
							<Calendar className="h-4 w-4" />
							<span>Session secured via HTTP-only encrypted cookies</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
