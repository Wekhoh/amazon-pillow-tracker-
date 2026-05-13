import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
	label: string;
	value: string | number | null;
	unit?: string;
	hint?: string;
	warningThreshold?: { value: number; comparator: "gt" | "lt" };
	numericValue?: number | null;
}

export function KpiCard({
	label,
	value,
	unit,
	hint,
	warningThreshold,
	numericValue,
}: KpiCardProps) {
	const isWarning =
		warningThreshold &&
		numericValue !== null &&
		numericValue !== undefined &&
		(warningThreshold.comparator === "gt"
			? numericValue > warningThreshold.value
			: numericValue < warningThreshold.value);

	return (
		<Card className={cn(isWarning && "border-orange-500")}>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold tabular-nums">
					{value === null || value === undefined || value === "" ? "—" : value}
					{unit && (
						<span className="text-sm font-normal text-muted-foreground ml-1">
							{unit}
						</span>
					)}
				</div>
				{hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
			</CardContent>
		</Card>
	);
}
