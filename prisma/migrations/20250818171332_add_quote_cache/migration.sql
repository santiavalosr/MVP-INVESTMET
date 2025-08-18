-- CreateTable
CREATE TABLE "public"."QuoteCache" (
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "change" DECIMAL(65,30),
    "changePercent" DECIMAL(65,30),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteCache_pkey" PRIMARY KEY ("symbol")
);
