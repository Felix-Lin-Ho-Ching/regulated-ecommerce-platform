-- Add tax provider fields to tables that exist at this point in the migration history.
-- ProductCategory is still a legacy enum until 20260630000000_category_table_restricted_class,
-- so its taxCode column is added in a later migration after the table is created.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "taxProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "taxCalculationId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "taxSnapshot" JSONB;
