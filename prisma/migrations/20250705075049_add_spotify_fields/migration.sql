-- AlterTable
ALTER TABLE "users" ADD COLUMN "spotifyAccessToken" TEXT;
ALTER TABLE "users" ADD COLUMN "spotifyRefreshToken" TEXT;
ALTER TABLE "users" ADD COLUMN "spotifyTokenExpiry" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ideas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "memoryId" TEXT,
    CONSTRAINT "ideas_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ideas_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ideas_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ideas" ("authorId", "category", "completedAt", "coupleId", "createdAt", "description", "dueDate", "id", "priority", "status", "title", "updatedAt") SELECT "authorId", "category", "completedAt", "coupleId", "createdAt", "description", "dueDate", "id", "priority", "status", "title", "updatedAt" FROM "ideas";
DROP TABLE "ideas";
ALTER TABLE "new_ideas" RENAME TO "ideas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
