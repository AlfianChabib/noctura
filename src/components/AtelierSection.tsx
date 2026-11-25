import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ATELIER_MEDIA } from "@/data/catalog";

interface AtelierSectionProps {
	onOpenDesignSystem: () => void;
}

export const AtelierSection: React.FC<AtelierSectionProps> = ({
	onOpenDesignSystem,
}) => {
	const [imgFailed, setImgFailed] = useState(false);

	const newLocal =
		"text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground";
	return (
		<section
			aria-label="Material Study and Architecture"
			className="border-t border-border bg-background"
		>
			<div className="mx-auto grid max-w-360 grid-cols-1 lg:grid-cols-12 items-stretch">
				<div className="lg:col-span-6 bg-studio overflow-hidden">
					{!imgFailed ? (
						<img
							src={ATELIER_MEDIA.image}
							alt={ATELIER_MEDIA.alt}
							referrerPolicy="no-referrer"
							onError={() => setImgFailed(true)}
							className="h-full min-h-85 w-full object-cover"
						/>
					) : (
						<div className="flex h-full min-h-85 items-center justify-center bg-secondary text-xs text-muted-foreground">
							Atelier Material Study
						</div>
					)}
				</div>

				<div className="lg:col-span-6 flex flex-col justify-center px-4 py-14 sm:px-8 lg:px-16 lg:py-20">
					<div className="max-w-lg space-y-6">
						<p className={newLocal}>The Atelier & System</p>
						<h2
							className="font-display text-3xl font-medium leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[36px]"
							style={{ textWrap: "balance" }}
						>
							Proportion, Sharp Geometry & Permanence
						</h2>
						<p className="text-[15px] leading-relaxed text-muted-foreground">
							Every garment and interface surface follows the same architectural
							discipline: pure monochrome contrast, zero border-radius geometry,
							generous gallery whitespace, and unhurried micro-interactions that
							step aside so the form speaks first.
						</p>

						<div className="grid grid-cols-3 gap-6 border-y border-border py-5">
							<div>
								<p className="font-mono text-lg font-medium tabular-nums text-foreground">
									0px
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Border Radius
								</p>
							</div>
							<div>
								<p className="font-mono text-lg font-medium tabular-nums text-foreground">
									340ms
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Dropdown Fade
								</p>
							</div>
							<div>
								<p className="font-mono text-lg font-medium tabular-nums text-foreground">
									100%
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									HSL Tokenized
								</p>
							</div>
						</div>

						<div className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={onOpenDesignSystem}
								className="h-11"
							>
								<span>Open Design System Specification</span>
								<ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
