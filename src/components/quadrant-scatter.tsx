"use client";

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
					<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
					<XAxis
						type="number"
						dataKey="deltaAcos"
						name="ΔACoS"
						tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
						tick={{ fontSize: 11 }}
						domain={["dataMin", "dataMax"]}
					/>
					<YAxis
						type="number"
						dataKey="deltaTacos"
						name="ΔTACoS"
						tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
						tick={{ fontSize: 11 }}
						domain={["dataMin", "dataMax"]}
					/>
					<ZAxis range={[60, 120]} />
					<ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="2 2" />
					<ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
					<Tooltip
						cursor={{ strokeDasharray: "3 3" }}
						formatter={(v: number, n: string) => [
							`${(v * 100).toFixed(2)}%`,
							n,
						]}
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
