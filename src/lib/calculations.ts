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
