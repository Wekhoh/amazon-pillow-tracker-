import type { Insight } from "@/lib/insights";
import { AlertTriangle, AlertOctagon, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const severityStyle: Record<
	Insight["severity"],
	{
		Icon: typeof Info;
		color: string;
		bg: string;
		border: string;
	}
> = {
	info: {
		Icon: Info,
		color: "text-blue-500",
		bg: "bg-blue-500/10",
		border: "border-blue-500/30",
	},
	warning: {
		Icon: AlertTriangle,
		color: "text-amber-500",
		bg: "bg-amber-500/10",
		border: "border-amber-500/30",
	},
	critical: {
		Icon: AlertOctagon,
		color: "text-red-500",
		bg: "bg-red-500/10",
		border: "border-red-500/30",
	},
};

export function ActionPanel({ insights }: { insights: Insight[] }) {
	if (insights.length === 0) {
		return (
			<div className="text-sm text-muted-foreground py-4 text-center">
				暂无告警
			</div>
		);
	}
	return (
		<div className="space-y-3">
			{insights.map((i, idx) => {
				const s = severityStyle[i.severity];
				const Icon = s.Icon;
				return (
					<div
						key={idx}
						className={cn("rounded-md border p-3 flex gap-3", s.bg, s.border)}
					>
						<Icon className={cn("size-4 mt-0.5 flex-shrink-0", s.color)} />
						<div className="flex-1 space-y-1 text-sm">
							<div className="font-medium leading-tight">{i.title}</div>
							<div className="text-xs text-muted-foreground">{i.detail}</div>
							{i.action && (
								<div className="text-xs flex items-center gap-1.5 pt-0.5">
									<ArrowRight className="size-3" />
									<span>{i.action}</span>
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
