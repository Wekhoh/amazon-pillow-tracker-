"use client";

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
	return (
		<ResponsiveContainer width="100%" height={280}>
			<LineChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="date" tick={{ fontSize: 11 }} />
				<YAxis
					tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
					tick={{ fontSize: 11 }}
				/>
				<Tooltip
					formatter={(value) => {
						if (value === null || value === undefined) return "—";
						const num = typeof value === "number" ? value : Number(value);
						if (Number.isNaN(num)) return "—";
						return `${(num * 100).toFixed(2)}%`;
					}}
				/>
				<Legend />
				<Line
					type="monotone"
					dataKey={`blk_${metric}`}
					stroke="#1e293b"
					name="BLK"
					connectNulls
				/>
				<Line
					type="monotone"
					dataKey={`dbl_${metric}`}
					stroke="#3b82f6"
					name="DBL"
					connectNulls
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
