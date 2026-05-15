import { prisma } from "../src/lib/prisma";
import {
	parseParams,
	parseDailyRecords,
	parseUnitEconomics,
	parseKeywords,
	parsePlacements,
} from "../src/lib/etl/excel-parser";
import { differenceInDays } from "date-fns";
import dotenv from "dotenv";

dotenv.config();

const EXCEL_PATH = process.env.EXCEL_SOURCE_PATH;
if (!EXCEL_PATH) {
	console.error("EXCEL_SOURCE_PATH not set in .env");
	process.exit(1);
}

async function syncParams() {
	const params = parseParams(EXCEL_PATH!);
	for (const p of params) {
		await prisma.param.upsert({
			where: { key: p.key },
			update: { value: p.value, description: p.description ?? null },
			create: {
				key: p.key,
				value: p.value,
				description: p.description ?? null,
			},
		});
	}
	console.log(`Synced ${params.length} parameters`);
	return params;
}

async function syncDailyRecords(params: { key: string; value: string }[]) {
	const day0Raw = params.find((p) => p.key === "day0")?.value;
	if (!day0Raw) throw new Error("day0 param missing from Excel");
	const day0 = new Date(day0Raw);

	for (const label of ["BLK", "DBL"] as const) {
		const asin = await prisma.asin.findUnique({ where: { label } });
		if (!asin)
			throw new Error(
				`${label} ASIN not seeded — run pnpm prisma db seed first`,
			);

		const records = parseDailyRecords(EXCEL_PATH!, label);
		for (const r of records) {
			const dayNum = differenceInDays(r.date, day0);
			const data = {
				dayNum,
				totalOrders: r.totalOrders,
				unitsOrdered: r.unitsOrdered,
				adOrders: r.adOrders,
				adSpendUsd: r.adSpendUsd,
				adSalesUsd: r.adSalesUsd,
				totalSalesUsd: r.totalSalesUsd,
				impressions: r.impressions,
				clicks: r.clicks,
				sessions: r.sessions,
				inventory: r.inventory,
				notes: r.notes,
			};
			await prisma.dailyRecord.upsert({
				where: { asinId_date: { asinId: asin.id, date: r.date } },
				update: data,
				create: { asinId: asin.id, date: r.date, ...data },
			});
		}
		console.log(`Synced ${records.length} ${label} daily records`);
	}
}

async function syncUnitEconomics() {
	for (const label of ["BLK", "DBL"] as const) {
		const asin = await prisma.asin.findUnique({ where: { label } });
		if (!asin) continue;
		const ue = parseUnitEconomics(EXCEL_PATH!, label);
		const { asinLabel: _omit, ...ueData } = ue;
		await prisma.unitEconomics.upsert({
			where: { asinId: asin.id },
			update: { ...ueData },
			create: { asinId: asin.id, ...ueData },
		});
	}
	console.log("Synced unit economics for BLK and DBL");
}

async function syncKeywords() {
	for (const label of ["BLK", "DBL"] as const) {
		const asin = await prisma.asin.findUnique({ where: { label } });
		if (!asin) continue;
		const rows = parseKeywords(EXCEL_PATH!, label);
		for (const r of rows) {
			const data = {
				matchType: r.matchType,
				impressions: r.impressions,
				clicks: r.clicks,
				orders: r.orders,
				spendUsd: r.spendUsd,
				salesUsd: r.salesUsd,
				baseBidUsd: r.baseBidUsd,
				source: r.source,
				negationStatus: r.negationStatus,
				campaignType: r.campaignType,
				monthlySearchVolume: r.monthlySearchVolume,
				abaWeeklyRank: r.abaWeeklyRank,
				notes: r.notes,
			};
			await prisma.keyword.upsert({
				where: {
					asinId_date_keyword_campaignName: {
						asinId: asin.id,
						date: r.date,
						keyword: r.keyword,
						campaignName: r.campaignName,
					},
				},
				update: data,
				create: {
					asinId: asin.id,
					date: r.date,
					keyword: r.keyword,
					campaignName: r.campaignName,
					...data,
				},
			});
		}
		console.log(`Synced ${rows.length} ${label} keyword rows`);
	}
}

async function syncPlacements() {
	for (const label of ["BLK", "DBL"] as const) {
		const asin = await prisma.asin.findUnique({ where: { label } });
		if (!asin) continue;
		const rows = parsePlacements(EXCEL_PATH!, label);
		for (const r of rows) {
			const data = {
				placementType: r.placementType,
				biddingStrategy: r.biddingStrategy,
				portfolioName: r.portfolioName,
				impressions: r.impressions,
				clicks: r.clicks,
				orders: r.orders,
				units: r.units,
				spendUsd: r.spendUsd,
				salesUsd: r.salesUsd,
				cpcUsd: r.cpcUsd,
				dailyCloseStatus: r.dailyCloseStatus,
				notes: r.notes,
			};
			await prisma.placement.upsert({
				where: {
					asinId_date_campaignName_placement: {
						asinId: asin.id,
						date: r.date,
						campaignName: r.campaignName,
						placement: r.placement,
					},
				},
				update: data,
				create: {
					asinId: asin.id,
					date: r.date,
					campaignName: r.campaignName,
					placement: r.placement,
					...data,
				},
			});
		}
		console.log(`Synced ${rows.length} ${label} placement rows`);
	}
}

async function main() {
	console.log(`Reading: ${EXCEL_PATH}`);
	const params = await syncParams();
	await syncDailyRecords(params);
	await syncUnitEconomics();
	await syncKeywords();
	await syncPlacements();
	console.log("Sync complete");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
