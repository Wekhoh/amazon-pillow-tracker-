export type Phase =
	| "pre-launch"
	| "D0-7"
	| "D8-21"
	| "D22-45"
	| "D46-90"
	| "D91-180";

export function getPhase(dayNum: number): Phase {
	if (dayNum < 0) return "pre-launch";
	if (dayNum <= 7) return "D0-7";
	if (dayNum <= 21) return "D8-21";
	if (dayNum <= 45) return "D22-45";
	if (dayNum <= 90) return "D46-90";
	return "D91-180";
}

export interface DailyMetric {
	date: Date;
	adSpendUsd: number;
	adSalesUsd: number;
	totalSalesUsd: number;
	clicks: number;
	adOrders: number;
	totalOrders: number;
}

export interface Rolling7dResult {
	spend: number;
	adSales: number;
	totalSales: number;
	clicks: number;
	adOrders: number;
	totalOrders: number;
	acos: number | null;
	tacos: number | null;
	cvr: number | null;
	roas: number | null;
}

export function rolling7d(
	records: DailyMetric[],
	index: number,
): Rolling7dResult {
	const start = Math.max(0, index - 6);
	const window = records.slice(start, index + 1);
	const spend = window.reduce((s, r) => s + r.adSpendUsd, 0);
	const adSales = window.reduce((s, r) => s + r.adSalesUsd, 0);
	const totalSales = window.reduce((s, r) => s + r.totalSalesUsd, 0);
	const clicks = window.reduce((s, r) => s + r.clicks, 0);
	const adOrders = window.reduce((s, r) => s + r.adOrders, 0);
	const totalOrders = window.reduce((s, r) => s + r.totalOrders, 0);

	return {
		spend,
		adSales,
		totalSales,
		clicks,
		adOrders,
		totalOrders,
		acos: adSales > 0 ? spend / adSales : null,
		tacos: totalSales > 0 ? spend / totalSales : null,
		cvr: clicks > 0 ? adOrders / clicks : null,
		roas: spend > 0 ? adSales / spend : null,
	};
}

/**
 * Compute % delta of current 7D window vs prior 7D window (shifted -7).
 * Returns null if either window has 0 denominator data, or index too low.
 */
export function delta7d(
	records: DailyMetric[],
	index: number,
	field: keyof Pick<
		Rolling7dResult,
		"acos" | "tacos" | "cvr" | "roas" | "spend" | "adSales" | "totalSales"
	>,
): number | null {
	if (index < 13) return null;
	const curr = rolling7d(records, index);
	const prev = rolling7d(records, index - 7);
	const cv = curr[field];
	const pv = prev[field];
	if (cv === null || pv === null || pv === 0) return null;
	return (cv - pv) / Math.abs(pv);
}

/**
 * Compute sparkline data for a rolling7d metric over the last N records.
 */
export function sparklineData(
	records: DailyMetric[],
	field: keyof Pick<Rolling7dResult, "acos" | "tacos" | "cvr" | "roas">,
	windowDays = 14,
): { i: number; v: number | null }[] {
	const start = Math.max(0, records.length - windowDays);
	const out: { i: number; v: number | null }[] = [];
	for (let i = start; i < records.length; i++) {
		const r = rolling7d(records, i);
		out.push({ i: i - start, v: r[field] });
	}
	return out;
}

/**
 * Funnel metrics summed over a date range.
 * Accepts DailyMetric rows extended with impressions (extracted from DB rows).
 */
export interface FunnelStats {
	impressions: number;
	clicks: number;
	orders: number;
	sales: number;
}

export function aggregateFunnel(
	records: Array<DailyMetric & { impressions?: number }>,
): FunnelStats {
	let impressions = 0;
	let clicks = 0;
	let orders = 0;
	let sales = 0;
	for (const r of records) {
		impressions += r.impressions ?? 0;
		clicks += r.clicks ?? 0;
		orders += r.adOrders ?? 0;
		sales += r.adSalesUsd ?? 0;
	}
	return { impressions, clicks, orders, sales };
}

export type Quadrant =
	| "双改善"
	| "自然增长信号"
	| "降本但承压"
	| "依赖加重"
	| "insufficient_data";

interface QuadrantInput {
	currAcos: number | null;
	prevAcos: number | null;
	currTacos: number | null;
	prevTacos: number | null;
}

export function quadrant({
	currAcos,
	prevAcos,
	currTacos,
	prevTacos,
}: QuadrantInput): Quadrant {
	if (
		currAcos === null ||
		prevAcos === null ||
		currTacos === null ||
		prevTacos === null
	) {
		return "insufficient_data";
	}
	const acosUp = currAcos >= prevAcos;
	const tacosUp = currTacos >= prevTacos;
	if (!acosUp && !tacosUp) return "双改善";
	if (acosUp && !tacosUp) return "自然增长信号";
	if (!acosUp && tacosUp) return "降本但承压";
	return "依赖加重";
}
