import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Copy } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { COS_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface NewsletterSectionProps {
	className?: string;
	onSubscribe?: (email: string, preferences: string[]) => void;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
	className,
	onSubscribe,
}) => {
	const [email, setEmail] = useState("");
	const [womenswear, setWomenswear] = useState(true);
	const [menswear, setMenswear] = useState(true);
	const [accessories, setAccessories] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !email.includes("@")) {
			setError("Please enter a valid email address.");
			return;
		}

		setError("");
		const preferences: string[] = [];
		if (womenswear) preferences.push("Womenswear");
		if (menswear) preferences.push("Menswear");
		if (accessories) preferences.push("Accessories");

		onSubscribe?.(email.trim(), preferences);
		setIsSubmitted(true);
	};

	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText("WELCOME10");
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<section
			aria-labelledby="newsletter-heading"
			className={cn(
				"border-t border-border bg-[#080808] text-white py-16 sm:py-20 px-4 sm:px-8 lg:px-12",
				className,
			)}
		>
			<div className="mx-auto max-w-4xl space-y-8">
				{/* Section Header */}
				<div className="space-y-3 text-center sm:text-left">
					<p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
						The NOCTURA Newsletter
					</p>
					<h2
						id="newsletter-heading"
						className="font-display text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-white leading-tight"
					>
						Sign up for 10% off your first order
					</h2>
					<p className="max-w-xl text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
						Be the first to hear about new collections, seasonal atelier drops,
						and exclusive member invitations.
					</p>
				</div>

				<AnimatePresence mode="wait">
					{!isSubmitted ? (
						<motion.form
							key="newsletter-form"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2, ease: COS_EASE }}
							onSubmit={handleSubmit}
							className="space-y-6 pt-2"
						>
							{/* Wardrobe Preferences */}
							<div className="space-y-2">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
									Wardrobe Interests
								</p>
								<div className="flex flex-wrap gap-5 pt-1">
									<div className="flex items-center gap-2">
										<Checkbox
											id="nl-womenswear"
											checked={womenswear}
											onCheckedChange={(c) => setWomenswear(Boolean(c))}
											className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black"
										/>
										<Label
											htmlFor="nl-womenswear"
											className="text-xs text-white/90 cursor-pointer"
										>
											Womenswear
										</Label>
									</div>

									<div className="flex items-center gap-2">
										<Checkbox
											id="nl-menswear"
											checked={menswear}
											onCheckedChange={(c) => setMenswear(Boolean(c))}
											className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black"
										/>
										<Label
											htmlFor="nl-menswear"
											className="text-xs text-white/90 cursor-pointer"
										>
											Menswear
										</Label>
									</div>

									<div className="flex items-center gap-2">
										<Checkbox
											id="nl-accessories"
											checked={accessories}
											onCheckedChange={(c) => setAccessories(Boolean(c))}
											className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black"
										/>
										<Label
											htmlFor="nl-accessories"
											className="text-xs text-white/90 cursor-pointer"
										>
											Leather & Objects
										</Label>
									</div>
								</div>
							</div>

							{/* Hairline Input & Submit Action */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
								<div className="flex-1 space-y-1">
									<label htmlFor="newsletter-email" className="sr-only">
										Email address
									</label>
									<input
										id="newsletter-email"
										type="email"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											if (error) setError("");
										}}
										placeholder="Enter your email address"
										className="w-full border-b border-white/30 bg-transparent py-3 text-xs sm:text-sm font-sans text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-colors"
									/>
									{error && (
										<p className="text-[11px] text-destructive pt-1">{error}</p>
									)}
								</div>

								<button
									type="submit"
									className="group inline-flex h-12 items-center justify-between gap-3 bg-white px-8 text-xs font-mono font-medium uppercase tracking-widest text-black transition-colors hover:bg-white/88 cursor-pointer rounded-none shrink-0"
								>
									<span>Sign Up</span>
									<ArrowRight className="h-3.5 w-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1" />
								</button>
							</div>

							{/* Legal Disclaimer */}
							<p className="text-[11px] text-white/50 leading-relaxed font-sans max-w-2xl">
								By signing up, you agree to receive email communication from
								NOCTURA. You can unsubscribe at any time via the link in our
								emails. Review our Privacy Policy and Terms & Conditions.
							</p>
						</motion.form>
					) : (
						<motion.div
							key="newsletter-success"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25, ease: COS_EASE }}
							className="border border-white/20 bg-white/5 p-6 sm:p-8 space-y-4 rounded-none"
						>
							<div className="flex items-center gap-2.5 text-white">
								<div className="flex h-6 w-6 items-center justify-center rounded-none bg-white text-black">
									<Check className="h-4 w-4 stroke-[2.5]" />
								</div>
								<h3 className="font-display text-base sm:text-lg font-medium uppercase tracking-[0.06em]">
									Welcome to NOCTURA
								</h3>
							</div>

							<p className="text-xs sm:text-sm text-white/80 leading-relaxed">
								Thank you for joining our community. Your 10% exclusive welcome
								code is ready to apply at checkout.
							</p>

							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
								<div className="flex items-center gap-2 border border-white/30 bg-black/40 px-4 py-2.5 font-mono text-sm tracking-widest text-white">
									<span>WELCOME10</span>
								</div>

								<button
									type="button"
									onClick={handleCopyCode}
									className="inline-flex items-center gap-2 border border-white bg-white px-4 py-2.5 text-xs font-mono font-medium uppercase tracking-wider text-black hover:bg-white/85 transition-colors cursor-pointer rounded-none"
								>
									{copied ? (
										<>
											<Check className="h-3.5 w-3.5 stroke-2" />
											<span>Copied to Clipboard</span>
										</>
									) : (
										<>
											<Copy className="h-3.5 w-3.5 stroke-[1.5]" />
											<span>Copy Promo Code</span>
										</>
									)}
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
};
