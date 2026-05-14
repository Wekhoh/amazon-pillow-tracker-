import { cn } from "@/lib/utils";

interface WaterfallStep {
	label: string;
	value: number;
	cumulative: number;
	type: "start" | "cost" | "end";
}

interface EconomicsWaterfallProps {
	priceUsd: number;
	cogsUsd: number;
	commissionUsd: number;
	fbaFeeUsd: number;
	inboundFeeUsd: number;
	storageAmortUsd: number;
	returnFeeUsd: number;
	paymentFeeUsd: number;
}

export function EconomicsWaterfall(p: EconomicsWaterfallProps) {
	const steps: WaterfallStep[] = [
		{
			label: "售价",
			value: p.priceUsd,
			cumulative: p.priceUsd,
			type: "start",
		},
		{
			label: "COGS",
			value: -p.cogsUsd,
			cumulative: p.priceUsd - p.cogsUsd,
			type: "cost",
		},
		{
			label: "佣金",
			value: -p.commissionUsd,
			cumulative: p.priceUsd - p.cogsUsd - p.commissionUsd,
			type: "cost",
		},
		{
			label: "FBA fee",
			value: -p.fbaFeeUsd,
			cumulative: p.priceUsd - p.cogsUsd - p.commissionUsd - p.fbaFeeUsd,
			type: "cost",
		},
		{
			label: "入库费",
			value: -p.inboundFeeUsd,
			cumulative:
				p.priceUsd -
				p.cogsUsd -
				p.commissionUsd -
				p.fbaFeeUsd -
				p.inboundFeeUsd,
			type: "cost",
		},
		{
			label: "仓储摊销",
			value: -p.storageAmortUsd,
			cumulative:
				p.priceUsd -
				p.cogsUsd -
				p.commissionUsd -
				p.fbaFeeUsd -
				p.inboundFeeUsd -
				p.storageAmortUsd,
			type: "cost",
		},
		{
			label: "退货费",
			value: -p.returnFeeUsd,
			cumulative:
				p.priceUsd -
				p.cogsUsd -
				p.commissionUsd -
				p.fbaFeeUsd -
				p.inboundFeeUsd -
				p.storageAmortUsd -
				p.returnFeeUsd,
			type: "cost",
		},
		{
			label: "收款手续费",
			value: -p.paymentFeeUsd,
			cumulative:
				p.priceUsd -
				p.cogsUsd -
				p.commissionUsd -
				p.fbaFeeUsd -
				p.inboundFeeUsd -
				p.storageAmortUsd -
				p.returnFeeUsd -
				p.paymentFeeUsd,
			type: "cost",
		},
	];
	const finalMargin = steps[steps.length - 1].cumulative;
	steps.push({
		label: "单件毛利",
		value: finalMargin,
		cumulative: finalMargin,
		type: "end",
	});

	const max = p.priceUsd;

	return (
		<div className="space-y-1.5">
			{steps.map((s, i) => {
				const widthPct = (Math.abs(s.cumulative) / max) * 100;
				const isCost = s.type === "cost";
				const isStart = s.type === "start";
				const isEnd = s.type === "end";
				return (
					<div key={i} className="flex items-center gap-2 text-xs">
						<span className="w-20 text-muted-foreground">{s.label}</span>
						<div className="flex-1 h-5 bg-muted rounded relative overflow-hidden">
							<div
								className={cn(
									"h-full",
									isStart && "bg-blue-500",
									isCost && "bg-rose-500/70",
									isEnd && "bg-emerald-500",
								)}
								style={{ width: `${widthPct}%` }}
							/>
						</div>
						<span
							className={cn(
								"w-20 text-right tabular-nums font-medium",
								isCost && "text-rose-500",
								isEnd && "text-emerald-500",
							)}
						>
							{isCost ? "−" : ""}${Math.abs(s.value).toFixed(2)}
						</span>
						<span className="w-20 text-right text-muted-foreground tabular-nums">
							= ${s.cumulative.toFixed(2)}
						</span>
					</div>
				);
			})}
		</div>
	);
}
