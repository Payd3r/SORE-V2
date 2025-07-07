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
    "isLivePhoto" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "city" TEXT,
    "country" TEXT,
    "thumbnails" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "memoryId" TEXT,
    "momentId" TEXT,
    CONSTRAINT "images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "images_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "images_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_images" ("category", "city", "country", "createdAt", "filename", "hash", "height", "id", "isCombined", "isCover", "isFavorite", "latitude", "longitude", "memoryId", "metadata", "mimeType", "momentId", "originalName", "path", "size", "thumbnailPath", "thumbnails", "userId", "width") SELECT "category", "city", "country", "createdAt", "filename", "hash", "height", "id", "isCombined", "isCover", "isFavorite", "latitude", "longitude", "memoryId", "metadata", "mimeType", "momentId", "originalName", "path", "size", "thumbnailPath", "thumbnails", "userId", "width" FROM "images";
DROP TABLE "images";
ALTER TABLE "new_images" RENAME TO "images";
CREATE UNIQUE INDEX "images_hash_key" ON "images"("hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
