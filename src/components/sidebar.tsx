import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const navItems = [
	{ href: "/", label: "总览" },
	{ href: "/compare", label: "BLK vs DBL" },
];

export function Sidebar() {
	return (
		<aside className="w-56 border-r bg-background p-4 flex flex-col">
			<div className="mb-6">
				<h1 className="font-semibold text-lg">U型枕追踪</h1>
				<p className="text-xs text-muted-foreground">ZP-TP01 推广仪表盘</p>
			</div>
			<nav className="flex flex-col gap-1">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className="px-3 py-2 rounded hover:bg-accent text-sm"
					>
						{item.label}
					</Link>
				))}
			</nav>
			<Separator className="my-4" />
			<p className="text-xs text-muted-foreground mt-auto">
				数据源：Excel 镜像
				<br />
				最后同步：运行{" "}
				<code className="text-[10px] bg-muted px-1 rounded">pnpm sync</code>
			</p>
		</aside>
	);
}
