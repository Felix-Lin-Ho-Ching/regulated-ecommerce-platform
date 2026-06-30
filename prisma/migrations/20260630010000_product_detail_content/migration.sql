CREATE TABLE "ProductContentSection" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sectionKey" TEXT NOT NULL,
  "eyebrow" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "imageUrl" TEXT,
  "videoUrl" TEXT,
  "ctaLabel" TEXT,
  "ctaHref" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ProductContentSection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductIncludedItem" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ProductIncludedItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductSpec" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "group" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ProductSpec_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProductFAQ" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ProductFAQ_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductContentSection_productId_sectionKey_status_sortOrder_idx" ON "ProductContentSection"("productId", "sectionKey", "status", "sortOrder");
CREATE INDEX "ProductIncludedItem_productId_status_sortOrder_idx" ON "ProductIncludedItem"("productId", "status", "sortOrder");
CREATE INDEX "ProductSpec_productId_status_sortOrder_idx" ON "ProductSpec"("productId", "status", "sortOrder");
CREATE INDEX "ProductFAQ_productId_status_sortOrder_idx" ON "ProductFAQ"("productId", "status", "sortOrder");
ALTER TABLE "ProductContentSection" ADD CONSTRAINT "ProductContentSection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductIncludedItem" ADD CONSTRAINT "ProductIncludedItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSpec" ADD CONSTRAINT "ProductSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductFAQ" ADD CONSTRAINT "ProductFAQ_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
