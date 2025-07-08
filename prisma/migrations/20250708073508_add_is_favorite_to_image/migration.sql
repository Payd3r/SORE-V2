/*
  Warnings:

  - You are about to drop the `AnalyticsEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `hlsPlaylist` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `isSlowMotion` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `isTimeLapse` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `mp4Path` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailPath` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Video` table. All the data in the column will be lost.
  - You are about to alter the column `duration` on the `Video` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to drop the column `completedAt` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `reward` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `challenges` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `ideas` table. All the data in the column will be lost.
  - You are about to drop the column `combinedImage` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `initiatorImage` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `partnerImage` on the `moments` table. All the data in the column will be lost.
  - You are about to drop the column `deepLink` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `relatedId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `filename` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `challenges` table without a default value. This is not possible if the table is not empty.
  - Made the column `category` on table `challenges` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `challenges` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expiresAt` on table `moments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coupleId` on table `notifications` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "images_livePhotoContentId_key";

-- DropIndex
DROP INDEX "images_hash_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AnalyticsEvent";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "images";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL,
    "category" TEXT,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "livePhotoPath" TEXT,
    "livePhotoContentId" TEXT,
    "momentId" TEXT,
    "memoryId" TEXT,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Image_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Image_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Image_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "analytics_events_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "livePhotoContentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memoryId" TEXT,
    CONSTRAINT "Video_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("createdAt", "duration", "id", "livePhotoContentId", "memoryId", "path") SELECT "createdAt", "duration", "id", "livePhotoContentId", "memoryId", "path" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_livePhotoContentId_key" ON "Video"("livePhotoContentId");
CREATE TABLE "new_challenges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "coupleId" TEXT NOT NULL,
    CONSTRAINT "challenges_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_challenges" ("category", "coupleId", "createdAt", "description", "id", "title", "updatedAt") SELECT "category", "coupleId", "createdAt", "description", "id", "title", "updatedAt" FROM "challenges";
DROP TABLE "challenges";
ALTER TABLE "new_challenges" RENAME TO "challenges";
CREATE TABLE "new_ideas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "memoryId" TEXT,
    CONSTRAINT "ideas_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ideas_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ideas_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ideas" ("authorId", "category", "coupleId", "createdAt", "description", "dueDate", "id", "memoryId", "priority", "status", "title", "updatedAt") SELECT "authorId", "category", "coupleId", "createdAt", "description", "dueDate", "id", "memoryId", "priority", "status", "title", "updatedAt" FROM "ideas";
DROP TABLE "ideas";
ALTER TABLE "new_ideas" RENAME TO "ideas";
CREATE INDEX "ideas_coupleId_idx" ON "ideas"("coupleId");
CREATE INDEX "ideas_status_idx" ON "ideas"("status");
CREATE TABLE "new_moments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiatorId" TEXT NOT NULL,
    "participantId" TEXT,
    "coupleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "initiatorImageId" TEXT,
    "participantImageId" TEXT,
    "combinedImageId" TEXT,
    "memoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "moments_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "moments_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moments_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_moments" ("coupleId", "createdAt", "expiresAt", "id", "initiatorId", "memoryId", "participantId", "status", "updatedAt") SELECT "coupleId", "createdAt", "expiresAt", "id", "initiatorId", "memoryId", "participantId", "status", "updatedAt" FROM "moments";
DROP TABLE "moments";
ALTER TABLE "new_moments" RENAME TO "moments";
CREATE UNIQUE INDEX "moments_memoryId_key" ON "moments"("memoryId");
CREATE INDEX "moments_coupleId_status_idx" ON "moments"("coupleId", "status");
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "link" TEXT,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifications_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("coupleId", "createdAt", "id", "message", "type", "userId") SELECT "coupleId", "createdAt", "id", "message", "type", "userId" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Image_livePhotoContentId_key" ON "Image"("livePhotoContentId");

-- CreateIndex
CREATE INDEX "analytics_events_type_idx" ON "analytics_events"("type");

-- CreateIndex
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");
