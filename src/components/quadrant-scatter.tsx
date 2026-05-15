"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	ZAxis,
	CartesianGrid,
	Tooltip,
	ReferenceLine,
	ResponsiveContainer,
	Cell,
} from "recharts";

interface QuadrantPoint {
	date: string;
	deltaAcos: number;
	deltaTacos: number;
	isLatest?: boolean;
}

interface QuadrantScatterProps {
	points: QuadrantPoint[];
}

export function QuadrantScatter({ points }: QuadrantScatterProps) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const isDark = mounted && resolvedTheme === "dark";

	const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
	const axisColor = isDark ? "#a1a1aa" : "#71717a";
	const refColor = isDark ? "#52525b" : "#94a3b8";
	const tooltipBg = isDark ? "#18181b" : "#ffffff";
	const tooltipBorder = isDark ? "#52525b" : "#e4e4e7";
	const tooltipText = isDark ? "#fafafa" : "#0a0a0a";

	if (points.length === 0) {
		return (
			<div className="text-sm text-muted-foreground py-8 text-center">
				需要至少 14 天数据才能计算四象限位置
			</div>
		);
	}
	return (
		<div className="space-y-2">
			<ResponsiveContainer width="100%" height={280}>
				<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke={gridColor}
						opacity={0.6}
					/>
					<XAxis
						type="number"
						dataKey="deltaAcos"
						name="ΔACoS"
						tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
						tick={{ fontSize: 11, fill: axisColor }}
						domain={["dataMin", "dataMax"]}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						type="number"
						dataKey="deltaTacos"
						name="ΔTACoS"
						tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
						tick={{ fontSize: 11, fill: axisColor }}
						domain={["dataMin", "dataMax"]}
						tickLine={false}
						axisLine={false}
					/>
					<ZAxis range={[60, 120]} />
					<ReferenceLine x={0} stroke={refColor} strokeDasharray="2 2" />
					<ReferenceLine y={0} stroke={refColor} strokeDasharray="2 2" />
					<Tooltip
						cursor={{ strokeDasharray: "3 3" }}
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
							const num = typeof value === "number" ? value : Number(value);
							if (Number.isNaN(num)) return ["—", name];
							return [`${(num * 100).toFixed(2)}%`, name];
						}}
						labelFormatter={(_, payload) =>
							(payload?.[0]?.payload as QuadrantPoint)?.date ?? ""
						}
					/>
					<Scatter data={points} fill="#3b82f6" isAnimationActive={false}>
						{points.map((p, i) => (
							<Cell key={i} fill={p.isLatest ? "#ef4444" : "#3b82f6"} />
						))}
					</Scatter>
				</ScatterChart>
			</ResponsiveContainer>
			<div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
				<div>← 左下：双改善（最理想）</div>
				<div>右下：自然增长信号 →</div>
				<div>← 左上：降本但承压</div>
				<div>右上：依赖加重（警告） →</div>
			</div>
		</div>
	);
}
