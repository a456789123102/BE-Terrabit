/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Addresses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Addresses_userId_key" ON "Addresses"("userId");
