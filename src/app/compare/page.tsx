import { prisma } from "@/lib/prisma";
import { rolling7d, type DailyMetric } from "@/lib/calculations";
import { CompareChart, type CompareDataPoint } from "./compare-chart";

export const dynamic = "force-dynamic";

async function getMetricsForAsin(label: "BLK" | "DBL") {
	const asin = await prisma.asin.findUnique({ where: { label } });
	if (!asin) return [];
	const records = await prisma.dailyRecord.findMany({
		where: { asinId: asin.id },
		orderBy: { date: "asc" },
	});
	const metrics: DailyMetric[] = records.map((r) => ({
		date: r.date,
		adSpendUsd: r.adSpendUsd,
		adSalesUsd: r.adSalesUsd,
		totalSalesUsd: r.totalSalesUsd,
		clicks: r.clicks,
		adOrders: r.adOrders,
		totalOrders: r.totalOrders,
	}));
	return metrics.map((_, i) => {
		const r = rolling7d(metrics, i);
		return {
			date: metrics[i].date.toISOString().slice(5, 10),
			acos: r.acos,
			tacos: r.tacos,
			cvr: r.cvr,
		};
	});
}

export default async function ComparePage() {
	const [blk, dbl] = await Promise.all([
		getMetricsForAsin("BLK"),
		getMetricsForAsin("DBL"),
	]);

	const merged: CompareDataPoint[] = blk.map((b, i) => ({
		date: b.date,
		blk_acos: b.acos,
		blk_tacos: b.tacos,
		blk_cvr: b.cvr,
		dbl_acos: dbl[i]?.acos ?? null,
		dbl_tacos: dbl[i]?.tacos ?? null,
		dbl_cvr: dbl[i]?.cvr ?? null,
	}));

	const metrics: Array<{ key: "acos" | "tacos" | "cvr"; title: string }> = [
		{ key: "acos", title: "Rolling 7D ACoS" },
		{ key: "tacos", title: "Rolling 7D TACoS" },
		{ key: "cvr", title: "Rolling 7D CVR" },
	];

	return (
		<div className="space-y-8">
			<header>
				<h2 className="text-2xl font-bold">BLK vs DBL 对比</h2>
				<p className="text-muted-foreground text-sm">
					双 ASIN 关键指标同图叠加
				</p>
			</header>

			{merged.length === 0 ? (
				<div>
					<h3 className="text-lg font-semibold mb-2">还没有数据</h3>
					<p>
						请运行{" "}
						<code className="px-1 py-0.5 bg-muted rounded">pnpm sync</code> 从
						Excel 同步
					</p>
				</div>
			) : (
				metrics.map(({ key, title }) => (
					<section key={key}>
						<h3 className="text-lg font-semibold mb-3">{title}</h3>
						<CompareChart data={merged} metric={key} />
					</section>
				))
			)}
		</div>
	);
}
