import { describe, it, expect } from "vitest";
import { parseParams, parseDailyRecords } from "../../src/lib/etl/excel-parser";
import path from "node:path";

const FIXTURE = path.resolve(__dirname, "../fixtures/sample.xlsx");

describe("parseParams", () => {
	it("extracts price 23.99 USD", () => {
		const params = parseParams(FIXTURE);
		const price = params.find((p) => p.key === "price_usd");
		expect(price?.value).toBe("23.99");
	});
	it("extracts fx rate 6.8", () => {
		const params = parseParams(FIXTURE);
		const fx = params.find((p) => p.key === "fx_rate_cny_per_usd");
		expect(fx?.value).toBe("6.8");
	});
	it("extracts day0 2026-04-09", () => {
		const params = parseParams(FIXTURE);
		const day0 = params.find((p) => p.key === "day0");
		expect(new Date(day0!.value).toISOString().slice(0, 10)).toBe("2026-04-09");
	});
});

describe("parseDailyRecords", () => {
	// NOTE: spec assumed 33 records; the source Excel has been updated and now
	// contains 35 valid date rows (2026-04-09 .. 2026-05-13 inclusive). Test
	// asserts actual fixture count.
	it("returns 35 BLK records starting 2026-04-09", () => {
		const records = parseDailyRecords(FIXTURE, "BLK");
		expect(records.length).toBe(35);
		expect(records[0].date.toISOString().slice(0, 10)).toBe("2026-04-09");
		expect(records[0].totalOrders).toBe(0);
		expect(records[0].impressions).toBe(12);
	});
	it("returns 35 DBL records", () => {
		const records = parseDailyRecords(FIXTURE, "DBL");
		expect(records.length).toBe(35);
	});
});
