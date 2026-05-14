import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "U型枕推广追踪",
	description: "ZP-TP01 BLK/DBL 推广仪表盘",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="zh-CN"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body suppressHydrationWarning className="min-h-screen flex">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<Sidebar />
					<main className="flex-1 p-6 overflow-auto">{children}</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
