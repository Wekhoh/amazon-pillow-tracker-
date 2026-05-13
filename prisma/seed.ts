import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL ?? "file:./data/tracker.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
	await prisma.asin.upsert({
		where: { code: "B0FCSM9THX" },
		update: {},
		create: {
			code: "B0FCSM9THX",
			label: "BLK",
			color: "Black",
			sku: "ZP-TP01-BLK-LOT01",
		},
	});
	await prisma.asin.upsert({
		where: { code: "B0FCS6HX7H" },
		update: {},
		create: {
			code: "B0FCS6HX7H",
			label: "DBL",
			color: "Dark Blue",
			sku: "ZP-TP01-DBL-LOT01",
		},
	});

	const phases = [
		{ name: "D0-7", startDay: 0, endDay: 7 },
		{ name: "D8-21", startDay: 8, endDay: 21 },
		{ name: "D22-45", startDay: 22, endDay: 45 },
		{ name: "D46-90", startDay: 46, endDay: 90 },
		{ name: "D91-180", startDay: 91, endDay: 180 },
	];
	for (const p of phases) {
		await prisma.phase.upsert({
			where: { name: p.name },
			update: {},
			create: p,
		});
	}

	console.log("Seeded 2 ASINs and 5 phases");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
