-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "totalPrice" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment_proof',
    "slipUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cancelOrRejectReason" TEXT,
    "addressesId" INTEGER,
    CONSTRAINT "Order_addressesId_fkey" FOREIGN KEY ("addressesId") REFERENCES "Addresses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("addressesId", "cancelOrRejectReason", "createdAt", "id", "slipUrl", "status", "totalPrice", "updatedAt", "userId") SELECT "addressesId", "cancelOrRejectReason", "createdAt", "id", "slipUrl", "status", "totalPrice", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
