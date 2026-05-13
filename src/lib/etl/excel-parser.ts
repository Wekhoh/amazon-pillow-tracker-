import * as XLSX from "xlsx";
import type { ParamInput, DailyRecordInput } from "./types";

const PARAM_KEY_MAP: Record<string, string> = {
	"售价(USD)": "price_usd",
	目标CVR: "target_cvr",
	目标ACoS: "target_acos",
	"TACoS盈亏线（红线）": "tacos_redline",
	"汇率(CNY/USD)": "fx_rate_cny_per_usd",
	"广告启动日期/Day0（第一步先填）": "day0",
};

// Format a Date to "YYYY-MM-DD" using LOCAL components.
// Excel stores Beijing midnight as UTC 16:00 prev day; we want the calendar
// date the author intended (e.g. 2026-04-09), not the UTC date (2026-04-08).
function dateToLocalYmd(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

// Convert an Excel-parsed Date (UTC instant) to a Date pinned at UTC midnight
// of the LOCAL calendar date. This way `.toISOString().slice(0,10)` returns
// the intended Beijing calendar date.
function dateToLocalMidnightUtc(d: Date): Date {
	return new Date(`${dateToLocalYmd(d)}T00:00:00.000Z`);
}

export function parseParams(excelPath: string): ParamInput[] {
	const wb = XLSX.readFile(excelPath, { cellDates: true });
	const ws = wb.Sheets["参数中心"];
	if (!ws) throw new Error("参数中心 sheet not found");

	// Row 1 (idx 0) is a "返回总览" nav row; row 2 (idx 1) is the "参数 | 值 | 说明" header.
	// Data starts at row 3 (idx 2). We pass explicit header keys and `range: 3` which
	// (per SheetJS behavior observed for this file) starts the row stream at the
	// "售价(USD)" data row.
	const rows = XLSX.utils.sheet_to_json<{
		参数?: string;
		值?: unknown;
		说明?: string;
	}>(ws, {
		header: ["参数", "值", "说明"],
		range: 3,
	});

	const params: ParamInput[] = [];
	for (const row of rows) {
		if (!row.参数 || row.值 === undefined || row.值 === null) continue;
		const key = PARAM_KEY_MAP[row.参数];
		if (!key) continue;

		let value: string;
		if (row.值 instanceof Date) {
			// For day0 and similar Date params, serialize the LOCAL calendar date.
			value = dateToLocalYmd(row.值);
		} else {
			value = String(row.值);
		}
		params.push({ key, value, description: row.说明 });
	}
	return params;
}

const DAILY_HEADER_MAP = {
	date: "日期",
	totalOrders: "当日总单",
	unitsOrdered: "Units Ordered",
	adOrders: "广告单",
	adSpendUsd: "广告花费(USD)",
	adSalesUsd: "广告销售额(USD)",
	totalSalesUsd: "总销售额(USD)",
	impressions: "Impressions",
	clicks: "Clicks",
	sessions: "Sessions",
	inventory: "库存可售",
	notes: "当天动作/备注",
};

export function parseDailyRecords(
	excelPath: string,
	asinLabel: "BLK" | "DBL",
): DailyRecordInput[] {
	const wb = XLSX.readFile(excelPath, { cellDates: true });
	const sheetName = `${asinLabel} 日更记录`;
	const ws = wb.Sheets[sheetName];
	if (!ws) throw new Error(`${sheetName} not found`);

	// The header row is at row 4 (idx 3); data starts at row 5 (idx 4).
	// `range: 3` makes SheetJS use row idx 3 as the header row.
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
		range: 3,
	});

	const records: DailyRecordInput[] = [];
	for (const row of rows) {
		const rawDate = row[DAILY_HEADER_MAP.date];
		if (!(rawDate instanceof Date)) continue;
		records.push({
			asinLabel,
			date: dateToLocalMidnightUtc(rawDate),
			totalOrders: intOr0(row[DAILY_HEADER_MAP.totalOrders]),
			unitsOrdered: intOr0(row[DAILY_HEADER_MAP.unitsOrdered]),
			adOrders: intOr0(row[DAILY_HEADER_MAP.adOrders]),
			adSpendUsd: numOr0(row[DAILY_HEADER_MAP.adSpendUsd]),
			adSalesUsd: numOr0(row[DAILY_HEADER_MAP.adSalesUsd]),
			totalSalesUsd: numOr0(row[DAILY_HEADER_MAP.totalSalesUsd]),
			impressions: intOr0(row[DAILY_HEADER_MAP.impressions]),
			clicks: intOr0(row[DAILY_HEADER_MAP.clicks]),
			sessions: intOr0(row[DAILY_HEADER_MAP.sessions]),
			inventory: nullableInt(row[DAILY_HEADER_MAP.inventory]),
			notes: nullableStr(row[DAILY_HEADER_MAP.notes]),
		});
	}
	return records;
}

function numOr0(v: unknown): number {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim()) return Number(v) || 0;
	return 0;
}
function intOr0(v: unknown): number {
	const n = numOr0(v);
	return Math.trunc(n);
}
function nullableInt(v: unknown): number | null {
	if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
	if (typeof v === "string" && v.trim()) {
		const n = Number(v);
		return Number.isFinite(n) ? Math.trunc(n) : null;
	}
	return null;
}
function nullableStr(v: unknown): string | null {
	if (typeof v === "string" && v.trim()) return v;
	return null;
}
