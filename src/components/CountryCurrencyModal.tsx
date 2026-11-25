import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Globe, Search, X } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { COS_EASE } from "@/lib/motion";
import { type CountryConfig, SUPPORTED_COUNTRIES } from "@/lib/storeLogic";
import { cn } from "@/lib/utils";

interface CountryCurrencyModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	activeCountry: CountryConfig;
	onSelectCountry: (country: CountryConfig) => void;
}

export const CountryCurrencyModal: React.FC<CountryCurrencyModalProps> = ({
	open,
	onOpenChange,
	activeCountry,
	onSelectCountry,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [pendingCountry, setPendingCountry] = useState<CountryConfig | null>(
		null,
	);

	const regions = useMemo(() => {
		const filtered = SUPPORTED_COUNTRIES.filter((c) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				c.name.toLowerCase().includes(q) ||
				c.currency.toLowerCase().includes(q) ||
				c.code.toLowerCase().includes(q) ||
				c.region.toLowerCase().includes(q)
			);
		});

		const map = new Map<string, CountryConfig[]>();
		for (const country of filtered) {
			const list = map.get(country.region) || [];
			list.push(country);
			map.set(country.region, list);
		}
		return map;
	}, [searchQuery]);

	const handleCountryClick = (country: CountryConfig) => {
		if (country.code === activeCountry.code) {
			onOpenChange(false);
			return;
		}
		setPendingCountry(country);
	};

	const handleConfirmSwitch = () => {
		if (pendingCountry) {
			onSelectCountry(pendingCountry);
			setPendingCountry(null);
			onOpenChange(false);
		}
	};

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<AnimatePresence>
					{open && (
						<SheetContent
							side="right"
							className="flex h-full w-full flex-col p-0 sm:max-w-md"
						>
							{/* Header */}
							<div className="border-b border-border px-6 py-5">
								<div className="pr-10">
									<SheetTitle className="font-display text-sm font-semibold uppercase tracking-[0.06em]">
										Change Location
									</SheetTitle>
									<SheetDescription className="mt-1 text-xs text-muted-foreground">
										Select your preferred shipping destination and localized
										currency.
									</SheetDescription>
								</div>
							</div>

							{/* Current Active Selection Box */}
							<div className="border-b border-border bg-secondary/30 px-6 py-3.5 flex items-center justify-between">
								<div className="space-y-0.5">
									<p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
										Current Location & Currency
									</p>
									<p className="font-display text-xs font-semibold uppercase tracking-wider text-foreground">
										{activeCountry.flag} {activeCountry.name} (
										{activeCountry.currency} {activeCountry.currencySymbol})
									</p>
								</div>
								<Globe className="h-4 w-4 stroke-[1.5] text-muted-foreground" />
							</div>

							{/* Search Filter Input */}
							<div className="border-b border-border px-6 py-3">
								<div className="flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs">
									<Search className="h-3.5 w-3.5 text-muted-foreground stroke-[1.5]" />
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search countries or currencies..."
										className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
									/>
									{searchQuery && (
										<button
											type="button"
											onClick={() => setSearchQuery("")}
											aria-label="Clear search"
											className="text-muted-foreground hover:text-foreground cursor-pointer"
										>
											<X className="h-3.5 w-3.5 stroke-[1.5]" />
										</button>
									)}
								</div>
							</div>

							{/* Regional Accordions & Country List */}
							<div className="flex-1 overflow-y-auto px-6 py-2">
								<Accordion
									type="multiple"
									defaultValue={[
										"Asia Pacific",
										"Europe",
										"North America",
										"Middle East",
									]}
									className="w-full"
								>
									{Array.from(regions.entries()).map(([regionName, list]) => (
										<AccordionItem key={regionName} value={regionName}>
											<AccordionTrigger className="text-xs uppercase tracking-[0.06em] font-medium">
												<span>{regionName}</span>
												<span className="font-mono text-[11px] text-muted-foreground font-normal">
													({list.length})
												</span>
											</AccordionTrigger>
											<AccordionContent>
												<div className="space-y-1 pt-1">
													{list.map((country) => {
														const isSelected =
															country.code === activeCountry.code;
														return (
															<button
																key={country.code}
																type="button"
																onClick={() => handleCountryClick(country)}
																className={cn(
																	"flex w-full items-center justify-between px-3 py-2.5 text-xs transition-colors rounded-none text-left cursor-pointer",
																	isSelected
																		? "bg-secondary font-medium text-foreground"
																		: "hover:bg-secondary/60 text-muted-foreground hover:text-foreground",
																)}
															>
																<div className="flex items-center gap-2.5">
																	<span className="text-base">
																		{country.flag}
																	</span>
																	<span>{country.name}</span>
																</div>
																<div className="flex items-center gap-2">
																	<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
																		{country.currency} ({country.currencySymbol}
																		)
																	</span>
																	{isSelected ? (
																		<Check className="h-3.5 w-3.5 stroke-2 text-foreground" />
																	) : (
																		<ChevronRight className="h-3 w-3 stroke-[1.5] text-muted-foreground" />
																	)}
																</div>
															</button>
														);
													})}
												</div>
											</AccordionContent>
										</AccordionItem>
									))}
								</Accordion>
							</div>

							{/* Footer */}
							<div className="border-t border-border bg-background p-4 text-center">
								<p className="text-[11px] text-muted-foreground leading-relaxed">
									Prices are shown in localized currency according to your
									selected shipping territory.
								</p>
							</div>
						</SheetContent>
					)}
				</AnimatePresence>
			</Sheet>

			{/* COS-Style Two-Step Confirmation Modal */}
			<AnimatePresence>
				{pendingCountry && (
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="switch-title"
						className="fixed inset-0 z-60 flex items-center justify-center p-4"
					>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setPendingCountry(null)}
							className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
						/>

						{/* Modal Card */}
						<motion.div
							initial={{ opacity: 0, scale: 0.96 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.96 }}
							transition={{ duration: 0.2, ease: COS_EASE }}
							className="relative w-full max-w-md rounded-none border border-border bg-background p-6 sm:p-8 space-y-6 text-foreground shadow-2xl z-10"
						>
							<div className="space-y-2 text-center sm:text-left">
								<h3
									id="switch-title"
									className="font-display text-base font-semibold uppercase tracking-[0.06em] text-foreground"
								>
									Switch Destination
								</h3>
								<p className="text-xs text-muted-foreground leading-relaxed">
									You are currently shopping on our {activeCountry.name} site.
									When changing to{" "}
									<span className="font-semibold text-foreground">
										{pendingCountry.name} ({pendingCountry.currency})
									</span>
									, localized catalog rates and product availability will
									update. Are you sure you want to proceed?
								</p>
							</div>

							{/* COS 50px Action Buttons */}
							<div className="flex flex-col gap-2.5 pt-2">
								<button
									type="button"
									onClick={handleConfirmSwitch}
									className="flex h-12.5 w-full items-center justify-center rounded-none bg-foreground px-6 text-xs font-mono font-medium uppercase tracking-[0.08em] text-background hover:bg-foreground/85 transition-colors cursor-pointer"
								>
									Yes, Continue to {pendingCountry.name}
								</button>
								<button
									type="button"
									onClick={() => setPendingCountry(null)}
									className="flex h-12.5 w-full items-center justify-center rounded-none border border-border bg-background px-6 text-xs font-mono font-medium uppercase tracking-[0.08em] text-foreground hover:bg-secondary transition-colors cursor-pointer"
								>
									No, Stay on {activeCountry.name}
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
};
