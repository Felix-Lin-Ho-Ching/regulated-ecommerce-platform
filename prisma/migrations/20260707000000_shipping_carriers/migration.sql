CREATE TABLE "ShippingCarrier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "trackingUrlTemplate" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingCarrier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShippingCarrier_code_key" ON "ShippingCarrier"("code");
CREATE INDEX "ShippingCarrier_enabled_sortOrder_idx" ON "ShippingCarrier"("enabled", "sortOrder");
