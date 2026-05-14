"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
	{ value: "light", Icon: Sun, label: "Light" },
	{ value: "system", Icon: Monitor, label: "System" },
	{ value: "dark", Icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<div className="inline-flex h-7 w-[88px] rounded-md border bg-muted/40" />
		);
	}

	const current = theme ?? "system";

	return (
		<div
			role="radiogroup"
			aria-label="主题切换"
			className="inline-flex h-7 items-center rounded-md border bg-muted/30 p-0.5"
		>
			{OPTIONS.map(({ value, Icon, label }) => {
				const active = current === value;
				return (
					<button
						key={value}
						type="button"
						role="radio"
						aria-checked={active}
						aria-label={label}
						title={label}
						onClick={() => setTheme(value)}
						className={cn(
							"inline-flex h-6 w-7 items-center justify-center rounded transition-colors",
							active
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon className="size-3.5" />
					</button>
				);
			})}
		</div>
	);
}
