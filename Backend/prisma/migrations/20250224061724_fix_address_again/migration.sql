/*
  Warnings:

  - Added the required column `amphureId` to the `Addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provinceId` to the `Addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tambonId` to the `Addresses` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Addresses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "recipientName" TEXT NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "provinceName" TEXT NOT NULL,
    "amphureId" INTEGER NOT NULL,
    "amphureName" TEXT NOT NULL,
    "tambonId" INTEGER NOT NULL,
    "tambonName" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Addresses_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Addresses_amphureId_fkey" FOREIGN KEY ("amphureId") REFERENCES "Amphure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Addresses_tambonId_fkey" FOREIGN KEY ("tambonId") REFERENCES "Tambon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Addresses" ("amphureName", "createdAt", "currentAddress", "email", "id", "mobileNumber", "provinceName", "recipientName", "tambonName", "updatedAt", "userId", "zipCode") SELECT "amphureName", "createdAt", "currentAddress", "email", "id", "mobileNumber", "provinceName", "recipientName", "tambonName", "updatedAt", "userId", "zipCode" FROM "Addresses";
DROP TABLE "Addresses";
ALTER TABLE "new_Addresses" RENAME TO "Addresses";
CREATE TABLE "new_Amphure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "province_id" INTEGER NOT NULL,
    CONSTRAINT "Amphure_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "Province" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Amphure" ("id", "name_en", "name_th", "province_id") SELECT "id", "name_en", "name_th", "province_id" FROM "Amphure";
DROP TABLE "Amphure";
ALTER TABLE "new_Amphure" RENAME TO "Amphure";
CREATE TABLE "new_Tambon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "amphure_id" INTEGER NOT NULL,
    "zip_code" INTEGER NOT NULL,
    CONSTRAINT "Tambon_amphure_id_fkey" FOREIGN KEY ("amphure_id") REFERENCES "Amphure" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tambon" ("amphure_id", "id", "name_en", "name_th", "zip_code") SELECT "amphure_id", "id", "name_en", "name_th", "zip_code" FROM "Tambon";
DROP TABLE "Tambon";
ALTER TABLE "new_Tambon" RENAME TO "Tambon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
