"use client";

import {
	Card,
	CardHeader,
	CardDescription,
	CardTitle,
	CardAction,
	CardContent,
} from "@/components/ui/card";
import { Sparkline } from "@/components/sparkline";
import { Num } from "@/components/num";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
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

const statusBorder: Record<
	NonNullable<HeroKpiProps["status"]>,
	string | undefined
> = {
	default: undefined,
	good: "#10b981",
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
		delta === null || delta === undefined
			? null
			: deltaInverted
				? delta < 0
				: delta > 0;

	return (
		<Card
			className={cn("gap-3", status !== "default" && "ring-2")}
			style={
				status !== "default"
					? {
							boxShadow: `inset 0 0 0 1px ${statusBorder[status]}`,
						}
					: undefined
			}
		>
			<CardHeader>
				<CardDescription className="text-xs font-medium">
					{label}
				</CardDescription>
				<CardTitle className="text-2xl font-semibold tracking-tight">
					<Num>{value}</Num>
					{unit && (
						<span className="text-sm font-normal text-muted-foreground ml-1">
							{unit}
						</span>
					)}
				</CardTitle>
				{delta !== null && delta !== undefined && (
					<CardAction>
						<Badge
							variant="outline"
							className={cn(
								"gap-1",
								isGood
									? "text-emerald-500 border-emerald-500/40"
									: "text-red-500 border-red-500/40",
							)}
						>
							{isGood ? (
								<TrendingUp className="size-3" />
							) : (
								<TrendingDown className="size-3" />
							)}
							<Num>
								{delta > 0 ? "+" : ""}
								{(delta * 100).toFixed(1)}%
							</Num>
						</Badge>
					</CardAction>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-1.5">
				{sparkData && sparkData.length > 1 && (
					<div className="w-full">
						<Sparkline
							data={sparkData}
							color={sparkColor ?? "#2563eb"}
							height={32}
						/>
					</div>
				)}
				{hint && <div className="text-xs text-muted-foreground">{hint}</div>}
			</CardContent>
		</Card>
	);
}
