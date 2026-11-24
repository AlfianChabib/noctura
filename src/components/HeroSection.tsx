import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HERO_MEDIA } from "@/data/catalog";
import { COS_EASE } from "@/lib/motion";

interface HeroSectionProps {
	onExploreCollection: () => void;
	onOpenDesignSystem: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
	onExploreCollection,
	onOpenDesignSystem,
}) => {
	const [imgFailed, setImgFailed] = useState(false);

	return (
		<section
			aria-label="Autumn Winter Campaign"
			className="relative w-full overflow-hidden border-b border-border bg-neutral-900"
		>
			<div className="relative mx-auto min-h-[500px] sm:min-h-[580px] lg:h-[680px] w-full max-w-[1440px]">
				{!imgFailed ? (
					<motion.img
						src={HERO_MEDIA.image}
						alt={HERO_MEDIA.alt}
						referrerPolicy="no-referrer"
						onError={() => setImgFailed(true)}
						initial={{ scale: 1.03, opacity: 0.92 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 1.1, ease: COS_EASE }}
						className="absolute inset-0 h-full w-full object-cover object-center"
					/>
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950" />
				)}

				{/* Measured directional scrim ensuring WCAG AA contrast over concrete gallery backdrop */}
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/38 to-black/10"
				/>

				<div className="relative z-10 flex h-full min-h-[500px] sm:min-h-[580px] lg:min-h-[680px] flex-col justify-end px-4 pb-12 pt-24 sm:px-8 sm:pb-16 lg:justify-center lg:px-12 lg:py-0">
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.65, ease: COS_EASE }}
						className="max-w-lg space-y-6 text-white"
					>
						<p className="text-xs font-medium tracking-[0.12em] uppercase text-white/80">
							Autumn / Winter 2026
						</p>

						<h1
							className="font-display text-4xl font-medium leading-[1.08] tracking-[-0.025em] text-white sm:text-5xl lg:text-[54px]"
							style={{ textWrap: "balance" }}
						>
							Architectural Form in Boiled Wool
						</h1>

						<p className="max-w-md text-[15px] leading-relaxed text-white/85">
							Clean silhouettes tailored in pure RWS virgin wool, heavy ribbed
							cashmere, and crisp organic cotton poplin.
						</p>

						<div className="flex flex-wrap items-center gap-5 pt-2">
							<Button
								type="button"
								onClick={onExploreCollection}
								className="h-12 bg-white px-7 text-[13px] font-medium text-neutral-950 hover:bg-neutral-200"
							>
								<span>Explore Collection</span>
								<ArrowRight className="h-3.5 w-3.5 stroke-[1.75]" />
							</Button>

							<button
								type="button"
								onClick={onOpenDesignSystem}
								className="inline-flex h-12 items-center whitespace-nowrap text-[13px] font-medium tracking-[0.03em] text-white/90 underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
							>
								Inspect Design System
							</button>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
};
