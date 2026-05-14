"use client";

import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";

interface SparklineProps {
	data: { v: number | null }[];
	color?: string;
	height?: number;
}

export function Sparkline({
	data,
	color = "#3b82f6",
	height = 24,
}: SparklineProps) {
	const cleaned = data.filter((d) => d.v !== null && d.v !== undefined);
	if (cleaned.length < 2) return <div style={{ height }} className="w-full" />;
	return (
		<ResponsiveContainer width="100%" height={height}>
			<LineChart data={data} margin={{ top: 1, right: 1, bottom: 1, left: 1 }}>
				<YAxis hide domain={["auto", "auto"]} />
				<Line
					type="monotone"
					dataKey="v"
					stroke={color}
					strokeWidth={1.5}
					dot={false}
					connectNulls
					isAnimationActive={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
