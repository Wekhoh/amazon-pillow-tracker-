import { prisma } from "@/lib/prisma";
import { rolling7d, type DailyMetric } from "@/lib/calculations";
import { CompareChart, type CompareDataPoint } from "./compare-chart";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Num } from "@/components/num";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPct } from "@/lib/format";

export const dynamic = "force-dynamic";

type AsinSummary = {
	label: "BLK" | "DBL";
	daysCount: number;
	cumSpend: number;
	cumSales: number;
	cumAdSales: number;
	cumOrders: number;
	cumAdOrders: number;
	cumImpressions: number;
	cumClicks: number;
	acos: number | null;
	tacos: number | null;
	cvr: number | null;
	roas: number | null;
};

async function getAsinData(label: "BLK" | "DBL"): Promise<{
	summary: AsinSummary | null;
	trend: Array<{
		date: string;
		acos: number | null;
		tacos: number | null;
		cvr: number | null;
	}>;
}> {
	const asin = await prisma.asin.findUnique({ where: { label } });
	if (!asin) return { summary: null, trend: [] };
	const records = await prisma.dailyRecord.findMany({
		where: { asinId: asin.id },
		orderBy: { date: "asc" },
	});
	if (records.length === 0) return { summary: null, trend: [] };

	const metrics: DailyMetric[] = records.map((r) => ({
		date: r.date,
		adSpendUsd: r.adSpendUsd,
		adSalesUsd: r.adSalesUsd,
		totalSalesUsd: r.totalSalesUsd,
		clicks: r.clicks,
		adOrders: r.adOrders,
		totalOrders: r.totalOrders,
	}));

	const trend = metrics.map((_, i) => {
		const w = rolling7d(metrics, i);
		return {
			date: metrics[i].date.toISOString().slice(5, 10),
			acos: w.acos,
			tacos: w.tacos,
			cvr: w.cvr,
		};
	});

	const latest = rolling7d(metrics, metrics.length - 1);
	const summary: AsinSummary = {
		label,
		daysCount: records.length,
		cumSpend: records.reduce((s, r) => s + r.adSpendUsd, 0),
		cumSales: records.reduce((s, r) => s + r.totalSalesUsd, 0),
		cumAdSales: records.reduce((s, r) => s + r.adSalesUsd, 0),
		cumOrders: records.reduce((s, r) => s + r.totalOrders, 0),
		cumAdOrders: records.reduce((s, r) => s + r.adOrders, 0),
		cumImpressions: records.reduce((s, r) => s + r.impressions, 0),
		cumClicks: records.reduce((s, r) => s + r.clicks, 0),
		acos: latest.acos,
		tacos: latest.tacos,
		cvr: latest.cvr,
		roas: latest.roas,
	};

	return { summary, trend };
}

function DiffKpi({
	label,
	description,
	blk,
	dbl,
	type,
	lowerBetter = false,
}: {
	label: string;
	description?: string;
	blk: number | null;
	dbl: number | null;
	type: "pct" | "ratio";
	lowerBetter?: boolean;
}) {
	const hasBoth = blk !== null && dbl !== null;
	const blkWins = hasBoth && (lowerBetter ? blk < dbl : blk > dbl);
	const dblWins = hasBoth && (lowerBetter ? dbl < blk : dbl > blk);
	const delta = hasBoth ? Math.abs(blk - dbl) : null;
	const fmtVal = (v: number | null) =>
		v === null ? "—" : type === "pct" ? fmtPct(v) : v.toFixed(2);
	return (
		<Card>
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				{delta !== null && (
					<CardAction>
						<Badge
							variant="outline"
							className="font-mono tabular-nums text-[10px]"
						>
							Δ{" "}
							{type === "pct"
								? `${(delta * 100).toFixed(1)}pp`
								: delta.toFixed(2)}
						</Badge>
					</CardAction>
				)}
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-2">
					<div
						className={cn(
							"rounded-md px-2 py-1.5 transition-colors",
							blkWins && "bg-emerald-500/10",
						)}
					>
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
							BLK
						</div>
						<Num className="text-xl font-bold leading-tight">{fmtVal(blk)}</Num>
					</div>
					<div
						className={cn(
							"rounded-md px-2 py-1.5 transition-colors",
							dblWins && "bg-emerald-500/10",
						)}
					>
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
							DBL
						</div>
						<Num className="text-xl font-bold leading-tight">{fmtVal(dbl)}</Num>
					</div>
				</div>
				{description && (
					<p className="text-[10px] text-muted-foreground mt-2">
						{description}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function CumRow({
	label,
	blkVal,
	dblVal,
	fmt,
	lowerBetter = false,
}: {
	label: string;
	blkVal: number | null;
	dblVal: number | null;
	fmt: (v: number) => string;
	lowerBetter?: boolean;
}) {
	const hasBoth = blkVal !== null && dblVal !== null;
	const blkWins = hasBoth && (lowerBetter ? blkVal < dblVal : blkVal > dblVal);
	const dblWins = hasBoth && (lowerBetter ? dblVal < blkVal : dblVal > blkVal);
	const delta = hasBoth ? blkVal - dblVal : null;
	return (
		<tr>
			<td className="py-2 text-muted-foreground">{label}</td>
			<td
				className={cn(
					"py-2 text-right font-mono tabular-nums",
					blkWins && "text-emerald-600 dark:text-emerald-400 font-semibold",
				)}
			>
				{blkVal !== null ? fmt(blkVal) : "—"}
			</td>
			<td
				className={cn(
					"py-2 text-right font-mono tabular-nums",
					dblWins && "text-emerald-600 dark:text-emerald-400 font-semibold",
				)}
			>
				{dblVal !== null ? fmt(dblVal) : "—"}
			</td>
			<td className="py-2 text-right font-mono tabular-nums text-xs text-muted-foreground">
				{delta !== null ? (delta > 0 ? "+" : "") + fmt(delta) : "—"}
			</td>
		</tr>
	);
}

export default async function ComparePage() {
	const [blkData, dblData] = await Promise.all([
		getAsinData("BLK"),
		getAsinData("DBL"),
	]);
	const blk = blkData.summary;
	const dbl = dblData.summary;

	if (!blk && !dbl) {
		return (
			<div className="max-w-screen-2xl space-y-6">
				<header>
					<h2 className="text-2xl font-bold tracking-tight">BLK vs DBL 对比</h2>
				</header>
				<p>
					请运行 <code className="px-1 py-0.5 bg-muted rounded">pnpm sync</code>{" "}
					从 Excel 同步
				</p>
			</div>
		);
	}

	const baseTrend = blkData.trend.length > 0 ? blkData.trend : dblData.trend;
	const merged: CompareDataPoint[] = baseTrend.map((b, i) => ({
		date: b.date,
		blk_acos: blkData.trend[i]?.acos ?? null,
		blk_tacos: blkData.trend[i]?.tacos ?? null,
		blk_cvr: blkData.trend[i]?.cvr ?? null,
		dbl_acos: dblData.trend[i]?.acos ?? null,
		dbl_tacos: dblData.trend[i]?.tacos ?? null,
		dbl_cvr: dblData.trend[i]?.cvr ?? null,
	}));

	const daysCount = blk?.daysCount ?? dbl?.daysCount ?? 0;
	const blkCumAcos =
		blk && blk.cumAdSales > 0 ? blk.cumSpend / blk.cumAdSales : null;
	const dblCumAcos =
		dbl && dbl.cumAdSales > 0 ? dbl.cumSpend / dbl.cumAdSales : null;
	const blkCumTacos =
		blk && blk.cumSales > 0 ? blk.cumSpend / blk.cumSales : null;
	const dblCumTacos =
		dbl && dbl.cumSales > 0 ? dbl.cumSpend / dbl.cumSales : null;
	const blkCumRoas =
		blk && blk.cumSpend > 0 ? blk.cumSales / blk.cumSpend : null;
	const dblCumRoas =
		dbl && dbl.cumSpend > 0 ? dbl.cumSales / dbl.cumSpend : null;
	const blkCumCvr =
		blk && blk.cumClicks > 0 ? blk.cumAdOrders / blk.cumClicks : null;
	const dblCumCvr =
		dbl && dbl.cumClicks > 0 ? dbl.cumAdOrders / dbl.cumClicks : null;
	const blkCumCtr =
		blk && blk.cumImpressions > 0 ? blk.cumClicks / blk.cumImpressions : null;
	const dblCumCtr =
		dbl && dbl.cumImpressions > 0 ? dbl.cumClicks / dbl.cumImpressions : null;

	return (
		<div className="max-w-screen-2xl space-y-6">
			<header>
				<h2 className="text-2xl font-bold tracking-tight">BLK vs DBL 对比</h2>
				<p className="text-muted-foreground text-sm mt-1">
					<span className="font-mono">B0FCSM9THX</span> · BLK 与{" "}
					<span className="font-mono">B0FCS6HX7H</span> · DBL · {daysCount}{" "}
					天数据
				</p>
			</header>

			<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<DiffKpi
					label="Rolling 7D ACoS"
					blk={blk?.acos ?? null}
					dbl={dbl?.acos ?? null}
					type="pct"
					lowerBetter
					description="广告效率 · 越低越好"
				/>
				<DiffKpi
					label="Rolling 7D TACoS"
					blk={blk?.tacos ?? null}
					dbl={dbl?.tacos ?? null}
					type="pct"
					lowerBetter
					description="盈亏关键 · 红线 32.34%"
				/>
				<DiffKpi
					label="Rolling 7D CVR"
					blk={blk?.cvr ?? null}
					dbl={dbl?.cvr ?? null}
					type="pct"
					description="点击→订单 · 目标 11%"
				/>
				<DiffKpi
					label="Rolling 7D ROAS"
					blk={blk?.roas ?? null}
					dbl={dbl?.roas ?? null}
					type="ratio"
					description="广告投产比 · >1 盈利"
				/>
			</section>

			<section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{(
					[
						{
							key: "acos",
							title: "Rolling 7D ACoS 走势",
							desc: "广告花费占广告销售",
						},
						{
							key: "tacos",
							title: "Rolling 7D TACoS 走势",
							desc: "广告花费占总销售",
						},
						{
							key: "cvr",
							title: "Rolling 7D CVR 走势",
							desc: "点击到订单转化率",
						},
					] as const
				).map(({ key, title, desc }) => (
					<Card key={key}>
						<CardHeader>
							<CardTitle className="text-base">{title}</CardTitle>
							<CardDescription>{desc}</CardDescription>
						</CardHeader>
						<CardContent>
							<CompareChart data={merged} metric={key} />
						</CardContent>
					</Card>
				))}
			</section>

			<Card>
				<CardHeader>
					<CardTitle>累计对比 ({daysCount} 天)</CardTitle>
					<CardDescription>
						全周期数据 · 绿色 = 该指标占优 · Δ = BLK − DBL
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left border-b text-muted-foreground">
									<th className="font-medium py-2">指标</th>
									<th className="font-medium py-2 text-right">BLK</th>
									<th className="font-medium py-2 text-right">DBL</th>
									<th className="font-medium py-2 text-right">Δ</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								<CumRow
									label="累计花费 (USD)"
									blkVal={blk?.cumSpend ?? null}
									dblVal={dbl?.cumSpend ?? null}
									fmt={fmtMoney}
									lowerBetter
								/>
								<CumRow
									label="累计总销售 (USD)"
									blkVal={blk?.cumSales ?? null}
									dblVal={dbl?.cumSales ?? null}
									fmt={fmtMoney}
								/>
								<CumRow
									label="累计 ROAS"
									blkVal={blkCumRoas}
									dblVal={dblCumRoas}
									fmt={(v) => v.toFixed(2)}
								/>
								<CumRow
									label="累计 ACoS"
									blkVal={blkCumAcos}
									dblVal={dblCumAcos}
									fmt={(v) => fmtPct(v, 2)}
									lowerBetter
								/>
								<CumRow
									label="累计 TACoS"
									blkVal={blkCumTacos}
									dblVal={dblCumTacos}
									fmt={(v) => fmtPct(v, 2)}
									lowerBetter
								/>
								<CumRow
									label="累计总订单"
									blkVal={blk?.cumOrders ?? null}
									dblVal={dbl?.cumOrders ?? null}
									fmt={(v) => v.toLocaleString()}
								/>
								<CumRow
									label="累计 CTR"
									blkVal={blkCumCtr}
									dblVal={dblCumCtr}
									fmt={(v) => fmtPct(v, 2)}
								/>
								<CumRow
									label="累计 CVR (点击)"
									blkVal={blkCumCvr}
									dblVal={dblCumCvr}
									fmt={(v) => fmtPct(v, 2)}
								/>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
