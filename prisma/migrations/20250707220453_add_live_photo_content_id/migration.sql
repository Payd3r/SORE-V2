/*
  Warnings:

  - You are about to drop the `videos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `capturedBy` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `tempPhotoPath` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `moments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[livePhotoContentId]` on the table `images` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `initiatorImage` to the `moments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `moments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "videos_posterImageId_key";

-- AlterTable
ALTER TABLE "couples" ADD COLUMN "settings" JSONB;

-- AlterTable
ALTER TABLE "images" ADD COLUMN "livePhotoContentId" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "videos";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT,
    "path" TEXT NOT NULL,
    "mp4Path" TEXT,
    "hlsPlaylist" TEXT,
    "thumbnailPath" TEXT,
    "isSlowMotion" BOOLEAN NOT NULL DEFAULT false,
    "isTimeLapse" BOOLEAN NOT NULL DEFAULT false,
    "duration" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "memoryId" TEXT,
    CONSTRAINT "Video_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Video_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventName" TEXT NOT NULL,
    "userId" TEXT,
    "coupleId" TEXT,
    "properties" JSONB,
    CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AnalyticsEvent_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_moments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "coupleId" TEXT NOT NULL,
    "memoryId" TEXT,
    "initiatorId" TEXT NOT NULL,
    "participantId" TEXT,
    "initiatorImage" TEXT NOT NULL,
    "partnerImage" TEXT,
    "combinedImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PARTNER',
    "expiresAt" DATETIME,
    CONSTRAINT "moments_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moments_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "moments_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_moments" ("coupleId", "id", "initiatorId", "memoryId", "participantId", "status") SELECT "coupleId", "id", "initiatorId", "memoryId", "participantId", "status" FROM "moments";
DROP TABLE "moments";
ALTER TABLE "new_moments" RENAME TO "moments";
CREATE INDEX "moments_coupleId_idx" ON "moments"("coupleId");
CREATE INDEX "moments_memoryId_idx" ON "moments"("memoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Video_imageId_key" ON "Video"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "images_livePhotoContentId_key" ON "images"("livePhotoContentId");
