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

interface DataPoint {
	date: string;
	acos: number | null;
	tacos: number | null;
	cvr: number | null;
	roas: number | null;
}

export function RollingChart({ data }: { data: DataPoint[] }) {
	return (
		<ResponsiveContainer width="100%" height={320}>
			<LineChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="date" tick={{ fontSize: 11 }} />
				<YAxis
					yAxisId="left"
					tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
					tick={{ fontSize: 11 }}
				/>
				<YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
				<Tooltip
					formatter={(value, name) => {
						if (value === null || value === undefined) return "—";
						const num = typeof value === "number" ? value : Number(value);
						if (Number.isNaN(num)) return "—";
						if (name === "ROAS") return num.toFixed(2);
						return `${(num * 100).toFixed(2)}%`;
					}}
				/>
				<Legend />
				<Line
					yAxisId="left"
					type="monotone"
					dataKey="acos"
					stroke="#dc2626"
					name="ACoS"
					strokeWidth={2}
					dot={{ r: 2 }}
					activeDot={{ r: 5 }}
					isAnimationActive={false}
					connectNulls
				/>
				<Line
					yAxisId="left"
					type="monotone"
					dataKey="tacos"
					stroke="#f97316"
					name="TACoS"
					strokeWidth={2}
					dot={{ r: 2 }}
					activeDot={{ r: 5 }}
					isAnimationActive={false}
					connectNulls
				/>
				<Line
					yAxisId="left"
					type="monotone"
					dataKey="cvr"
					stroke="#16a34a"
					name="CVR"
					strokeWidth={2}
					dot={{ r: 2 }}
					activeDot={{ r: 5 }}
					isAnimationActive={false}
					connectNulls
				/>
				<Line
					yAxisId="right"
					type="monotone"
					dataKey="roas"
					stroke="#2563eb"
					name="ROAS"
					strokeWidth={2}
					dot={{ r: 2 }}
					activeDot={{ r: 5 }}
					isAnimationActive={false}
					connectNulls
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
