-- CreateTable
CREATE TABLE "journeys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "coupleId" TEXT NOT NULL,
    CONSTRAINT "journeys_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journey_memories" (
    "journeyId" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    PRIMARY KEY ("journeyId", "memoryId"),
    CONSTRAINT "journey_memories_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "journeys" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "journey_memories_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "journeys_coupleId_idx" ON "journeys"("coupleId");
