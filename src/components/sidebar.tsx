import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { prisma } from "@/lib/prisma";
import {
	rolling7d,
	getPhase,
	type DailyMetric,
	type Phase,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	GitCompareArrows,
	Database,
	Package,
} from "lucide-react";

const navItems = [
	{ href: "/", label: "总览", Icon: LayoutDashboard },
	{ href: "/compare", label: "BLK vs DBL", Icon: GitCompareArrows },
];

type Snapshot = {
	label: "BLK" | "DBL";
	dayNum: number;
	phase: Phase;
	todayOrders: number;
	todaySpend: number;
	inventory: number | null;
	acos: number | null;
	tacos: number | null;
};

const PHASE_END_DAY: Record<Phase, number> = {
	"pre-launch": 0,
	"D0-7": 7,
	"D8-21": 21,
	"D22-45": 45,
	"D46-90": 90,
	"D91-180": 180,
};

async function getSnapshots(): Promise<{
	snaps: Snapshot[];
	tacosRedline: number;
}> {
	const redlineParam = await prisma.param.findUnique({
		where: { key: "tacos_redline" },
	});
	const tacosRedline = redlineParam ? Number(redlineParam.value) : 0.3234;

	const snaps: Snapshot[] = [];
	for (const label of ["BLK", "DBL"] as const) {
		const asin = await prisma.asin.findUnique({ where: { label } });
		if (!asin) continue;
		const records = await prisma.dailyRecord.findMany({
			where: { asinId: asin.id },
			orderBy: { date: "asc" },
		});
		if (records.length === 0) continue;
		const metrics: DailyMetric[] = records.map((r) => ({
			date: r.date,
			adSpendUsd: r.adSpendUsd,
			adSalesUsd: r.adSalesUsd,
			totalSalesUsd: r.totalSalesUsd,
			clicks: r.clicks,
			adOrders: r.adOrders,
			totalOrders: r.totalOrders,
		}));
		const idx = metrics.length - 1;
		const r = records[idx];
		const w = rolling7d(metrics, idx);
		const latestInventory =
			[...records].reverse().find((x) => x.inventory !== null)?.inventory ??
			null;
		snaps.push({
			label,
			dayNum: r.dayNum,
			phase: getPhase(r.dayNum),
			todayOrders: r.totalOrders,
			todaySpend: r.adSpendUsd,
			inventory: latestInventory,
			acos: w.acos,
			tacos: w.tacos,
		});
	}
	return { snaps, tacosRedline };
}

function MiniSnap({ s, tacosRedline }: { s: Snapshot; tacosRedline: number }) {
	const tacosWarn = s.tacos !== null && s.tacos > tacosRedline;
	const acosWarn = s.acos !== null && s.acos > tacosRedline;
	const inventoryLow =
		s.inventory !== null && s.inventory !== undefined && s.inventory < 100;
	return (
		<div className="rounded-md border bg-background/60 px-2.5 py-2 space-y-1.5">
			<div className="flex items-baseline justify-between">
				<span className="text-xs font-semibold">{s.label}</span>
				<span className="text-[10px] text-muted-foreground tabular-nums">
					Day {s.dayNum} · {s.phase}
				</span>
			</div>
			<div className="grid grid-cols-2 gap-x-2 text-[11px] leading-tight">
				<div className="flex items-baseline justify-between">
					<span className="text-muted-foreground text-[10px]">ACoS</span>
					<span
						className={cn("font-mono tabular-nums", acosWarn && "text-red-500")}
					>
						{s.acos !== null ? `${(s.acos * 100).toFixed(1)}%` : "—"}
					</span>
				</div>
				<div className="flex items-baseline justify-between">
					<span className="text-muted-foreground text-[10px]">TACoS</span>
					<span
						className={cn(
							"font-mono tabular-nums",
							tacosWarn && "text-red-500",
						)}
					>
						{s.tacos !== null ? `${(s.tacos * 100).toFixed(1)}%` : "—"}
					</span>
				</div>
			</div>
			<div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
				<span className="font-mono tabular-nums text-foreground">
					{s.todayOrders} 单
				</span>
				<span className="font-mono tabular-nums">
					${s.todaySpend.toFixed(2)}
				</span>
				<span
					className={cn(
						"font-mono tabular-nums",
						inventoryLow && "text-orange-500",
					)}
				>
					库存 {s.inventory ?? "—"}
				</span>
			</div>
		</div>
	);
}

export async function Sidebar() {
	const { snaps, tacosRedline } = await getSnapshots();
	const blk = snaps.find((s) => s.label === "BLK");
	const dbl = snaps.find((s) => s.label === "DBL");
	const dayNum = blk?.dayNum ?? dbl?.dayNum ?? 0;
	const phase = blk?.phase ?? dbl?.phase ?? "pre-launch";
	const phaseEnd = PHASE_END_DAY[phase];
	const daysLeft = Math.max(0, phaseEnd - dayNum);
	const phasePct = phaseEnd > 0 ? Math.min(100, (dayNum / phaseEnd) * 100) : 0;

	return (
		<aside className="w-60 border-r bg-card/40 p-4 flex flex-col gap-1 sticky top-0 h-screen overflow-y-auto self-start">
			<div className="flex items-center gap-2 mb-4">
				<div className="size-8 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
					<Package className="size-4" />
				</div>
				<div>
					<h1 className="font-semibold text-sm leading-tight">U型枕追踪</h1>
					<p className="text-[10px] text-muted-foreground leading-tight">
						ZP-TP01 推广仪表盘
					</p>
				</div>
			</div>

			<Separator className="my-1" />

			<nav className="flex flex-col gap-0.5 mt-2">
				<p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-1">
					导航
				</p>
				{navItems.map(({ href, label, Icon }) => (
					<Link
						key={href}
						href={href}
						className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm transition-colors"
					>
						<Icon className="size-4 text-muted-foreground" />
						<span>{label}</span>
					</Link>
				))}
			</nav>

			{snaps.length > 0 && (
				<>
					<Separator className="my-3" />
					<div className="space-y-2">
						<p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">
							ASIN 状态
						</p>
						{blk && <MiniSnap s={blk} tacosRedline={tacosRedline} />}
						{dbl && <MiniSnap s={dbl} tacosRedline={tacosRedline} />}
					</div>

					<div className="mt-3 px-2.5 py-2 rounded-md border bg-muted/30 space-y-1.5">
						<div className="flex items-center justify-between text-[11px]">
							<span className="text-muted-foreground text-[10px]">
								当前阶段 {phase}
							</span>
							<span className="font-mono tabular-nums">
								剩 <span className="text-foreground">{daysLeft}</span> 天
							</span>
						</div>
						<div className="h-1 rounded-full bg-background overflow-hidden">
							<div
								className="h-full bg-blue-500 transition-all"
								style={{ width: `${phasePct}%` }}
							/>
						</div>
					</div>
				</>
			)}

			<div className="mt-auto space-y-3">
				<div className="flex items-center justify-between px-3">
					<span className="text-xs text-muted-foreground">主题</span>
					<ThemeToggle />
				</div>
				<Separator />
				<div className="flex items-start gap-2 px-3 text-[10px] text-muted-foreground">
					<Database className="size-3 mt-0.5 flex-shrink-0" />
					<div>
						数据源：Excel 镜像
						<br />
						运行 <code className="bg-muted px-1 rounded">pnpm sync</code> 更新
					</div>
				</div>
			</div>
		</aside>
	);
}
