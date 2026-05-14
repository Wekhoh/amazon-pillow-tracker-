import { Num } from "@/components/num";

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

function getWidthPct(steps: FunnelStep[], i: number): number {
	if (i === 0) return 100;
	const s = steps[i];
	if (s.conversionFromPrev === undefined) {
		return 30;
	}
	const logVal = Math.log10(Math.max(1, s.value));
	const logMax = Math.log10(Math.max(1, steps[0].value));
	return Math.max(20, Math.min(100, (logVal / logMax) * 100));
}

export function ConversionFunnel({ steps }: ConversionFunnelProps) {
	if (steps.length === 0) return null;

	return (
		<div className="space-y-4">
			{steps.map((s, i) => {
				const widthPct = getWidthPct(steps, i);
				const dropFromPrev =
					i > 0 ? 1 - s.value / (steps[i - 1].value || 1) : 0;
				return (
					<div key={s.label} className="space-y-1.5">
						<div className="flex items-baseline justify-between text-sm">
							<span className="font-medium">{s.label}</span>
							<div className="text-right">
								<Num className="font-semibold">
									{s.value.toLocaleString()}
									{s.unit ?? ""}
								</Num>
								{s.conversionFromPrev !== undefined && (
									<span className="text-xs text-muted-foreground ml-2">
										转化 <Num>{(s.conversionFromPrev * 100).toFixed(2)}%</Num>
									</span>
								)}
							</div>
						</div>
						<div className="relative h-8 rounded-md bg-muted/40 overflow-hidden">
							<div
								className="absolute inset-y-0 left-0 transition-all"
								style={{
									width: `${widthPct}%`,
									backgroundColor: s.color,
									opacity: 0.85,
								}}
							/>
							{i > 0 && dropFromPrev > 0.01 && (
								<div className="absolute right-2 inset-y-0 flex items-center text-[10px] text-muted-foreground">
									流失{" "}
									<Num className="ml-1">{(dropFromPrev * 100).toFixed(1)}%</Num>
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
