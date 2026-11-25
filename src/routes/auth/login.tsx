import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface LoginSearchParams {
	redirect?: string;
}

export const Route = createFileRoute("/auth/login")({
	validateSearch: (search: Record<string, unknown>): LoginSearchParams => {
		return {
			redirect:
				typeof search.redirect === "string" ? search.redirect : undefined,
		};
	},
	component: LoginPage,
});

function LoginPage() {
	const { redirect: redirectUrl } = Route.useSearch();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const res = await authClient.signIn.email({
				email,
				password,
			});

			if (res.error) {
				setErrorMessage(
					res.error.message ||
						"Failed to sign in. Please verify your credentials.",
				);
				setIsLoading(false);
				return;
			}

			// Successful sign in: redirect to destination or default to storefront
			const target = redirectUrl || "/";
			window.location.href = target;
		} catch (err: unknown) {
			const error = err as Error;
			setErrorMessage(error.message || "An unexpected error occurred.");
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground px-4 py-12">
			<div className="w-full max-w-md space-y-6">
				{/* Brand */}
				<div className="text-center space-y-2">
					<Link
						to="/"
						className="inline-block font-display text-2xl font-bold tracking-[0.28em] text-foreground hover:opacity-80 transition-opacity"
					>
						NOCTURA
					</Link>
					<p className="text-xs uppercase tracking-widest text-muted-foreground font-sans">
						Architectural Wardrobe & Client Atelier
					</p>
				</div>

				{/* Notice if redirected */}
				{redirectUrl && (
					<div className="p-3 border border-border bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
						<Lock className="h-4 w-4 text-primary shrink-0" />
						<span>
							Authentication required to access the requested destination.
						</span>
					</div>
				)}

				<Card className="rounded-none border-border">
					<CardHeader className="space-y-1">
						<CardTitle className="text-lg font-semibold tracking-wide uppercase font-sans">
							Sign In
						</CardTitle>
						<CardDescription className="text-xs">
							Enter your credentials to access your account or staff operations.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSignIn} className="space-y-4">
							{errorMessage && (
								<div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs">
									{errorMessage}
								</div>
							)}

							<div className="space-y-1.5">
								<Label
									htmlFor="email"
									className="text-xs uppercase tracking-wider text-muted-foreground"
								>
									Email Address
								</Label>
								<Input
									id="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="client@noctura.com"
									className="rounded-none font-sans text-sm"
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label
										htmlFor="password"
										className="text-xs uppercase tracking-wider text-muted-foreground"
									>
										Password
									</Label>
								</div>
								<Input
									id="password"
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="rounded-none font-sans text-sm"
								/>
							</div>

							<Button
								type="submit"
								disabled={isLoading}
								className="w-full rounded-none uppercase tracking-widest text-xs h-10 mt-2"
							>
								{isLoading ? "Signing in..." : "Continue"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<div className="text-center">
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Return to Storefront
					</Link>
				</div>
			</div>
		</div>
	);
}
