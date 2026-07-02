-- Guarantee tax code columns after both Product and ProductCategory tables exist.
ALTER TABLE IF EXISTS "Product" ADD COLUMN IF NOT EXISTS "taxCode" TEXT;
ALTER TABLE IF EXISTS "ProductCategory" ADD COLUMN IF NOT EXISTS "taxCode" TEXT;
