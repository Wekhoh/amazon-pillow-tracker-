import { Num } from "@/components/num";
import { cn } from "@/lib/utils";

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
	const steps: {
		label: string;
		amount: number;
		cumulative: number;
		type: "start" | "cost" | "end";
	}[] = [];
	steps.push({
		label: "售价",
		amount: p.priceUsd,
		cumulative: p.priceUsd,
		type: "start",
	});

	const costs: [string, number][] = [
		["COGS", p.cogsUsd],
		["佣金", p.commissionUsd],
		["FBA fee", p.fbaFeeUsd],
		["入库费", p.inboundFeeUsd],
		["仓储摊销", p.storageAmortUsd],
		["退货费", p.returnFeeUsd],
		["收款手续费", p.paymentFeeUsd],
	];
	let running = p.priceUsd;
	for (const [label, amt] of costs) {
		running -= amt;
		steps.push({
			label,
			amount: -amt,
			cumulative: running,
			type: "cost",
		});
	}
	steps.push({
		label: "单件毛利",
		amount: running,
		cumulative: running,
		type: "end",
	});

	const max = p.priceUsd;

	return (
		<div className="space-y-1">
			{steps.map((s, i) => {
				const isCost = s.type === "cost";
				const isStart = s.type === "start";
				const isEnd = s.type === "end";
				const fillPct = (Math.max(0, s.cumulative) / max) * 100;
				return (
					<div
						key={i}
						className={cn(
							"relative grid grid-cols-[1fr_auto_auto] gap-3 items-center px-3 py-2 text-sm rounded-sm",
							isEnd && "font-semibold mt-1 border-t pt-3",
						)}
					>
						<div
							className={cn(
								"absolute inset-y-0 left-0 rounded-sm",
								isStart && "bg-blue-500/20",
								isCost && "bg-red-500/10",
								isEnd && "bg-emerald-500/20",
							)}
							style={{ width: `${fillPct}%` }}
							aria-hidden
						/>
						<span className="relative text-muted-foreground">{s.label}</span>
						<Num className={cn("relative", isCost && "text-red-500")}>
							{isCost ? "−" : ""}${Math.abs(s.amount).toFixed(2)}
						</Num>
						<Num className="relative text-muted-foreground w-20 text-right">
							${s.cumulative.toFixed(2)}
						</Num>
					</div>
				);
			})}
		</div>
	);
}
