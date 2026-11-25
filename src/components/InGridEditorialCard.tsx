import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type * as React from "react";
import { COS_IMAGE_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface InGridEditorialCardProps {
	title: string;
	eyebrow?: string;
	subtitle?: string;
	image: string;
	imageAlt?: string;
	ctaLabel?: string;
	onCtaClick?: () => void;
	spanCols?: 1 | 2;
	className?: string;
}

export const InGridEditorialCard: React.FC<InGridEditorialCardProps> = ({
	title,
	eyebrow = "Curated Edit",
	subtitle,
	image,
	imageAlt,
	ctaLabel = "Explore Capsule",
	onCtaClick,
	spanCols = 1,
	className,
}) => {
	return (
		<div
			className={cn(
				"group relative flex flex-col justify-end overflow-hidden rounded-none border border-border bg-studio",
				spanCols === 2
					? "col-span-1 sm:col-span-2 aspect-4/3 sm:aspect-16/10 lg:aspect-video"
					: "aspect-3/4 w-full",
				className,
			)}
		>
			<motion.img
				src={image}
				alt={imageAlt || title}
				referrerPolicy="no-referrer"
				animate={{ scale: 1 }}
				whileHover={{ scale: 1.03 }}
				transition={COS_IMAGE_TRANSITION}
				className="absolute inset-0 h-full w-full object-cover object-center will-change-transform"
			/>

			<div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10 pointer-events-none" />

			<div className="relative z-10 flex flex-col justify-end p-6 sm:p-8 space-y-3 text-white">
				{eyebrow && (
					<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">
						{eyebrow}
					</p>
				)}

				<h3 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-white leading-tight max-w-md">
					{title}
				</h3>

				{subtitle && (
					<p className="text-xs sm:text-sm text-white/80 max-w-sm leading-relaxed font-sans line-clamp-2">
						{subtitle}
					</p>
				)}

				<div className="pt-2">
					<button
						type="button"
						onClick={onCtaClick}
						className="group/btn inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white hover:text-white/85 focus-visible:outline-none focus-visible:underline transition-colors"
					>
						<span className="border-b border-white pb-0.5 group-hover/btn:border-white/60 transition-colors">
							{ctaLabel}
						</span>
						<ArrowUpRight className="h-3.5 w-3.5 stroke-[1.5] transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
					</button>
				</div>
			</div>
		</div>
	);
};
