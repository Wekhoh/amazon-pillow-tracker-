-- CreateTable
CREATE TABLE "Placement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asinId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "campaignName" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "placementType" TEXT NOT NULL,
    "biddingStrategy" TEXT,
    "portfolioName" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "units" INTEGER NOT NULL DEFAULT 0,
    "spendUsd" REAL NOT NULL DEFAULT 0,
    "salesUsd" REAL NOT NULL DEFAULT 0,
    "cpcUsd" REAL,
    "notes" TEXT,
    "dailyCloseStatus" TEXT,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Placement_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "Asin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Placement_asinId_placementType_idx" ON "Placement"("asinId", "placementType");

-- CreateIndex
CREATE INDEX "Placement_asinId_date_idx" ON "Placement"("asinId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_asinId_date_campaignName_placement_key" ON "Placement"("asinId", "date", "campaignName", "placement");
