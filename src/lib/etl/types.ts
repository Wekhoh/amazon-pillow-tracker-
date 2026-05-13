import { z } from "zod";

export const ParamSchema = z.object({
	key: z.string(),
	value: z.string(),
	description: z.string().optional(),
});
export type ParamInput = z.infer<typeof ParamSchema>;

export const DailyRecordSchema = z.object({
	asinLabel: z.enum(["BLK", "DBL"]),
	date: z.date(),
	totalOrders: z.number().int().nonnegative(),
	unitsOrdered: z.number().int().nonnegative(),
	adOrders: z.number().int().nonnegative(),
	adSpendUsd: z.number().nonnegative(),
	adSalesUsd: z.number().nonnegative(),
	totalSalesUsd: z.number().nonnegative(),
	impressions: z.number().int().nonnegative(),
	clicks: z.number().int().nonnegative(),
	sessions: z.number().int().nonnegative(),
	inventory: z.number().int().nonnegative().nullable(),
	notes: z.string().nullable(),
});
export type DailyRecordInput = z.infer<typeof DailyRecordSchema>;
