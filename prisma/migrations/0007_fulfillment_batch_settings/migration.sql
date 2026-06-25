CREATE TYPE "FulfillmentStatus" AS ENUM ('READY_TO_SHIP', 'PICKING', 'SHIPPED', 'BLOCKED');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'FULFILLMENT_SETTINGS_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'FULFILLMENT_BATCH_CLAIMED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ORDER_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BATCH_SHIPMENT_CONFIRMED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SHIPMENT_CONFIRMED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SHIPMENT_SKIPPED_ALREADY_SHIPPED';

ALTER TABLE "Order" ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'READY_TO_SHIP',
ADD COLUMN "assignedFulfillmentUserId" TEXT,
ADD COLUMN "assignedAt" TIMESTAMP(3);

ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedFulfillmentUserId_fkey" FOREIGN KEY ("assignedFulfillmentUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Order_fulfillmentStatus_assignedFulfillmentUserId_createdAt_idx" ON "Order"("fulfillmentStatus", "assignedFulfillmentUserId", "createdAt");

CREATE TABLE "FulfillmentSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "defaultBatchSize" INTEGER NOT NULL DEFAULT 25,
  "maxBatchSize" INTEGER NOT NULL DEFAULT 100,
  "allowCustomClaim" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FulfillmentSettings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "FulfillmentSettings" ("id", "defaultBatchSize", "maxBatchSize", "allowCustomClaim", "updatedAt") VALUES ('default', 25, 100, false, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
