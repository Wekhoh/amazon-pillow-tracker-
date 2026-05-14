"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return <div className="h-7 w-12 rounded bg-muted" />;

	return (
		<button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
			aria-label="Toggle theme"
		>
			{theme === "dark" ? "Light" : "Dark"}
		</button>
	);
}
