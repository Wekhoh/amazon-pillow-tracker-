import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Num } from "@/components/num";
import { Badge } from "@/components/ui/badge";
import { AsinSwitcher } from "@/components/asin-switcher";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import { MAX_TABLE_ROWS, fmtMoney, fmtPct, buildHref } from "@/lib/format";

export const dynamic = "force-dynamic";

type KeywordAgg = {
	keyword: string;
	campaignName: string;
	matchType: string | null;
	impressions: number;
	clicks: number;
	orders: number;
	spendUsd: number;
	salesUsd: number;
	acos: number | null;
	cvr: number | null;
	ctr: number | null;
	roas: number | null;
	baseBidUsd: number | null;
	source: string | null;
	negationStatus: string | null;
	monthlySearchVolume: number | null;
};

async function getAggregatedKeywords(
	label: "BLK" | "DBL",
	tacosRedline: number,
	targetCvr: number,
): Promise<{
	rows: KeywordAgg[];
	totals: {
		keywords: number;
		activeKeywords: number;
		overRedline: number;
		withSales: number;
		burningNoSales: number;
		underTarget: number;
	};
}> {
	const asin = await prisma.asin.findUnique({ where: { label } });
	if (!asin) {
		return {
			rows: [],
			totals: {
				keywords: 0,
				activeKeywords: 0,
				overRedline: 0,
				withSales: 0,
				burningNoSales: 0,
				underTarget: 0,
			},
		};
	}
	const rows = await prisma.keyword.findMany({
		where: { asinId: asin.id },
		orderBy: { date: "desc" },
	});

	const grouped = new Map<string, KeywordAgg>();
	for (const r of rows) {
		const key = `${r.keyword}||${r.campaignName}`;
		const agg = grouped.get(key);
		if (agg) {
			agg.impressions += r.impressions;
			agg.clicks += r.clicks;
			agg.orders += r.orders;
			agg.spendUsd += r.spendUsd;
			agg.salesUsd += r.salesUsd;
		} else {
			grouped.set(key, {
				keyword: r.keyword,
				campaignName: r.campaignName,
				matchType: r.matchType,
				impressions: r.impressions,
				clicks: r.clicks,
				orders: r.orders,
				spendUsd: r.spendUsd,
				salesUsd: r.salesUsd,
				acos: null,
				cvr: null,
				ctr: null,
				roas: null,
				baseBidUsd: r.baseBidUsd,
				source: r.source,
				negationStatus: r.negationStatus,
				monthlySearchVolume: r.monthlySearchVolume,
			});
		}
	}
	const out = [...grouped.values()].map((agg) => {
		agg.acos = agg.salesUsd > 0 ? agg.spendUsd / agg.salesUsd : null;
		agg.cvr = agg.clicks > 0 ? agg.orders / agg.clicks : null;
		agg.ctr = agg.impressions > 0 ? agg.clicks / agg.impressions : null;
		agg.roas = agg.spendUsd > 0 ? agg.salesUsd / agg.spendUsd : null;
		return agg;
	});
	out.sort((a, b) => b.spendUsd - a.spendUsd);

	const totals = {
		keywords: out.length,
		activeKeywords: out.filter((k) => k.impressions > 0).length,
		withSales: out.filter((k) => k.salesUsd > 0).length,
		overRedline: out.filter((k) => k.acos !== null && k.acos > tacosRedline)
			.length,
		burningNoSales: out.filter((k) => k.spendUsd > 0 && k.salesUsd === 0)
			.length,
		underTarget: out.filter(
			(k) => k.clicks >= 10 && k.cvr !== null && k.cvr < targetCvr,
		).length,
	};
	return { rows: out, totals };
}

type SortKey =
	| "keyword"
	| "spend"
	| "sales"
	| "impressions"
	| "clicks"
	| "orders"
	| "acos"
	| "cvr"
	| "ctr"
	| "roas";

const SORT_GETTERS: Record<SortKey, (r: KeywordAgg) => number | string> = {
	keyword: (r) => r.keyword,
	spend: (r) => r.spendUsd,
	sales: (r) => r.salesUsd,
	impressions: (r) => r.impressions,
	clicks: (r) => r.clicks,
	orders: (r) => r.orders,
	acos: (r) => r.acos ?? -Infinity,
	cvr: (r) => r.cvr ?? -Infinity,
	ctr: (r) => r.ctr ?? -Infinity,
	roas: (r) => r.roas ?? -Infinity,
};

interface PageProps {
	searchParams: Promise<{ asin?: string; sort?: string; filter?: string }>;
}

export default async function KeywordsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const label = (params.asin === "DBL" ? "DBL" : "BLK") as "BLK" | "DBL";
	const VALID_SORT_KEYS = Object.keys(SORT_GETTERS) as SortKey[];
	const sortKey: SortKey = VALID_SORT_KEYS.includes(params.sort as SortKey)
		? (params.sort as SortKey)
		: "spend";
	const filter = params.filter ?? "all";

	const [redlineParam, targetCvrParam] = await Promise.all([
		prisma.param.findUnique({ where: { key: "tacos_redline" } }),
		prisma.param.findUnique({ where: { key: "target_cvr" } }),
	]);
	const tacosRedline = redlineParam ? Number(redlineParam.value) : 0.3234;
	const targetCvr = targetCvrParam ? Number(targetCvrParam.value) : 0.11;

	const { rows, totals } = await getAggregatedKeywords(
		label,
		tacosRedline,
		targetCvr,
	);

	const filtered = (() => {
		if (filter === "overRedline")
			return rows.filter((r) => r.acos !== null && r.acos > tacosRedline);
		if (filter === "burningNoSales")
			return rows.filter((r) => r.spendUsd > 0 && r.salesUsd === 0);
		if (filter === "underTarget")
			return rows.filter(
				(r) => r.clicks >= 10 && r.cvr !== null && r.cvr < targetCvr,
			);
		if (filter === "withSales") return rows.filter((r) => r.salesUsd > 0);
		return rows;
	})();

	const getter = SORT_GETTERS[sortKey];
	const sorted = [...filtered].sort((a, b) => {
		const av = getter(a);
		const bv = getter(b);
		if (typeof av === "string") return String(av).localeCompare(String(bv));
		return (bv as number) - (av as number);
	});

	const SortHeader = ({
		col,
		children,
		align = "right",
	}: {
		col: SortKey;
		children: React.ReactNode;
		align?: "left" | "right";
	}) => {
		const active = sortKey === col;
		return (
			<th
				className={cn(
					"font-medium py-2 text-muted-foreground",
					align === "right" ? "text-right" : "text-left",
				)}
			>
				<Link
					href={buildHref("/keywords", { asin: label, filter }, { sort: col })}
					className={cn(
						"inline-flex items-center gap-1 hover:text-foreground transition-colors",
						active && "text-foreground",
					)}
				>
					{children}
					{active && <ArrowDown className="size-3" />}
				</Link>
			</th>
		);
	};

	const FilterChip = ({
		value,
		label: chipLabel,
		count,
		tone = "default",
	}: {
		value: string;
		label: string;
		count: number;
		tone?: "default" | "warning" | "critical";
	}) => {
		const active = filter === value || (value === "all" && filter === "all");
		return (
			<Link
				href={buildHref(
					"/keywords",
					{ asin: label, sort: sortKey },
					{ filter: value === "all" ? null : value },
				)}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
					active
						? "bg-foreground text-background border-foreground"
						: "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground",
				)}
			>
				<span>{chipLabel}</span>
				<span
					className={cn(
						"font-mono tabular-nums px-1.5 py-0.5 rounded text-[10px]",
						active
							? "bg-background/20"
							: tone === "critical"
								? "bg-red-500/15 text-red-500"
								: tone === "warning"
									? "bg-amber-500/15 text-amber-500"
									: "bg-muted",
					)}
				>
					{count}
				</span>
			</Link>
		);
	};

	return (
		<div className="max-w-screen-2xl space-y-6">
			<header className="flex justify-between items-start gap-4">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">关键词台账</h2>
					<p className="text-muted-foreground text-sm mt-1">
						{label} · {totals.keywords} 个关键词 · 按{" "}
						<span className="font-mono">{sortKey}</span> 排序
						{filter !== "all" && (
							<>
								{" "}
								· 筛选 <span className="font-mono">{filter}</span>
							</>
						)}
					</p>
				</div>
				<AsinSwitcher />
			</header>

			<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader>
						<CardDescription>关键词总数</CardDescription>
						<CardTitle className="text-2xl font-bold">
							<Num>{totals.keywords.toLocaleString()}</Num>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							{totals.activeKeywords} 有曝光 · {totals.withSales} 有销售
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>
							超红线 (ACoS &gt; {(tacosRedline * 100).toFixed(1)}%)
						</CardDescription>
						<CardTitle className="text-2xl font-bold text-red-500">
							<Num>{totals.overRedline.toLocaleString()}</Num>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							占有销售的{" "}
							{totals.withSales > 0
								? ((totals.overRedline / totals.withSales) * 100).toFixed(0)
								: "—"}
							%
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>只烧钱无转化</CardDescription>
						<CardTitle className="text-2xl font-bold text-orange-500">
							<Num>{totals.burningNoSales.toLocaleString()}</Num>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							有花费但无销售 — negate 候选
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>
							CVR &lt; {(targetCvr * 100).toFixed(0)}% (目标)
						</CardDescription>
						<CardTitle className="text-2xl font-bold text-amber-500">
							<Num>{totals.underTarget.toLocaleString()}</Num>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">
							≥10 次点击但 CVR 低于目标
						</p>
					</CardContent>
				</Card>
			</section>

			<div className="flex flex-wrap gap-2">
				<FilterChip value="all" label="全部" count={totals.keywords} />
				<FilterChip
					value="overRedline"
					label="超红线"
					count={totals.overRedline}
					tone="critical"
				/>
				<FilterChip
					value="burningNoSales"
					label="只烧钱无转化"
					count={totals.burningNoSales}
					tone="warning"
				/>
				<FilterChip
					value="underTarget"
					label="CVR 低于目标"
					count={totals.underTarget}
					tone="warning"
				/>
				<FilterChip value="withSales" label="有销售" count={totals.withSales} />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>关键词明细 ({sorted.length} 条)</CardTitle>
					<CardDescription>
						点击列头切换排序 · 红色 = ACoS 超红线 · 橙色 = 只烧钱 · 黄色 = CVR
						偏低
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<SortHeader col="keyword" align="left">
										关键词
									</SortHeader>
									<th className="font-medium py-2 text-muted-foreground text-left">
										活动 / 匹配
									</th>
									<SortHeader col="spend">花费</SortHeader>
									<SortHeader col="sales">销售</SortHeader>
									<SortHeader col="acos">ACoS</SortHeader>
									<SortHeader col="roas">ROAS</SortHeader>
									<SortHeader col="impressions">曝光</SortHeader>
									<SortHeader col="clicks">点击</SortHeader>
									<SortHeader col="ctr">CTR</SortHeader>
									<SortHeader col="orders">订单</SortHeader>
									<SortHeader col="cvr">CVR</SortHeader>
								</tr>
							</thead>
							<tbody className="divide-y">
								{sorted.length === 0 && (
									<tr>
										<td
											colSpan={11}
											className="py-8 text-center text-muted-foreground"
										>
											无匹配数据
										</td>
									</tr>
								)}
								{sorted.slice(0, MAX_TABLE_ROWS).map((r, idx) => {
									const overRedline = r.acos !== null && r.acos > tacosRedline;
									const burning = r.spendUsd > 0 && r.salesUsd === 0;
									const lowCvr =
										r.clicks >= 10 && r.cvr !== null && r.cvr < targetCvr;
									return (
										<tr
											key={`${r.keyword}||${r.campaignName}||${idx}`}
											className="hover:bg-muted/30"
										>
											<td className="py-2 pr-2 max-w-[200px]">
												<div
													className="font-medium leading-tight truncate"
													title={r.keyword}
												>
													{r.keyword}
												</div>
												{r.source && (
													<div className="text-[10px] text-muted-foreground">
														{r.source}
													</div>
												)}
											</td>
											<td className="py-2 pr-2 max-w-[180px]">
												<div
													className="text-xs truncate text-muted-foreground"
													title={r.campaignName}
												>
													{r.campaignName || "—"}
												</div>
												{r.matchType && (
													<Badge
														variant="outline"
														className="mt-0.5 text-[10px] px-1 py-0 font-normal"
													>
														{r.matchType}
													</Badge>
												)}
											</td>
											<td className="py-2 text-right font-mono tabular-nums">
												{r.spendUsd > 0 ? fmtMoney(r.spendUsd) : "—"}
											</td>
											<td
												className={cn(
													"py-2 text-right font-mono tabular-nums",
													r.salesUsd > 0
														? "text-emerald-500"
														: burning
															? "text-orange-500"
															: "",
												)}
											>
												{r.salesUsd > 0 ? fmtMoney(r.salesUsd) : "—"}
											</td>
											<td
												className={cn(
													"py-2 text-right font-mono tabular-nums",
													overRedline && "text-red-500 font-semibold",
												)}
											>
												{fmtPct(r.acos)}
											</td>
											<td className="py-2 text-right font-mono tabular-nums">
												{r.roas !== null ? r.roas.toFixed(2) : "—"}
											</td>
											<td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
												{r.impressions.toLocaleString()}
											</td>
											<td className="py-2 text-right font-mono tabular-nums">
												{r.clicks.toLocaleString()}
											</td>
											<td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
												{fmtPct(r.ctr, 2)}
											</td>
											<td className="py-2 text-right font-mono tabular-nums">
												{r.orders}
											</td>
											<td
												className={cn(
													"py-2 text-right font-mono tabular-nums",
													lowCvr && "text-amber-500",
												)}
											>
												{fmtPct(r.cvr)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						{sorted.length > MAX_TABLE_ROWS && (
							<p className="text-xs text-muted-foreground text-center py-3">
								仅显示前 {MAX_TABLE_ROWS} 条（共 {sorted.length} 条）
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
