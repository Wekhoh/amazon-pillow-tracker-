import { prisma } from "@/lib/prisma";
import {
	rolling7d,
	delta7d,
	sparklineData,
	getPhase,
	type DailyMetric,
} from "@/lib/calculations";
import { generateInsights } from "@/lib/insights";
import { AsinSwitcher } from "@/components/asin-switcher";
import { HeroKpi } from "@/components/hero-kpi";
import { StageTimeline } from "@/components/stage-timeline";
import { QuadrantScatter } from "@/components/quadrant-scatter";
import { ConversionFunnel } from "@/components/conversion-funnel";
import { ActionPanel } from "@/components/action-panel";
import { EconomicsWaterfall } from "@/components/economics-waterfall";
import { RollingChart } from "@/components/rolling-chart";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardAction,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Num } from "@/components/num";

export const dynamic = "force-dynamic";

interface PageProps {
	searchParams: Promise<{ asin?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
	const params = await searchParams;
	const label = (params.asin === "DBL" ? "DBL" : "BLK") as "BLK" | "DBL";

	const asin = await prisma.asin.findUnique({
		where: { label },
		include: { unitEconomics: true },
	});
	if (!asin) {
		return (
			<div className="text-red-500">
				ASIN {label} 未找到，请先运行 <code>pnpm prisma db seed</code>
			</div>
		);
	}

	const records = await prisma.dailyRecord.findMany({
		where: { asinId: asin.id },
		orderBy: { date: "asc" },
	});
	if (records.length === 0) {
		return (
			<div className="p-6">
				未同步数据，请先运行{" "}
				<code className="px-1 py-0.5 bg-muted rounded">pnpm sync</code>
			</div>
		);
	}

	const metrics: DailyMetric[] = records.map((r) => ({
		date: r.date,
		adSpendUsd: r.adSpendUsd,
		adSalesUsd: r.adSalesUsd,
		totalSalesUsd: r.totalSalesUsd,
		clicks: r.clicks,
		adOrders: r.adOrders,
		totalOrders: r.totalOrders,
	}));

	const latestIdx = metrics.length - 1;
	const latest = rolling7d(metrics, latestIdx);
	const latestRow = records[latestIdx];
	const phase = getPhase(latestRow.dayNum);

	const totalImpr = records.reduce((s, r) => s + r.impressions, 0);
	const totalClicks = records.reduce((s, r) => s + r.clicks, 0);
	const totalAdOrders = records.reduce((s, r) => s + r.adOrders, 0);
	const totalAdSales = records.reduce((s, r) => s + r.adSalesUsd, 0);

	const deltaAcos = delta7d(metrics, latestIdx, "acos");
	const deltaTacos = delta7d(metrics, latestIdx, "tacos");
	const deltaCvr = delta7d(metrics, latestIdx, "cvr");
	const deltaRoas = delta7d(metrics, latestIdx, "roas");

	const sparkAcos = sparklineData(metrics, "acos");
	const sparkTacos = sparklineData(metrics, "tacos");
	const sparkCvr = sparklineData(metrics, "cvr");
	const sparkRoas = sparklineData(metrics, "roas");

	const paramRows = await prisma.param.findMany();
	const paramMap = Object.fromEntries(
		paramRows.map((p) => [p.key, p.value] as const),
	);
	const tacosRedline = parseFloat(paramMap.tacos_redline ?? "0.3234");
	const targetCvr = parseFloat(paramMap.target_cvr ?? "0.11");

	const insights = generateInsights({
		metrics,
		inventoryByIndex: records.map((r) => r.inventory),
		asinLabel: label,
		tacosRedline,
		targetCvr,
	});

	const quadPoints = metrics
		.map((_, i) => {
			const da = delta7d(metrics, i, "acos");
			const dt = delta7d(metrics, i, "tacos");
			if (da === null || dt === null) return null;
			return {
				date: records[i].date.toISOString().slice(5, 10),
				deltaAcos: da,
				deltaTacos: dt,
				isLatest: i === latestIdx,
			};
		})
		.filter((p): p is NonNullable<typeof p> => p !== null);

	const funnelSteps = [
		{ label: "曝光", value: totalImpr, color: "#3b82f6" },
		{
			label: "点击",
			value: totalClicks,
			conversionFromPrev: totalImpr > 0 ? totalClicks / totalImpr : 0,
			color: "#06b6d4",
		},
		{
			label: "订单",
			value: totalAdOrders,
			conversionFromPrev: totalClicks > 0 ? totalAdOrders / totalClicks : 0,
			color: "#10b981",
		},
		{
			label: "销售额",
			value: Math.round(totalAdSales),
			prefix: "$",
			color: "#22c55e",
		},
	];

	const ue = asin.unitEconomics;
	const economicsProps = ue
		? {
				priceUsd: ue.priceUsd,
				cogsUsd: +(
					(ue.cogsPurchaseCny + ue.cogsShippingCny + ue.cogsPackagingCny) /
					ue.fxRateCnyPerUsd
				).toFixed(2),
				commissionUsd: +(ue.priceUsd * ue.commissionRate).toFixed(2),
				fbaFeeUsd: ue.fbaFeeUsd,
				inboundFeeUsd: ue.inboundFeeUsd,
				storageAmortUsd: ue.storageAmortizationUsd,
				returnFeeUsd: +(
					Math.max(0, ue.returnRateEstimate - ue.returnThreshold) *
					ue.returnFeeUsd
				).toFixed(2),
				paymentFeeUsd: +(ue.priceUsd * 0.007).toFixed(2),
			}
		: null;

	const breakEvenAcos = economicsProps
		? (economicsProps.priceUsd -
				economicsProps.cogsUsd -
				economicsProps.commissionUsd -
				economicsProps.fbaFeeUsd -
				economicsProps.inboundFeeUsd -
				economicsProps.storageAmortUsd -
				economicsProps.returnFeeUsd -
				economicsProps.paymentFeeUsd) /
			economicsProps.priceUsd
		: null;

	const chartData = metrics.map((_, i) => {
		const r = rolling7d(metrics, i);
		return {
			date: records[i].date.toISOString().slice(5, 10),
			acos: r.acos,
			tacos: r.tacos,
			cvr: r.cvr,
			roas: r.roas,
		};
	});

	const recent7 = records.slice(-7).reverse();

	const fmtPct = (v: number | null, digits = 1) =>
		v === null ? "—" : `${(v * 100).toFixed(digits)}`;
	const fmtNum = (v: number | null, digits = 2) =>
		v === null ? "—" : v.toFixed(digits);

	const acosStatus: "default" | "good" | "warning" | "critical" =
		latest.acos === null
			? "default"
			: latest.acos > tacosRedline * 1.5
				? "critical"
				: latest.acos > tacosRedline
					? "warning"
					: "good";

	const tacosStatus =
		latest.tacos !== null && latest.tacos > tacosRedline
			? "warning"
			: "default";
	const roasStatus =
		latest.roas !== null && latest.roas < 1 ? "critical" : "default";

	return (
		<div className="flex flex-col gap-6 max-w-screen-2xl">
			{/* Header */}
			<header className="flex items-end justify-between border-b pb-4 -mt-2 gap-4">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-[10px]">
							{phase}
						</Badge>
						<Badge variant="secondary" className="text-[10px]">
							Day <Num className="ml-0.5">{latestRow.dayNum}</Num>
						</Badge>
						<span className="text-xs text-muted-foreground">
							· 最新数据 {latestRow.date.toISOString().slice(0, 10)}
						</span>
					</div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{label}{" "}
						<span className="text-muted-foreground font-normal">
							· {asin.color}
						</span>
					</h1>
					<p className="text-xs text-muted-foreground font-mono">{asin.code}</p>
				</div>
				<AsinSwitcher />
			</header>

			{/* Hero Strip — only 4 KPIs, big and proud */}
			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<HeroKpi
					label="Rolling 7D ACoS"
					value={fmtPct(latest.acos)}
					unit="%"
					delta={deltaAcos}
					deltaInverted
					sparkData={sparkAcos}
					sparkColor="#ef4444"
					status={acosStatus}
					hint={`红线 ${(tacosRedline * 100).toFixed(2)}%`}
				/>
				<HeroKpi
					label="Rolling 7D TACoS"
					value={fmtPct(latest.tacos)}
					unit="%"
					delta={deltaTacos}
					deltaInverted
					sparkData={sparkTacos}
					sparkColor="#f59e0b"
					status={tacosStatus}
				/>
				<HeroKpi
					label="Rolling 7D CVR"
					value={fmtPct(latest.cvr)}
					unit="%"
					delta={deltaCvr}
					sparkData={sparkCvr}
					sparkColor="#10b981"
					hint={`目标 ${(targetCvr * 100).toFixed(0)}%`}
				/>
				<HeroKpi
					label="Rolling 7D ROAS"
					value={fmtNum(latest.roas)}
					delta={deltaRoas}
					sparkData={sparkRoas}
					sparkColor="#2563eb"
					status={roasStatus}
					hint="盈亏线 1.00"
				/>
			</section>

			{/* Section A: Trend + Action */}
			<section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
				<Card className="lg:col-span-8">
					<CardHeader>
						<CardTitle>核心趋势</CardTitle>
						<CardDescription>
							Rolling 7D · 4 指标 {records.length} 天走势
						</CardDescription>
						<CardAction>
							<Badge variant="outline" className="text-[10px] font-normal">
								Day 0 · {records[0].date.toISOString().slice(5, 10)} → Day{" "}
								{latestRow.dayNum}
							</Badge>
						</CardAction>
					</CardHeader>
					<CardContent>
						<RollingChart data={chartData} />
					</CardContent>
				</Card>
				<Card className="lg:col-span-4">
					<CardHeader>
						<CardTitle>行动建议</CardTitle>
						<CardDescription>基于阈值规则自动生成</CardDescription>
					</CardHeader>
					<CardContent>
						<ActionPanel insights={insights} />
					</CardContent>
				</Card>
			</section>

			{/* Section B: Stage + Quadrant */}
			<section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
				<Card className="lg:col-span-4">
					<CardHeader>
						<CardTitle>阶段进度</CardTitle>
						<CardDescription>5 阶段路线图</CardDescription>
					</CardHeader>
					<CardContent>
						<StageTimeline currentDay={latestRow.dayNum} />
					</CardContent>
				</Card>
				<Card className="lg:col-span-8">
					<CardHeader>
						<CardTitle>四象限定位</CardTitle>
						<CardDescription>ΔACoS × ΔTACoS · 当前 vs 前 7 天</CardDescription>
						<CardAction>
							<Badge variant="outline" className="text-[10px] font-normal">
								14 天后启用
							</Badge>
						</CardAction>
					</CardHeader>
					<CardContent>
						<QuadrantScatter points={quadPoints} />
					</CardContent>
				</Card>
			</section>

			{/* Section C: Funnel + Economics */}
			<section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
				<Card className="lg:col-span-5">
					<CardHeader>
						<CardTitle>累计转化漏斗</CardTitle>
						<CardDescription>
							{records.length} 天累计 · 曝光 → 点击 → 订单 → 销售
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ConversionFunnel steps={funnelSteps} />
					</CardContent>
				</Card>
				<Card className="lg:col-span-7">
					<CardHeader>
						<CardTitle>单件经济模型</CardTitle>
						<CardDescription>USD · 售价 → 各项成本 → 单件毛利</CardDescription>
						{breakEvenAcos !== null && (
							<CardAction>
								<Badge variant="outline" className="text-[10px] font-normal">
									Break-even ACoS{" "}
									<Num className="ml-1">{(breakEvenAcos * 100).toFixed(1)}</Num>
									%
								</Badge>
							</CardAction>
						)}
					</CardHeader>
					<CardContent>
						{economicsProps ? (
							<EconomicsWaterfall {...economicsProps} />
						) : (
							<div className="text-sm text-muted-foreground">
								未同步单件经济模型
							</div>
						)}
					</CardContent>
				</Card>
			</section>

			{/* Section D: Recent 7-day detail table */}
			<Card>
				<CardHeader>
					<CardTitle>最近 7 天明细</CardTitle>
					<CardDescription>当日数据 · 倒序</CardDescription>
				</CardHeader>
				<CardContent className="px-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>日期</TableHead>
								<TableHead className="text-right">Day</TableHead>
								<TableHead className="text-right">总单</TableHead>
								<TableHead className="text-right">广告单</TableHead>
								<TableHead className="text-right">花费</TableHead>
								<TableHead className="text-right">广告销售</TableHead>
								<TableHead className="text-right">总销售</TableHead>
								<TableHead className="text-right">Impr</TableHead>
								<TableHead className="text-right">Clicks</TableHead>
								<TableHead className="text-right">库存</TableHead>
								<TableHead>备注</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{recent7.map((r) => (
								<TableRow key={r.id}>
									<TableCell className="font-mono text-xs">
										{r.date.toISOString().slice(0, 10)}
									</TableCell>
									<TableCell className="text-right">
										<Num>{r.dayNum}</Num>
									</TableCell>
									<TableCell className="text-right">
										<Num>{r.totalOrders}</Num>
									</TableCell>
									<TableCell className="text-right">
										<Num>{r.adOrders}</Num>
									</TableCell>
									<TableCell className="text-right">
										<Num>${r.adSpendUsd.toFixed(2)}</Num>
									</TableCell>
									<TableCell className="text-right">
										<Num>${r.adSalesUsd.toFixed(2)}</Num>
									</TableCell>
									<TableCell className="text-right">
										<Num>${r.totalSalesUsd.toFixed(2)}</Num>
									</TableCell>
									<TableCell className="text-right">
										<Num>{r.impressions.toLocaleString()}</Num>
									</TableCell>
									<TableCell className="text-right">
										<Num>{r.clicks}</Num>
									</TableCell>
									<TableCell className="text-right">
										{r.inventory === null ? (
											<span className="text-amber-500 text-xs">未填</span>
										) : (
											<Num>{r.inventory}</Num>
										)}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
										{r.notes ?? "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
