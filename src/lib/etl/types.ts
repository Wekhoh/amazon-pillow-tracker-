import { z } from "zod";

export const ParamSchema = z.object({
	key: z.string(),
	value: z.string(),
	description: z.string().optional(),
});
export type ParamInput = z.infer<typeof ParamSchema>;

export const UnitEconomicsSchema = z.object({
	asinLabel: z.enum(["BLK", "DBL"]),
	priceUsd: z.number().positive(),
	fxRateCnyPerUsd: z.number().positive(),
	cogsPurchaseCny: z.number().nonnegative(),
	cogsShippingCny: z.number().nonnegative(),
	cogsPackagingCny: z.number().nonnegative(),
	fbaFeeUsd: z.number().nonnegative(),
	inboundFeeUsd: z.number().nonnegative(),
	storageAmortizationUsd: z.number().nonnegative(),
	commissionRate: z.number().min(0).max(1),
	returnRateEstimate: z.number().min(0).max(1),
	returnThreshold: z.number().min(0).max(1),
	returnFeeUsd: z.number().nonnegative(),
	inventoryQty: z.number().int().nonnegative(),
	adBudgetCny: z.number().nonnegative(),
});
export type UnitEconomicsInput = z.infer<typeof UnitEconomicsSchema>;

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

export const KeywordSchema = z.object({
	asinLabel: z.enum(["BLK", "DBL"]),
	date: z.date(),
	keyword: z.string().min(1),
	campaignName: z.string(),
	matchType: z.string().nullable(),
	impressions: z.number().int().nonnegative(),
	clicks: z.number().int().nonnegative(),
	orders: z.number().int().nonnegative(),
	spendUsd: z.number().nonnegative(),
	salesUsd: z.number().nonnegative(),
	baseBidUsd: z.number().nonnegative().nullable(),
	source: z.string().nullable(),
	negationStatus: z.string().nullable(),
	campaignType: z.string().nullable(),
	monthlySearchVolume: z.number().int().nonnegative().nullable(),
	abaWeeklyRank: z.number().int().nonnegative().nullable(),
	notes: z.string().nullable(),
});
export type KeywordInput = z.infer<typeof KeywordSchema>;
