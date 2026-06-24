CREATE TYPE "ProductMediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "ProductMedia" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"("id"),
  "type" "ProductMediaType" NOT NULL DEFAULT 'IMAGE',
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "alt" TEXT,
  "title" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
