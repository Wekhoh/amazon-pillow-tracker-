import { cn } from "@/lib/utils";

export function Num({
	children,
	className,
	...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span {...rest} className={cn("tabular-nums font-mono", className)}>
			{children}
		</span>
	);
}
