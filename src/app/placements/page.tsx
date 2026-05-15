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

export const dynamic = "force-dynamic";

type PlacementType = "TOS" | "ROS" | "PP" | "OTHER";

type PlacementTypeAgg = {
	type: PlacementType;
	impressions: number;
	clicks: number;
	orders: number;
	spendUsd: number;
	salesUsd: number;
	acos: number | null;
	cvr: number | null;
	ctr: number | null;
	roas: number | null;
};

type CampaignPlacementAgg = {
	campaignName: string;
	placement: string;
	placementType: PlacementType;
	impressions: number;
	clicks: number;
	orders: number;
	spendUsd: number;
	salesUsd: number;
	acos: number | null;
	cvr: number | null;
	ctr: number | null;
	roas: number | null;
};

async function getPlacementData(
	label: "BLK" | "DBL",
	tacosRedline: number,
): Promise<{
	typeAggs: PlacementTypeAgg[];
	rows: CampaignPlacementAgg[];
	totals: {
		rowCount: number;
		spend: number;
		sales: number;
		overRedline: number;
	};
}> {
	const asin = await prisma.asin.findUnique({ where: { label } });
	if (!asin) {
		return {
			typeAggs: [],
			rows: [],
			totals: { rowCount: 0, spend: 0, sales: 0, overRedline: 0 },
		};
	}
	const records = await prisma.placement.findMany({
		where: { asinId: asin.id },
		orderBy: { date: "desc" },
	});

	const byType = new Map<PlacementType, PlacementTypeAgg>();
	const byCampaignPlacement = new Map<string, CampaignPlacementAgg>();

	for (const r of records) {
		const t = r.placementType as PlacementType;
		const typeAgg = byType.get(t);
		if (typeAgg) {
			typeAgg.impressions += r.impressions;
			typeAgg.clicks += r.clicks;
			typeAgg.orders += r.orders;
			typeAgg.spendUsd += r.spendUsd;
			typeAgg.salesUsd += r.salesUsd;
		} else {
			byType.set(t, {
				type: t,
				impressions: r.impressions,
				clicks: r.clicks,
				orders: r.orders,
				spendUsd: r.spendUsd,
				salesUsd: r.salesUsd,
				acos: null,
				cvr: null,
				ctr: null,
				roas: null,
			});
		}
		const key = `${r.campaignName}||${r.placement}`;
		const agg = byCampaignPlacement.get(key);
		if (agg) {
			agg.impressions += r.impressions;
			agg.clicks += r.clicks;
			agg.orders += r.orders;
			agg.spendUsd += r.spendUsd;
			agg.salesUsd += r.salesUsd;
		} else {
			byCampaignPlacement.set(key, {
				campaignName: r.campaignName,
				placement: r.placement,
				placementType: t,
				impressions: r.impressions,
				clicks: r.clicks,
				orders: r.orders,
				spendUsd: r.spendUsd,
				salesUsd: r.salesUsd,
				acos: null,
				cvr: null,
				ctr: null,
				roas: null,
			});
		}
	}

	const finalize = <T extends PlacementTypeAgg | CampaignPlacementAgg>(
		a: T,
	): T => {
		a.acos = a.salesUsd > 0 ? a.spendUsd / a.salesUsd : null;
		a.cvr = a.clicks > 0 ? a.orders / a.clicks : null;
		a.ctr = a.impressions > 0 ? a.clicks / a.impressions : null;
		a.roas = a.spendUsd > 0 ? a.salesUsd / a.spendUsd : null;
		return a;
	};

	const typeAggs = [...byType.values()].map(finalize);
	const rows = [...byCampaignPlacement.values()].map(finalize);
	rows.sort((a, b) => b.spendUsd - a.spendUsd);

	const totals = {
		rowCount: rows.length,
		spend: typeAggs.reduce((s, a) => s + a.spendUsd, 0),
		sales: typeAggs.reduce((s, a) => s + a.salesUsd, 0),
		overRedline: rows.filter((r) => r.acos !== null && r.acos > tacosRedline)
			.length,
	};
	return { typeAggs, rows, totals };
}

const TYPE_ORDER: PlacementType[] = ["TOS", "ROS", "PP", "OTHER"];
const TYPE_LABEL: Record<PlacementType, string> = {
	TOS: "Top of Search",
	ROS: "Rest of Search",
	PP: "Product Pages",
	OTHER: "其他",
};
const TYPE_DESC: Record<PlacementType, string> = {
	TOS: "搜索首屏 · 高曝光高竞价",
	ROS: "搜索非首屏 · 量大但意图弱",
	PP: "竞品详情页 · 拦截流量",
	OTHER: "其他位置",
};

type SortKey =
	| "spend"
	| "sales"
	| "acos"
	| "roas"
	| "impressions"
	| "clicks"
	| "cvr";

const SORT_GETTERS: Record<SortKey, (r: CampaignPlacementAgg) => number> = {
	spend: (r) => r.spendUsd,
	sales: (r) => r.salesUsd,
	acos: (r) => r.acos ?? -Infinity,
	roas: (r) => r.roas ?? -Infinity,
	impressions: (r) => r.impressions,
	clicks: (r) => r.clicks,
	cvr: (r) => r.cvr ?? -Infinity,
};

function buildHref(
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

function fmtMoney(v: number): string {
	if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
	return `$${v.toFixed(2)}`;
}

function fmtPct(v: number | null, digits = 1): string {
	if (v === null) return "—";
	return `${(v * 100).toFixed(digits)}%`;
}

interface PageProps {
	searchParams: Promise<{ asin?: string; sort?: string; type?: string }>;
}

export default async function PlacementsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const label = (params.asin === "DBL" ? "DBL" : "BLK") as "BLK" | "DBL";
	const sortKey = (params.sort as SortKey) || "spend";
	const typeFilter = params.type as PlacementType | "all" | undefined;
	const activeType: PlacementType | "all" = typeFilter ?? "all";

	const redlineParam = await prisma.param.findUnique({
		where: { key: "tacos_redline" },
	});
	const tacosRedline = redlineParam ? Number(redlineParam.value) : 0.3234;

	const { typeAggs, rows, totals } = await getPlacementData(
		label,
		tacosRedline,
	);

	const filtered =
		activeType === "all"
			? rows
			: rows.filter((r) => r.placementType === activeType);
	const getter = SORT_GETTERS[sortKey];
	const sorted = [...filtered].sort((a, b) => getter(b) - getter(a));

	const orderedTypeAggs = TYPE_ORDER.map(
		(t) =>
			typeAggs.find((a) => a.type === t) ?? {
				type: t,
				impressions: 0,
				clicks: 0,
				orders: 0,
				spendUsd: 0,
				salesUsd: 0,
				acos: null,
				cvr: null,
				ctr: null,
				roas: null,
			},
	);

	const SortHeader = ({
		col,
		children,
	}: {
		col: SortKey;
		children: React.ReactNode;
	}) => {
		const active = sortKey === col;
		return (
			<th className="font-medium py-2 text-right text-muted-foreground">
				<Link
					href={buildHref(
						"/placements",
						{
							asin: label,
							type: activeType === "all" ? undefined : activeType,
						},
						{ sort: col },
					)}
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

	const TypeChip = ({
		value,
		label: chipLabel,
		count,
	}: {
		value: PlacementType | "all";
		label: string;
		count: number;
	}) => {
		const active = activeType === value;
		return (
			<Link
				href={buildHref(
					"/placements",
					{ asin: label, sort: sortKey },
					{ type: value === "all" ? null : value },
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
						active ? "bg-background/20" : "bg-muted",
					)}
				>
					{count}
				</span>
			</Link>
		);
	};

	const typeBuckets: Record<PlacementType, number> = {
		TOS: rows.filter((r) => r.placementType === "TOS").length,
		ROS: rows.filter((r) => r.placementType === "ROS").length,
		PP: rows.filter((r) => r.placementType === "PP").length,
		OTHER: rows.filter((r) => r.placementType === "OTHER").length,
	};

	return (
		<div className="max-w-screen-2xl space-y-6">
			<header className="flex justify-between items-start gap-4">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">投放位明细</h2>
					<p className="text-muted-foreground text-sm mt-1">
						{label} · {totals.rowCount} 个 (活动 × 投放位) 组合 · 累计{" "}
						{fmtMoney(totals.spend)} 花费 → {fmtMoney(totals.sales)} 销售
					</p>
				</div>
				<AsinSwitcher />
			</header>

			<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{orderedTypeAggs.map((a) => {
					const overRedline =
						a.acos !== null && a.acos > tacosRedline && a.salesUsd > 0;
					const shareOfSpend =
						totals.spend > 0 ? (a.spendUsd / totals.spend) * 100 : 0;
					return (
						<Card key={a.type}>
							<CardHeader>
								<CardDescription className="flex items-center justify-between">
									<span>{TYPE_LABEL[a.type]}</span>
									<Badge
										variant="outline"
										className="text-[10px] font-mono tabular-nums"
									>
										{a.type}
									</Badge>
								</CardDescription>
								<CardTitle className="text-xl font-bold">
									<Num>{fmtMoney(a.spendUsd)}</Num>
									<span className="text-xs font-normal text-muted-foreground ml-1.5">
										花费
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-xs">
								<div className="grid grid-cols-2 gap-x-3 gap-y-1">
									<div className="flex justify-between">
										<span className="text-muted-foreground">销售</span>
										<Num className="text-emerald-500">
											{fmtMoney(a.salesUsd)}
										</Num>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">ROAS</span>
										<Num>{a.roas !== null ? a.roas.toFixed(2) : "—"}</Num>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">ACoS</span>
										<Num
											className={cn(
												overRedline && "text-red-500 font-semibold",
											)}
										>
											{fmtPct(a.acos)}
										</Num>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">CVR</span>
										<Num>{fmtPct(a.cvr)}</Num>
									</div>
								</div>
								<div className="pt-1 border-t border-border/40">
									<div className="flex justify-between text-[10px] text-muted-foreground">
										<span>{TYPE_DESC[a.type]}</span>
										<span className="font-mono tabular-nums">
											{shareOfSpend.toFixed(0)}% 花费占比
										</span>
									</div>
									<div className="h-1 rounded-full bg-muted overflow-hidden mt-1">
										<div
											className="h-full bg-blue-500"
											style={{
												width: `${Math.min(100, shareOfSpend)}%`,
											}}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</section>

			<div className="flex flex-wrap gap-2">
				<TypeChip value="all" label="全部" count={totals.rowCount} />
				{TYPE_ORDER.map((t) => (
					<TypeChip
						key={t}
						value={t}
						label={`${TYPE_LABEL[t]} (${t})`}
						count={typeBuckets[t]}
					/>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>明细 ({sorted.length} 个组合)</CardTitle>
					<CardDescription>
						点击列头切换排序 · 红色 = ACoS 超红线（
						{(tacosRedline * 100).toFixed(1)}%）
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="font-medium py-2 text-muted-foreground text-left">
										活动
									</th>
									<th className="font-medium py-2 text-muted-foreground text-left">
										投放位
									</th>
									<SortHeader col="spend">花费</SortHeader>
									<SortHeader col="sales">销售</SortHeader>
									<SortHeader col="acos">ACoS</SortHeader>
									<SortHeader col="roas">ROAS</SortHeader>
									<SortHeader col="impressions">曝光</SortHeader>
									<SortHeader col="clicks">点击</SortHeader>
									<SortHeader col="cvr">CVR</SortHeader>
								</tr>
							</thead>
							<tbody className="divide-y">
								{sorted.length === 0 && (
									<tr>
										<td
											colSpan={9}
											className="py-8 text-center text-muted-foreground"
										>
											无数据
										</td>
									</tr>
								)}
								{sorted.slice(0, 200).map((r, idx) => {
									const overRedline =
										r.acos !== null && r.acos > tacosRedline && r.salesUsd > 0;
									const burning = r.spendUsd > 0 && r.salesUsd === 0;
									return (
										<tr
											key={`${r.campaignName}||${r.placement}||${idx}`}
											className="hover:bg-muted/30"
										>
											<td className="py-2 pr-2 max-w-[200px]">
												<div
													className="text-xs truncate"
													title={r.campaignName}
												>
													{r.campaignName}
												</div>
											</td>
											<td className="py-2 pr-2 max-w-[200px]">
												<div className="flex items-center gap-2">
													<Badge
														variant="outline"
														className="text-[10px] font-mono px-1 py-0"
													>
														{r.placementType}
													</Badge>
													<div
														className="text-xs text-muted-foreground truncate"
														title={r.placement}
													>
														{r.placement}
													</div>
												</div>
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
											<td className="py-2 text-right font-mono tabular-nums">
												{fmtPct(r.cvr)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						{sorted.length > 200 && (
							<p className="text-xs text-muted-foreground text-center py-3">
								仅显示前 200 条（共 {sorted.length} 条）
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
