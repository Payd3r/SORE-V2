-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" DATETIME,
    "password" TEXT,
    "googleId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "spotifyAccessToken" TEXT,
    "spotifyRefreshToken" TEXT,
    "spotifyTokenExpiry" DATETIME,
    "pushSubscription" TEXT,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "coupleId" TEXT,
    CONSTRAINT "users_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("coupleId", "createdAt", "email", "emailVerified", "googleId", "id", "image", "name", "password", "role", "spotifyAccessToken", "spotifyRefreshToken", "spotifyTokenExpiry", "updatedAt") SELECT "coupleId", "createdAt", "email", "emailVerified", "googleId", "id", "image", "name", "password", "role", "spotifyAccessToken", "spotifyRefreshToken", "spotifyTokenExpiry", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_coupleId_idx" ON "users"("coupleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
