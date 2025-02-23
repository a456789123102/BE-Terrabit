/*
  Warnings:

  - You are about to drop the column `city` on the `Addresses` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Addresses` table. All the data in the column will be lost.
  - Added the required column `amphureName` to the `Addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provinceName` to the `Addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tambonName` to the `Addresses` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Addresses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "recipientName" TEXT NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "provinceName" TEXT NOT NULL,
    "amphureName" TEXT NOT NULL,
    "tambonName" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Addresses" ("createdAt", "currentAddress", "email", "id", "mobileNumber", "recipientName", "updatedAt", "userId", "zipCode") SELECT "createdAt", "currentAddress", "email", "id", "mobileNumber", "recipientName", "updatedAt", "userId", "zipCode" FROM "Addresses";
DROP TABLE "Addresses";
ALTER TABLE "new_Addresses" RENAME TO "Addresses";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
