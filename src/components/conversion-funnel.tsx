"use client";

interface FunnelStep {
	label: string;
	value: number;
	unit?: string;
	conversionFromPrev?: number;
	color: string;
}

interface ConversionFunnelProps {
	steps: FunnelStep[];
}

export function ConversionFunnel({ steps }: ConversionFunnelProps) {
	const max = Math.max(...steps.map((s) => s.value), 1);
	return (
		<div className="space-y-2.5">
			{steps.map((s) => {
				const widthPct = (s.value / max) * 100;
				return (
					<div key={s.label}>
						<div className="flex justify-between text-xs mb-1">
							<span className="text-muted-foreground">{s.label}</span>
							<span className="tabular-nums font-medium">
								{s.value.toLocaleString()}
								{s.unit ?? ""}
								{s.conversionFromPrev !== undefined && (
									<span className="text-muted-foreground ml-2">
										({(s.conversionFromPrev * 100).toFixed(2)}%)
									</span>
								)}
							</span>
						</div>
						<div className="h-6 rounded bg-muted overflow-hidden">
							<div
								className="h-full transition-all"
								style={{ width: `${widthPct}%`, backgroundColor: s.color }}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}
