import { describe, it, expect } from "vitest";
import {
	getPhase,
	rolling7d,
	quadrant,
	type DailyMetric,
} from "../src/lib/calculations";

describe("getPhase", () => {
	it("returns D0-7 for days 0-7", () => {
		expect(getPhase(0)).toBe("D0-7");
		expect(getPhase(7)).toBe("D0-7");
	});
	it("returns D8-21 for days 8-21", () => {
		expect(getPhase(8)).toBe("D8-21");
		expect(getPhase(21)).toBe("D8-21");
	});
	it("returns D22-45 for days 22-45", () => {
		expect(getPhase(22)).toBe("D22-45");
		expect(getPhase(33)).toBe("D22-45");
		expect(getPhase(45)).toBe("D22-45");
	});
	it("returns D46-90 for days 46-90", () => {
		expect(getPhase(46)).toBe("D46-90");
		expect(getPhase(90)).toBe("D46-90");
	});
	it("returns D91-180 for days 91+", () => {
		expect(getPhase(91)).toBe("D91-180");
		expect(getPhase(200)).toBe("D91-180");
	});
	it("handles negative days as pre-launch", () => {
		expect(getPhase(-1)).toBe("pre-launch");
	});
});

describe("rolling7d", () => {
	const sample: DailyMetric[] = [
		{
			date: new Date("2026-04-09"),
			adSpendUsd: 0,
			adSalesUsd: 0,
			totalSalesUsd: 0,
			clicks: 0,
			adOrders: 0,
			totalOrders: 0,
		},
		{
			date: new Date("2026-04-10"),
			adSpendUsd: 0.55,
			adSalesUsd: 0,
			totalSalesUsd: 0,
			clicks: 1,
			adOrders: 0,
			totalOrders: 0,
		},
		{
			date: new Date("2026-04-11"),
			adSpendUsd: 10,
			adSalesUsd: 24,
			totalSalesUsd: 50,
			clicks: 5,
			adOrders: 1,
			totalOrders: 2,
		},
		{
			date: new Date("2026-04-12"),
			adSpendUsd: 20,
			adSalesUsd: 48,
			totalSalesUsd: 100,
			clicks: 10,
			adOrders: 2,
			totalOrders: 4,
		},
	];

	it("for first row, returns single-row metric", () => {
		const result = rolling7d(sample, 0);
		expect(result.spend).toBe(0);
		expect(result.acos).toBeNull();
	});

	it("for day 4 (index 3), sums all 4 days since under 7", () => {
		const result = rolling7d(sample, 3);
		expect(result.spend).toBeCloseTo(30.55);
		expect(result.adSales).toBe(72);
		expect(result.totalSales).toBe(150);
		expect(result.acos).toBeCloseTo(30.55 / 72);
		expect(result.tacos).toBeCloseTo(30.55 / 150);
		expect(result.clicks).toBe(16);
		expect(result.cvr).toBeCloseTo(3 / 16);
	});

	it("returns null for ratios when denominator is 0", () => {
		const result = rolling7d(sample, 1);
		expect(result.acos).toBeNull();
		expect(result.tacos).toBeNull();
	});
});

describe("quadrant", () => {
	it("returns 双改善 when both ACoS and TACoS drop", () => {
		expect(
			quadrant({
				currAcos: 0.3,
				prevAcos: 0.35,
				currTacos: 0.15,
				prevTacos: 0.18,
			}),
		).toBe("双改善");
	});
	it("returns 自然增长信号 when ACoS rises but TACoS drops", () => {
		expect(
			quadrant({
				currAcos: 0.4,
				prevAcos: 0.35,
				currTacos: 0.15,
				prevTacos: 0.18,
			}),
		).toBe("自然增长信号");
	});
	it("returns 降本但承压 when ACoS drops but TACoS rises", () => {
		expect(
			quadrant({
				currAcos: 0.3,
				prevAcos: 0.35,
				currTacos: 0.22,
				prevTacos: 0.18,
			}),
		).toBe("降本但承压");
	});
	it("returns 依赖加重 when both rise", () => {
		expect(
			quadrant({
				currAcos: 0.4,
				prevAcos: 0.35,
				currTacos: 0.22,
				prevTacos: 0.18,
			}),
		).toBe("依赖加重");
	});
	it("returns insufficient_data when any input is null", () => {
		expect(
			quadrant({
				currAcos: null,
				prevAcos: 0.35,
				currTacos: 0.15,
				prevTacos: 0.18,
			}),
		).toBe("insufficient_data");
	});
});
