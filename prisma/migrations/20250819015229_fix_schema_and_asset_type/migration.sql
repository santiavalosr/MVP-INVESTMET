/*
  Warnings:

  - A unique constraint covering the columns `[userId,symbol,type]` on the table `WatchlistItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('EQUITY', 'CRYPTO', 'INDEX');

-- DropIndex
DROP INDEX "public"."WatchlistItem_userId_symbol_key";

-- AlterTable
ALTER TABLE "public"."WatchlistItem" ADD COLUMN     "type" "public"."AssetType" NOT NULL DEFAULT 'EQUITY';

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_symbol_type_key" ON "public"."WatchlistItem"("userId", "symbol", "type");
