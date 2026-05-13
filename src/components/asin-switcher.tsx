"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function AsinSwitcher() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const current = params.get("asin") ?? "BLK";

	function onChange(value: unknown) {
		const next = new URLSearchParams(params.toString());
		next.set("asin", String(value));
		router.push(`${pathname}?${next.toString()}`);
	}

	return (
		<Tabs value={current} onValueChange={onChange}>
			<TabsList>
				<TabsTrigger value="BLK">BLK (Black)</TabsTrigger>
				<TabsTrigger value="DBL">DBL (Dark Blue)</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
