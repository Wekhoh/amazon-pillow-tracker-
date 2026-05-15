-- CreateTable
CREATE TABLE "Keyword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asinId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "keyword" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL DEFAULT '',
    "matchType" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "spendUsd" REAL NOT NULL DEFAULT 0,
    "salesUsd" REAL NOT NULL DEFAULT 0,
    "baseBidUsd" REAL,
    "source" TEXT,
    "negationStatus" TEXT,
    "campaignType" TEXT,
    "monthlySearchVolume" INTEGER,
    "abaWeeklyRank" INTEGER,
    "notes" TEXT,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Keyword_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "Asin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Keyword_asinId_keyword_idx" ON "Keyword"("asinId", "keyword");

-- CreateIndex
CREATE INDEX "Keyword_asinId_date_idx" ON "Keyword"("asinId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_asinId_date_keyword_campaignName_key" ON "Keyword"("asinId", "date", "keyword", "campaignName");
