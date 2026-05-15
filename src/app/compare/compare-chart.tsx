"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

export interface CompareDataPoint {
	date: string;
	blk_acos: number | null;
	blk_tacos: number | null;
	blk_cvr: number | null;
	dbl_acos: number | null;
	dbl_tacos: number | null;
	dbl_cvr: number | null;
}

type Metric = "acos" | "tacos" | "cvr";

export function CompareChart({
	data,
	metric,
}: {
	data: CompareDataPoint[];
	metric: Metric;
}) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const isDark = mounted && resolvedTheme === "dark";

	const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
	const axisColor = isDark ? "#a1a1aa" : "#71717a";
	const tooltipBg = isDark ? "#18181b" : "#ffffff";
	const tooltipBorder = isDark ? "#52525b" : "#e4e4e7";
	const tooltipText = isDark ? "#fafafa" : "#0a0a0a";
	const blkColor = isDark ? "#d4d4d8" : "#52525b";

	const interval = Math.max(0, Math.floor(data.length / 6));
	return (
		<div className="aspect-[4/3] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke={gridColor}
						opacity={0.6}
					/>
					<XAxis
						dataKey="date"
						tick={{ fontSize: 10, fill: axisColor }}
						interval={interval}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
						tick={{ fontSize: 10, fill: axisColor }}
						tickLine={false}
						axisLine={false}
						width={40}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: tooltipBg,
							borderColor: tooltipBorder,
							color: tooltipText,
							fontSize: 12,
							borderRadius: 6,
						}}
						labelStyle={{ color: tooltipText }}
						itemStyle={{ color: tooltipText }}
						formatter={(value) => {
							if (value === null || value === undefined) return "—";
							const num = typeof value === "number" ? value : Number(value);
							if (Number.isNaN(num)) return "—";
							return `${(num * 100).toFixed(2)}%`;
						}}
					/>
					<Legend
						wrapperStyle={{ fontSize: 11, color: axisColor }}
						iconSize={8}
					/>
					<Line
						type="monotone"
						dataKey={`blk_${metric}`}
						stroke={blkColor}
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						name="BLK"
						connectNulls
						isAnimationActive={false}
					/>
					<Line
						type="monotone"
						dataKey={`dbl_${metric}`}
						stroke="#3b82f6"
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						name="DBL"
						connectNulls
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
