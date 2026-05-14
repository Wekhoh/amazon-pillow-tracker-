import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
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

export function Sidebar() {
	return (
		<aside className="w-60 border-r bg-card/40 p-4 flex flex-col gap-1">
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
