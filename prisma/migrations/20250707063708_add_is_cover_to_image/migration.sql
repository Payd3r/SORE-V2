/*
  Warnings:

  - You are about to drop the column `associatedVideoPath` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `associatedVideoType` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `combinedImagePath` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `moments` table. All the data in the column will be lost.
  - Added the required column `title` to the `moments` table without a default value. This is not possible if the table is not empty.
  - Made the column `participantId` on table `moments` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalPath" TEXT NOT NULL,
    "mp4Path" TEXT,
    "webmPath" TEXT,
    "hlsPlaylistPath" TEXT,
    "duration" REAL NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "memoryId" TEXT,
    "posterImageId" TEXT,
    CONSTRAINT "videos_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "videos_posterImageId_fkey" FOREIGN KEY ("posterImageId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "latitude" REAL,
    "longitude" REAL,
    "mimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isCombined" BOOLEAN NOT NULL DEFAULT false,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "city" TEXT,
    "country" TEXT,
    "thumbnails" JSONB,
    "userId" TEXT,
    "memoryId" TEXT,
    "momentId" TEXT,
    CONSTRAINT "images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "images_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "images_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_images" ("category", "filename", "hash", "height", "id", "isCombined", "isFavorite", "memoryId", "mimeType", "momentId", "originalName", "path", "size", "thumbnailPath", "width") SELECT "category", "filename", "hash", "height", "id", "isCombined", "isFavorite", "memoryId", "mimeType", "momentId", "originalName", "path", "size", "thumbnailPath", "width" FROM "images";
DROP TABLE "images";
ALTER TABLE "new_images" RENAME TO "images";
CREATE UNIQUE INDEX "images_hash_key" ON "images"("hash");
CREATE TABLE "new_moments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "initiatorId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "memoryId" TEXT,
    "completedAt" DATETIME,
    "capturedBy" TEXT,
    "tempPhotoPath" TEXT,
    CONSTRAINT "moments_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moments_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moments_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_moments" ("capturedBy", "completedAt", "coupleId", "id", "initiatorId", "memoryId", "participantId", "status") SELECT "capturedBy", "completedAt", "coupleId", "id", "initiatorId", "memoryId", "participantId", "status" FROM "moments";
DROP TABLE "moments";
ALTER TABLE "new_moments" RENAME TO "moments";
CREATE INDEX "moments_coupleId_idx" ON "moments"("coupleId");
CREATE INDEX "moments_memoryId_idx" ON "moments"("memoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "videos_posterImageId_key" ON "videos"("posterImageId");
