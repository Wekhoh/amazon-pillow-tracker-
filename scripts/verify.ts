import { prisma } from "../src/lib/prisma";
import { rolling7d, type DailyMetric } from "../src/lib/calculations";
import dotenv from "dotenv";

dotenv.config();

async function verifyAsin(label: "BLK" | "DBL") {
	const asin = await prisma.asin.findUnique({ where: { label } });
	if (!asin) throw new Error(`${label} not found`);

	const records = await prisma.dailyRecord.findMany({
		where: { asinId: asin.id },
		orderBy: { date: "asc" },
	});

	if (records.length === 0) {
		console.log(`${label}: No records — run pnpm sync first`);
		return;
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
	const r = records[latestIdx];

	const fmt = (n: number | null, pct = false, digits = 2) =>
		n === null
			? "N/A"
			: pct
				? `${(n * 100).toFixed(digits)}%`
				: n.toFixed(digits);

	console.log(
		`\n${label} 最新行 (${r.date.toISOString().slice(0, 10)}, Day ${r.dayNum}):`,
	);
	console.log(`  当日总单:        ${r.totalOrders}`);
	console.log(`  广告花费:        $${r.adSpendUsd.toFixed(2)}`);
	console.log(`  广告销售:        $${r.adSalesUsd.toFixed(2)}`);
	console.log(`  总销售:          $${r.totalSalesUsd.toFixed(2)}`);
	console.log(`  库存可售:        ${r.inventory ?? "未填"}`);
	console.log(`  Rolling 7D ACoS:  ${fmt(latest.acos, true)}`);
	console.log(`  Rolling 7D TACoS: ${fmt(latest.tacos, true)}`);
	console.log(`  Rolling 7D CVR:   ${fmt(latest.cvr, true)}`);
	console.log(`  Rolling 7D ROAS:  ${fmt(latest.roas)}`);
}

async function main() {
	await verifyAsin("BLK");
	await verifyAsin("DBL");
	console.log("\n请将以上结果与 Excel 00 总览 B26-C32 单元格对比（容差 0.1%）");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
