import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/calculations";

const PHASES: {
	name: Exclude<Phase, "pre-launch">;
	start: number;
	end: number;
}[] = [
	{ name: "D0-7", start: 0, end: 7 },
	{ name: "D8-21", start: 8, end: 21 },
	{ name: "D22-45", start: 22, end: 45 },
	{ name: "D46-90", start: 46, end: 90 },
	{ name: "D91-180", start: 91, end: 180 },
];

export function StageProgress({ currentDay }: { currentDay: number }) {
	return (
		<div className="flex w-full gap-1">
			{PHASES.map((phase) => {
				const total = phase.end - phase.start + 1;
				const inThis = currentDay >= phase.start && currentDay <= phase.end;
				const progress = inThis
					? ((currentDay - phase.start + 1) / total) * 100
					: currentDay > phase.end
						? 100
						: 0;
				return (
					<div key={phase.name} className="flex-1">
						<div className="text-xs text-muted-foreground mb-1">
							{phase.name}
						</div>
						<div className="h-2 rounded bg-muted overflow-hidden">
							<div
								className={cn(
									"h-full transition-all",
									inThis
										? "bg-blue-500"
										: currentDay > phase.end
											? "bg-blue-200"
											: "bg-muted",
								)}
								style={{ width: `${progress}%` }}
							/>
						</div>
						{inThis && (
							<div className="text-xs mt-1 text-blue-600 font-medium">
								Day {currentDay}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
