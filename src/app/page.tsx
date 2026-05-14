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
				ASIN {label} 未在数据库中。请先运行 <code>pnpm prisma db seed</code>
			</div>
		);
	}

	const records = await prisma.dailyRecord.findMany({
		where: { asinId: asin.id },
		orderBy: { date: "asc" },
	});

	if (records.length === 0) {
		return (
			<div>
				<h2 className="text-xl font-semibold mb-2">还没有数据</h2>
				<p>
					请运行 <code className="px-1 py-0.5 bg-muted rounded">pnpm sync</code>{" "}
					从 Excel 同步
				</p>
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

	const totalSpend = records.reduce((s, r) => s + r.adSpendUsd, 0);
	const totalSales = records.reduce((s, r) => s + r.totalSalesUsd, 0);
	const totalOrders = records.reduce((s, r) => s + r.totalOrders, 0);
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

	const totalConvFunnel = [
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
			unit: " $",
			color: "#22c55e",
		},
	];

	const ue = asin.unitEconomics;
	let economicsProps: React.ComponentProps<typeof EconomicsWaterfall> | null =
		null;
	if (ue) {
		const cogsUsd =
			(ue.cogsPurchaseCny + ue.cogsShippingCny + ue.cogsPackagingCny) /
			ue.fxRateCnyPerUsd;
		const commissionUsd = ue.priceUsd * ue.commissionRate;
		const returnFeeUsd =
			Math.max(0, ue.returnRateEstimate - ue.returnThreshold) * ue.returnFeeUsd;
		const paymentFeeUsd = +(ue.priceUsd * 0.007).toFixed(2);
		economicsProps = {
			priceUsd: ue.priceUsd,
			cogsUsd: +cogsUsd.toFixed(2),
			commissionUsd: +commissionUsd.toFixed(2),
			fbaFeeUsd: ue.fbaFeeUsd,
			inboundFeeUsd: ue.inboundFeeUsd,
			storageAmortUsd: ue.storageAmortizationUsd,
			returnFeeUsd: +returnFeeUsd.toFixed(2),
			paymentFeeUsd,
		};
	}

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

	const latestCtr =
		latestRow.impressions > 0 ? latestRow.clicks / latestRow.impressions : null;
	const latestCpc =
		latestRow.clicks > 0 ? latestRow.adSpendUsd / latestRow.clicks : null;

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

	return (
		<div className="space-y-6">
			<header className="flex justify-between items-start gap-4">
				<div>
					<h2 className="text-2xl font-bold tabular-nums">
						{label}{" "}
						<span className="text-muted-foreground font-normal text-lg">
							({asin.color}) · {asin.code}
						</span>
					</h2>
					<p className="text-muted-foreground text-sm mt-0.5">
						最新数据：{latestRow.date.toISOString().slice(0, 10)} · Day{" "}
						{latestRow.dayNum} · 当前阶段{" "}
						<span className="font-semibold text-foreground">{phase}</span>
					</p>
				</div>
				<AsinSwitcher />
			</header>

			<section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
				<HeroKpi
					label="ACoS 7D"
					value={fmtPct(latest.acos)}
					unit="%"
					delta={deltaAcos}
					deltaInverted
					sparkData={sparkAcos}
					sparkColor="#dc2626"
					status={acosStatus}
					hint={`红线 ${(tacosRedline * 100).toFixed(2)}%`}
				/>
				<HeroKpi
					label="TACoS 7D"
					value={fmtPct(latest.tacos)}
					unit="%"
					delta={deltaTacos}
					deltaInverted
					sparkData={sparkTacos}
					sparkColor="#f97316"
				/>
				<HeroKpi
					label="CVR 7D"
					value={fmtPct(latest.cvr)}
					unit="%"
					delta={deltaCvr}
					sparkData={sparkCvr}
					sparkColor="#16a34a"
					hint={`目标 ${(targetCvr * 100).toFixed(0)}%`}
				/>
				<HeroKpi
					label="ROAS 7D"
					value={fmtNum(latest.roas)}
					delta={deltaRoas}
					sparkData={sparkRoas}
					sparkColor="#2563eb"
				/>
				<HeroKpi label="CTR 当日" value={fmtPct(latestCtr, 2)} unit="%" />
				<HeroKpi
					label="CPC 当日"
					value={latestCpc !== null ? `$${latestCpc.toFixed(2)}` : "—"}
				/>
				<HeroKpi
					label="当日花费"
					value={`$${latestRow.adSpendUsd.toFixed(2)}`}
				/>
				<HeroKpi
					label="当日销售"
					value={`$${latestRow.totalSalesUsd.toFixed(2)}`}
				/>
				<HeroKpi
					label="当日单量"
					value={latestRow.totalOrders.toString()}
					hint={`广告 ${latestRow.adOrders} / 自然 ${latestRow.totalOrders - latestRow.adOrders}`}
				/>
				<HeroKpi
					label="库存可售"
					value={latestRow.inventory?.toString() ?? "—"}
					status={latestRow.inventory === null ? "warning" : "default"}
					hint={latestRow.inventory === null ? "未填" : undefined}
				/>
				<HeroKpi label="累计花费" value={`$${totalSpend.toFixed(0)}`} />
				<HeroKpi
					label="累计销售"
					value={`$${totalSales.toFixed(0)}`}
					hint={`${totalOrders} 单`}
				/>
			</section>

			<div className="grid grid-cols-12 gap-4">
				<section className="col-span-12 lg:col-span-5 rounded-lg border bg-card p-4">
					<h3 className="text-sm font-semibold mb-3">阶段进度</h3>
					<StageTimeline currentDay={latestRow.dayNum} />
				</section>
				<section className="col-span-12 lg:col-span-7 rounded-lg border bg-card p-4">
					<h3 className="text-sm font-semibold mb-3">
						四象限定位（ΔACoS × ΔTACoS）
					</h3>
					<QuadrantScatter points={quadPoints} />
				</section>
			</div>

			<div className="grid grid-cols-12 gap-4">
				<section className="col-span-12 lg:col-span-7 rounded-lg border bg-card p-4">
					<h3 className="text-sm font-semibold mb-3">Rolling 7D 趋势</h3>
					<RollingChart data={chartData} />
				</section>
				<section className="col-span-12 lg:col-span-5 rounded-lg border bg-card p-4">
					<h3 className="text-sm font-semibold mb-3">累计转化漏斗</h3>
					<ConversionFunnel steps={totalConvFunnel} />
				</section>
			</div>

			<div className="grid grid-cols-12 gap-4">
				<section className="col-span-12 lg:col-span-5 rounded-lg border bg-card p-4">
					<h3 className="text-sm font-semibold mb-3">行动建议</h3>
					<ActionPanel insights={insights} />
				</section>
				<section className="col-span-12 lg:col-span-7 rounded-lg border bg-card p-4">
					<h3 className="text-sm font-semibold mb-3">单件经济模型（USD）</h3>
					{economicsProps ? (
						<EconomicsWaterfall {...economicsProps} />
					) : (
						<div className="text-sm text-muted-foreground">
							未同步单件经济模型，请运行{" "}
							<code className="text-xs bg-muted px-1 rounded">pnpm sync</code>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
