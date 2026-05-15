export const MAX_TABLE_ROWS = 200;

export function fmtMoney(v: number): string {
	const abs = Math.abs(v);
	const sign = v < 0 ? "-" : "";
	if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
	return `${sign}$${abs.toFixed(2)}`;
}

export function fmtPct(v: number | null, digits = 1): string {
	if (v === null) return "—";
	return `${(v * 100).toFixed(digits)}%`;
}

export function buildHref(
	base: string,
	current: Record<string, string | undefined>,
	overrides: Record<string, string | null>,
): string {
	const sp = new URLSearchParams();
	for (const [k, v] of Object.entries(current)) {
		if (v !== undefined) sp.set(k, v);
	}
	for (const [k, v] of Object.entries(overrides)) {
		if (v === null) sp.delete(k);
		else sp.set(k, v);
	}
	const s = sp.toString();
	return s ? `${base}?${s}` : base;
}
