/*
  Warnings:

  - Added the required column `userId` to the `PriceSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."PriceSnapshot_symbol_asOf_idx";

-- DropIndex
DROP INDEX "public"."PriceSnapshot_symbol_asOf_key";

-- AlterTable
ALTER TABLE "public"."PriceSnapshot" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "source" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PriceSnapshot_userId_symbol_asOf_idx" ON "public"."PriceSnapshot"("userId", "symbol", "asOf");

-- AddForeignKey
ALTER TABLE "public"."PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
