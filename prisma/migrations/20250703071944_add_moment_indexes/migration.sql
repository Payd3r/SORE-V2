-- CreateIndex
CREATE INDEX "moments_memoryId_idx" ON "moments"("memoryId");

-- CreateIndex
CREATE INDEX "moments_coupleId_idx" ON "moments"("coupleId");

-- CreateIndex
CREATE INDEX "moments_status_idx" ON "moments"("status");

-- CreateIndex
CREATE INDEX "moments_createdAt_idx" ON "moments"("createdAt");
