/*
  Warnings:

  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `images` table. All the data in the column will be lost.
  - Made the column `category` on table `images` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hash` on table `images` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "verification_tokens_identifier_token_key";

-- DropIndex
DROP INDEX "verification_tokens_token_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "verification_tokens";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isCombined" BOOLEAN NOT NULL DEFAULT false,
    "associatedVideoPath" TEXT,
    "associatedVideoType" TEXT,
    "memoryId" TEXT,
    "momentId" TEXT,
    CONSTRAINT "images_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "images_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_images" ("category", "filename", "hash", "height", "id", "isFavorite", "memoryId", "mimeType", "momentId", "originalName", "path", "size", "thumbnailPath", "width") SELECT "category", "filename", "hash", "height", "id", "isFavorite", "memoryId", "mimeType", "momentId", "originalName", "path", "size", "thumbnailPath", "width" FROM "images";
DROP TABLE "images";
ALTER TABLE "new_images" RENAME TO "images";
CREATE UNIQUE INDEX "images_hash_key" ON "images"("hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
