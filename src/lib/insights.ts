import type { DailyMetric } from "./calculations";
import { rolling7d } from "./calculations";

export interface Insight {
	severity: "info" | "warning" | "critical";
	title: string;
	detail: string;
	action?: string;
}

export interface InsightInput {
	metrics: DailyMetric[];
	inventoryByIndex: (number | null)[];
	asinLabel: "BLK" | "DBL";
	tacosRedline: number;
	targetCvr: number;
}

export function generateInsights({
	metrics,
	inventoryByIndex,
	asinLabel,
	tacosRedline,
	targetCvr,
}: InsightInput): Insight[] {
	const out: Insight[] = [];
	if (metrics.length === 0) return out;
	const latestIdx = metrics.length - 1;
	const latest = rolling7d(metrics, latestIdx);

	let missing = 0;
	for (
		let i = inventoryByIndex.length - 1;
		i >= 0 && inventoryByIndex[i] === null;
		i--
	) {
		missing++;
	}
	if (missing >= 3) {
		out.push({
			severity: "warning",
			title: `${asinLabel} 库存可售连续 ${missing} 天未填`,
			detail: "Excel 日更记录 AA 列空，库存剩余天数 KPI 将失效",
			action: "在 Excel 日更记录 AA 列补填最新库存量",
		});
	}

	if (latest.acos !== null && latest.acos > tacosRedline * 1.5) {
		out.push({
			severity: "critical",
			title: `${asinLabel} Rolling 7D ACoS ${(latest.acos * 100).toFixed(1)}% 远超红线`,
			detail: `已是红线 ${(tacosRedline * 100).toFixed(2)}% 的 ${(latest.acos / tacosRedline).toFixed(1)} 倍`,
			action: "暂停 ACoS 最高的广告活动，或降低出价",
		});
	} else if (latest.acos !== null && latest.acos > tacosRedline) {
		out.push({
			severity: "warning",
			title: `${asinLabel} Rolling 7D ACoS ${(latest.acos * 100).toFixed(1)}% 超过红线`,
			detail: `当前阶段需考虑收紧投放，红线 ${(tacosRedline * 100).toFixed(2)}%`,
			action: "审查活动级 ACoS，淘汰 high-spend low-CVR 词",
		});
	}

	if (latest.cvr !== null && latest.cvr < targetCvr * 0.7) {
		out.push({
			severity: "critical",
			title: `${asinLabel} Rolling 7D CVR ${(latest.cvr * 100).toFixed(1)}% 低于止损阈值`,
			detail: `目标 CVR ${(targetCvr * 100).toFixed(0)}%，止损系数 0.7 = ${(targetCvr * 0.7 * 100).toFixed(1)}%`,
			action: "检查 Listing 转化要素：主图、价格、Review、A+ 内容",
		});
	}

	if (latest.roas !== null && latest.roas < 1.0) {
		out.push({
			severity: "critical",
			title: `${asinLabel} Rolling 7D ROAS ${latest.roas.toFixed(2)} 低于盈亏线`,
			detail: "广告每花 $1 拿回不足 $1，处于亏损投放",
			action: "立即收紧预算，先解决 ACoS/CVR",
		});
	}

	if (out.length === 0) {
		out.push({
			severity: "info",
			title: `${asinLabel} 关键指标稳定`,
			detail: "未触发任何预警/止损阈值",
		});
	}

	return out;
}
