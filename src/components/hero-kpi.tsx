"use client";

import { Sparkline } from "@/components/sparkline";
import { cn } from "@/lib/utils";

interface HeroKpiProps {
	label: string;
	value: string;
	unit?: string;
	delta?: number | null;
	deltaInverted?: boolean;
	sparkData?: { v: number | null }[];
	sparkColor?: string;
	status?: "default" | "warning" | "critical" | "good";
	hint?: string;
}

const statusBorder: Record<string, string | undefined> = {
	default: undefined,
	good: "#22c55e",
	warning: "#f59e0b",
	critical: "#ef4444",
};

export function HeroKpi({
	label,
	value,
	unit,
	delta,
	deltaInverted,
	sparkData,
	sparkColor,
	status = "default",
	hint,
}: HeroKpiProps) {
	const isGood =
		delta !== null && delta !== undefined
			? deltaInverted
				? delta < 0
				: delta > 0
			: null;

	return (
		<div
			className={cn(
				"rounded-md border bg-card p-3 flex flex-col gap-1 transition-colors",
				status !== "default" && "border-2",
			)}
			style={
				status !== "default" ? { borderColor: statusBorder[status] } : undefined
			}
		>
			<div className="flex justify-between items-start gap-1">
				<span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium leading-tight">
					{label}
				</span>
				{delta !== null && delta !== undefined && (
					<span
						className={cn(
							"text-[10px] tabular-nums font-semibold",
							isGood ? "text-emerald-500" : "text-rose-500",
						)}
					>
						{delta > 0 ? "+" : ""}
						{(delta * 100).toFixed(1)}%
					</span>
				)}
			</div>
			<div className="flex items-baseline gap-1">
				<span className="text-xl font-bold tabular-nums">{value}</span>
				{unit && <span className="text-xs text-muted-foreground">{unit}</span>}
			</div>
			{sparkData && sparkData.length > 1 && (
				<Sparkline
					data={sparkData}
					color={sparkColor ?? "#3b82f6"}
					height={24}
				/>
			)}
			{hint && (
				<span className="text-[10px] text-muted-foreground">{hint}</span>
			)}
		</div>
	);
}
