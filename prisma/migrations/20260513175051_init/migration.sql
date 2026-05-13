-- CreateTable
CREATE TABLE "Asin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "startDay" INTEGER NOT NULL,
    "endDay" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "DailyRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asinId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "dayNum" INTEGER NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "unitsOrdered" INTEGER NOT NULL DEFAULT 0,
    "adOrders" INTEGER NOT NULL DEFAULT 0,
    "adSpendUsd" REAL NOT NULL DEFAULT 0,
    "adSalesUsd" REAL NOT NULL DEFAULT 0,
    "totalSalesUsd" REAL NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "inventory" INTEGER,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'excel',
    "importTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyRecord_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "Asin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitEconomics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asinId" INTEGER NOT NULL,
    "priceUsd" REAL NOT NULL,
    "fxRateCnyPerUsd" REAL NOT NULL,
    "cogsPurchaseCny" REAL NOT NULL,
    "cogsShippingCny" REAL NOT NULL,
    "cogsPackagingCny" REAL NOT NULL DEFAULT 0,
    "fbaFeeUsd" REAL NOT NULL,
    "inboundFeeUsd" REAL NOT NULL,
    "storageAmortizationUsd" REAL NOT NULL,
    "commissionRate" REAL NOT NULL,
    "returnRateEstimate" REAL NOT NULL,
    "returnThreshold" REAL NOT NULL,
    "returnFeeUsd" REAL NOT NULL,
    "inventoryQty" INTEGER NOT NULL,
    "adBudgetCny" REAL NOT NULL,
    CONSTRAINT "UnitEconomics_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "Asin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Param" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Asin_code_key" ON "Asin"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Asin_label_key" ON "Asin"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Phase_name_key" ON "Phase"("name");

-- CreateIndex
CREATE INDEX "DailyRecord_asinId_date_idx" ON "DailyRecord"("asinId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRecord_asinId_date_key" ON "DailyRecord"("asinId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UnitEconomics_asinId_key" ON "UnitEconomics"("asinId");
