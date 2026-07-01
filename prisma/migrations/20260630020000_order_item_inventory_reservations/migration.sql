-- Link inventory reservations to their optional order item without dropping existing reservations.
-- Any legacy reservation pointing at a missing order item is preserved and detached so the FK can be added safely.
UPDATE "InventoryReservation" reservation
SET "orderItemId" = NULL
WHERE reservation."orderItemId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "OrderItem" item
    WHERE item."id" = reservation."orderItemId"
  );

ALTER TABLE "InventoryReservation"
ADD CONSTRAINT "InventoryReservation_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "InventoryReservation_orderItemId_status_idx"
ON "InventoryReservation"("orderItemId", "status");
