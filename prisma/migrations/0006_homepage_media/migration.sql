CREATE TABLE "HomepageMedia" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "type" "ProductMediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "alt" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomepageMedia_slot_enabled_sortOrder_idx" ON "HomepageMedia"("slot", "enabled", "sortOrder");
