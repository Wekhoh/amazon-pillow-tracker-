import { describe, it, expect } from "vitest";
import {
	getPhase,
	rolling7d,
	quadrant,
	delta7d,
	sparklineData,
	aggregateFunnel,
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

// Build a 16-row synthetic series for delta7d / sparkline tests.
// Days 0-6: spend rises 1->7 USD, adSales rises 2->14 (ACoS = 50%).
// Days 7-13: spend rises 8->14 USD, adSales rises 24->48 (ACoS ~ 30%).
// Days 14-15: spend stays 15-16 USD, adSales 50-52 (ACoS slightly lower).
const longSample: DailyMetric[] = Array.from({ length: 16 }, (_, i) => {
	const day = i + 1;
	let spend: number;
	let adSales: number;
	if (i <= 6) {
		spend = day;
		adSales = day * 2;
	} else if (i <= 13) {
		spend = day;
		adSales = day * 3;
	} else {
		spend = day;
		adSales = day * 3.4;
	}
	return {
		date: new Date(2026, 3, 9 + i),
		adSpendUsd: spend,
		adSalesUsd: adSales,
		totalSalesUsd: adSales * 2,
		clicks: 10,
		adOrders: 1,
		totalOrders: 2,
	};
});

describe("delta7d", () => {
	it("returns null when index < 13 (insufficient prior window)", () => {
		expect(delta7d(longSample, 0, "acos")).toBeNull();
		expect(delta7d(longSample, 12, "acos")).toBeNull();
	});

	it("returns a negative delta when ACoS improved (decreased) vs 7 days ago", () => {
		// At index 14: current 7d window (days 8-14) has lower ACoS than prior
		// 7d window (days 1-7) which was at 50% ACoS.
		const d = delta7d(longSample, 14, "acos");
		expect(d).not.toBeNull();
		expect(d!).toBeLessThan(0);
	});

	it("returns a positive delta when spend increased vs 7 days ago", () => {
		const d = delta7d(longSample, 14, "spend");
		expect(d).not.toBeNull();
		expect(d!).toBeGreaterThan(0);
	});
});

describe("sparklineData", () => {
	it("trims to windowDays for series longer than windowDays", () => {
		const out = sparklineData(longSample, "acos", 7);
		expect(out.length).toBe(7);
		expect(out[0].i).toBe(0);
		expect(out[6].i).toBe(6);
	});

	it("returns the whole series when windowDays exceeds length", () => {
		const out = sparklineData(longSample.slice(0, 5), "acos", 14);
		expect(out.length).toBe(5);
	});
});

describe("aggregateFunnel", () => {
	it("sums impressions, clicks, adOrders, adSalesUsd across records", () => {
		const extended = longSample.slice(0, 3).map((r, i) => ({
			...r,
			impressions: 100 * (i + 1),
		}));
		const f = aggregateFunnel(extended);
		expect(f.impressions).toBe(600); // 100 + 200 + 300
		expect(f.clicks).toBe(30);
		expect(f.orders).toBe(3);
		expect(f.sales).toBeCloseTo(2 + 4 + 6); // adSalesUsd 2,4,6
	});

	it("treats missing impressions as 0", () => {
		const f = aggregateFunnel(longSample.slice(0, 2));
		expect(f.impressions).toBe(0);
	});
});
