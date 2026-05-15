"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	GitCompareArrows,
	Hash,
	Crosshair,
} from "lucide-react";

const navItems = [
	{ href: "/", label: "总览", Icon: LayoutDashboard },
	{ href: "/compare", label: "BLK vs DBL", Icon: GitCompareArrows },
	{ href: "/keywords", label: "关键词台账", Icon: Hash },
	{ href: "/placements", label: "投放位明细", Icon: Crosshair },
];

export function NavLinks() {
	const pathname = usePathname();
	return (
		<nav className="flex flex-col gap-0.5 mt-2">
			<p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 mb-1">
				导航
			</p>
			{navItems.map(({ href, label, Icon }) => {
				const active = pathname === href;
				return (
					<Link
						key={href}
						href={href}
						className={cn(
							"flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
							active
								? "bg-accent text-foreground font-medium"
								: "hover:bg-accent text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon
							className={cn(
								"size-4",
								active ? "text-foreground" : "text-muted-foreground",
							)}
						/>
						<span>{label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
