import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

const severityColor: Record<Insight["severity"], string> = {
	info: "border-blue-500/40 bg-blue-500/5",
	warning: "border-amber-500/40 bg-amber-500/5",
	critical: "border-rose-500/40 bg-rose-500/5",
};

const severityBadge: Record<Insight["severity"], string> = {
	info: "bg-blue-500",
	warning: "bg-amber-500",
	critical: "bg-rose-500",
};

export function ActionPanel({ insights }: { insights: Insight[] }) {
	return (
		<div className="space-y-2">
			{insights.map((i, idx) => (
				<div
					key={idx}
					className={cn(
						"rounded border p-3 text-sm",
						severityColor[i.severity],
					)}
				>
					<div className="flex items-start gap-2">
						<span
							className={cn(
								"inline-block h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
								severityBadge[i.severity],
							)}
						/>
						<div className="flex-1">
							<div className="font-semibold">{i.title}</div>
							<div className="text-xs text-muted-foreground mt-0.5">
								{i.detail}
							</div>
							{i.action && <div className="text-xs mt-1.5">▶ {i.action}</div>}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
