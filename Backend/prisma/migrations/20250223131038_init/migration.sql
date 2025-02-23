-- CreateTable
CREATE TABLE "Province" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "geography_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Amphure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "province_id" INTEGER NOT NULL,
    CONSTRAINT "Amphure_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "Province" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tambon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "amphure_id" INTEGER NOT NULL,
    "zip_code" INTEGER NOT NULL,
    CONSTRAINT "Tambon_amphure_id_fkey" FOREIGN KEY ("amphure_id") REFERENCES "Amphure" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
