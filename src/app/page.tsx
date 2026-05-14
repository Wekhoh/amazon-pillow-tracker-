import { prisma } from "@/lib/prisma";
import { rolling7d, getPhase, type DailyMetric } from "@/lib/calculations";
import { AsinSwitcher } from "@/components/asin-switcher";
import { KpiCard } from "@/components/kpi-card";
import { StageProgress } from "@/components/stage-progress";
import { RollingChart } from "@/components/rolling-chart";

export const dynamic = "force-dynamic";

interface PageProps {
	searchParams: Promise<{ asin?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
	const params = await searchParams;
	const label = (params.asin === "DBL" ? "DBL" : "BLK") as "BLK" | "DBL";

	const asin = await prisma.asin.findUnique({ where: { label } });
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

	return (
		<div className="space-y-6">
			<header className="flex justify-between items-start">
				<div>
					<h2 className="text-2xl font-bold">
						{label} ({asin.color}) — {asin.code}
					</h2>
					<p className="text-muted-foreground text-sm">
						最新数据日期：{latestRow.date.toISOString().slice(0, 10)} · Day{" "}
						{latestRow.dayNum}
					</p>
				</div>
				<AsinSwitcher />
			</header>

			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
				<KpiCard label="当前阶段" value={phase} />
				<KpiCard
					label="Rolling 7D ACoS"
					value={latest.acos !== null ? (latest.acos * 100).toFixed(1) : null}
					unit="%"
					numericValue={latest.acos}
					warningThreshold={{ value: 0.3234, comparator: "gt" }}
					hint="红线 32.34%"
				/>
				<KpiCard
					label="Rolling 7D TACoS"
					value={latest.tacos !== null ? (latest.tacos * 100).toFixed(1) : null}
					unit="%"
					numericValue={latest.tacos}
					warningThreshold={{ value: 0.3234, comparator: "gt" }}
				/>
				<KpiCard
					label="Rolling 7D CVR"
					value={latest.cvr !== null ? (latest.cvr * 100).toFixed(1) : null}
					unit="%"
				/>
				<KpiCard
					label="Rolling 7D ROAS"
					value={latest.roas !== null ? latest.roas.toFixed(2) : null}
				/>
				<KpiCard label="累计花费" value={`$${totalSpend.toFixed(2)}`} />
			</div>

			<section>
				<h3 className="text-lg font-semibold mb-3">阶段进度</h3>
				<StageProgress currentDay={latestRow.dayNum} />
			</section>

			<section>
				<h3 className="text-lg font-semibold mb-3">Rolling 7D 趋势</h3>
				<RollingChart data={chartData} />
			</section>

			<section>
				<h3 className="text-lg font-semibold mb-3">最新状态</h3>
				<div className="text-sm space-y-1">
					<div>
						库存可售：
						{latestRow.inventory ?? (
							<span className="text-orange-600">未填</span>
						)}
					</div>
					<div>
						当日总单：{latestRow.totalOrders} · 广告单：{latestRow.adOrders} ·
						自然单：{latestRow.totalOrders - latestRow.adOrders}
					</div>
					<div>
						当日花费：${latestRow.adSpendUsd.toFixed(2)} · 当日销售：$
						{latestRow.totalSalesUsd.toFixed(2)}
					</div>
					{latestRow.notes && (
						<div className="text-muted-foreground">备注：{latestRow.notes}</div>
					)}
				</div>
			</section>
		</div>
	);
}
