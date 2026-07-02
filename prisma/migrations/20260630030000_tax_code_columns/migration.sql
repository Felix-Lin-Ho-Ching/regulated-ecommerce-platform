-- Guarantee tax code columns after both Product and ProductCategory tables exist.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxCode" TEXT;
ALTER TABLE "ProductCategory" ADD COLUMN IF NOT EXISTS "taxCode" TEXT;
