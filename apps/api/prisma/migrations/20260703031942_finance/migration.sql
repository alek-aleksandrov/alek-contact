-- CreateTable
CREATE TABLE "FredSeries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "units" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "seasonalAdjustment" TEXT,
    "notes" TEXT,
    "category" TEXT NOT NULL,
    "lastUpdatedRemote" TIMESTAMP(3),
    "lastFetchedAt" TIMESTAMP(3),

    CONSTRAINT "FredSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FredObservation" (
    "seriesId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(65,30),

    CONSTRAINT "FredObservation_pkey" PRIMARY KEY ("seriesId","date")
);

-- CreateTable
CREATE TABLE "Instrument" (
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "onWatchlist" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "Quote" (
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "change" DECIMAL(65,30) NOT NULL,
    "changePercent" DECIMAL(65,30) NOT NULL,
    "open" DECIMAL(65,30),
    "high" DECIMAL(65,30),
    "low" DECIMAL(65,30),
    "prevClose" DECIMAL(65,30),
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("symbol")
);

-- CreateIndex
CREATE INDEX "FredObservation_seriesId_date_idx" ON "FredObservation"("seriesId", "date");

-- AddForeignKey
ALTER TABLE "FredObservation" ADD CONSTRAINT "FredObservation_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "FredSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "Instrument"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;
