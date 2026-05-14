import { cn } from "@/lib/utils";
import { Num } from "@/components/num";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { Phase } from "@/lib/calculations";

interface StageEntry {
	name: Exclude<Phase, "pre-launch">;
	startDay: number;
	endDay: number;
	label: string;
	hint: string;
}

const STAGES: StageEntry[] = [
	{
		name: "D0-7",
		startDay: 0,
		endDay: 7,
		label: "冷启动",
		hint: "拿曝光、建权重",
	},
	{
		name: "D8-21",
		startDay: 8,
		endDay: 21,
		label: "爬升",
		hint: "测词、筛活动",
	},
	{
		name: "D22-45",
		startDay: 22,
		endDay: 45,
		label: "稳定",
		hint: "出价精细化",
	},
	{
		name: "D46-90",
		startDay: 46,
		endDay: 90,
		label: "盈利期",
		hint: "降广告占比",
	},
	{
		name: "D91-180",
		startDay: 91,
		endDay: 180,
		label: "监控/清尾",
		hint: "动态决策",
	},
];

export function StageTimeline({ currentDay }: { currentDay: number }) {
	return (
		<ol className="space-y-3">
			{STAGES.map((s) => {
				const inThis = currentDay >= s.startDay && currentDay <= s.endDay;
				const done = currentDay > s.endDay;
				const Icon = done ? CheckCircle2 : inThis ? Clock : Circle;
				return (
					<li key={s.name} className="flex items-start gap-3 text-sm">
						<Icon
							className={cn(
								"size-4 mt-0.5 flex-shrink-0",
								done && "text-emerald-500",
								inThis && "text-blue-500",
								!done && !inThis && "text-muted-foreground",
							)}
						/>
						<div className="flex-1 flex items-baseline justify-between gap-3">
							<div className="space-y-0.5">
								<div
									className={cn(
										"font-medium leading-none",
										inThis && "text-foreground",
										!inThis && "text-muted-foreground",
									)}
								>
									{s.name}{" "}
									<span className="text-xs text-muted-foreground">
										· {s.label}
									</span>
								</div>
								<div className="text-[11px] text-muted-foreground">
									{s.hint}
								</div>
							</div>
							{inThis && (
								<span className="text-xs text-blue-500">
									Day <Num>{currentDay}</Num>/<Num>{s.endDay}</Num>
								</span>
							)}
							{done && (
								<span className="text-xs text-muted-foreground">已完成</span>
							)}
							{!inThis && !done && (
								<span className="text-xs text-muted-foreground">未开始</span>
							)}
						</div>
					</li>
				);
			})}
		</ol>
	);
}
