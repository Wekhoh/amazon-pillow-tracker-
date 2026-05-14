import { cn } from "@/lib/utils";

interface StageEntry {
	name: string;
	startDay: number;
	endDay: number;
	label: string;
}

const STAGES: StageEntry[] = [
	{ name: "D0-7", startDay: 0, endDay: 7, label: "冷启动" },
	{ name: "D8-21", startDay: 8, endDay: 21, label: "爬升" },
	{ name: "D22-45", startDay: 22, endDay: 45, label: "稳定" },
	{ name: "D46-90", startDay: 46, endDay: 90, label: "盈利期" },
	{ name: "D91-180", startDay: 91, endDay: 180, label: "监控/清尾" },
];

export function StageTimeline({ currentDay }: { currentDay: number }) {
	return (
		<div className="space-y-2.5">
			{STAGES.map((s) => {
				const inThis = currentDay >= s.startDay && currentDay <= s.endDay;
				const done = currentDay > s.endDay;
				return (
					<div key={s.name} className="flex items-center gap-3 text-sm">
						<div
							className={cn(
								"h-2.5 w-2.5 rounded-full flex-shrink-0",
								inThis
									? "bg-blue-500 ring-4 ring-blue-500/30"
									: done
										? "bg-blue-300"
										: "bg-muted-foreground/30",
							)}
						/>
						<div className="flex-1 flex justify-between items-baseline">
							<span
								className={cn(
									"tabular-nums",
									inThis && "font-semibold text-foreground",
									done && "text-muted-foreground",
									!inThis && !done && "text-muted-foreground",
								)}
							>
								{s.name}{" "}
								<span className="text-muted-foreground">· {s.label}</span>
							</span>
							{inThis && (
								<span className="text-xs text-blue-500 font-medium tabular-nums">
									Day {currentDay} / {s.endDay} ({s.endDay - currentDay + 1}{" "}
									天剩余)
								</span>
							)}
							{done && (
								<span className="text-xs text-muted-foreground">已完成</span>
							)}
							{!inThis && !done && (
								<span className="text-xs text-muted-foreground">未开始</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
