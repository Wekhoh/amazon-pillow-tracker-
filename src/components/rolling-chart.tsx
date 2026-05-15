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

interface DataPoint {
	date: string;
	acos: number | null;
	tacos: number | null;
	cvr: number | null;
	roas: number | null;
}

export function RollingChart({ data }: { data: DataPoint[] }) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const isDark = mounted && resolvedTheme === "dark";

	const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
	const axisColor = isDark ? "#a1a1aa" : "#71717a";
	const tooltipBg = isDark ? "#18181b" : "#ffffff";
	const tooltipBorder = isDark ? "#52525b" : "#e4e4e7";
	const tooltipText = isDark ? "#fafafa" : "#0a0a0a";

	const interval = Math.max(0, Math.floor(data.length / 8));
	return (
		<div className="aspect-[16/7] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
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
						yAxisId="left"
						tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
						tick={{ fontSize: 10, fill: axisColor }}
						tickLine={false}
						axisLine={false}
						width={40}
					/>
					<YAxis
						yAxisId="right"
						orientation="right"
						tick={{ fontSize: 10, fill: axisColor }}
						tickLine={false}
						axisLine={false}
						width={30}
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
						formatter={(value, name) => {
							if (value === null || value === undefined) return "—";
							const num = typeof value === "number" ? value : Number(value);
							if (Number.isNaN(num)) return "—";
							if (name === "ROAS") return num.toFixed(2);
							return `${(num * 100).toFixed(2)}%`;
						}}
					/>
					<Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="acos"
						stroke="#ef4444"
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						name="ACoS"
						connectNulls
						isAnimationActive={false}
					/>
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="tacos"
						stroke="#f59e0b"
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						name="TACoS"
						connectNulls
						isAnimationActive={false}
					/>
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="cvr"
						stroke="#10b981"
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						name="CVR"
						connectNulls
						isAnimationActive={false}
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="roas"
						stroke="#2563eb"
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						name="ROAS"
						connectNulls
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
