-- Refactor storefront categories from ProductCategory enum to admin-managed ProductCategory rows.
CREATE TABLE "ProductCategory" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

INSERT INTO "ProductCategory" ("id", "slug", "name", "sortOrder") VALUES
  ('cat_stun_guns', 'stun-guns', 'Stun Guns', 10),
  ('cat_personal_safety_alarms', 'personal-safety-alarms', 'Personal Safety Alarms', 20),
  ('cat_training', 'training', 'Training', 30),
  ('cat_visibility', 'visibility', 'Visibility', 40)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Product" ADD COLUMN "restrictedClass" TEXT;

UPDATE "Product" SET
  "categoryId" = CASE "category"::text
    WHEN 'knuckle_stun_device' THEN (SELECT "id" FROM "ProductCategory" WHERE "slug" = 'stun-guns')
    WHEN 'personal_safety_alarm' THEN (SELECT "id" FROM "ProductCategory" WHERE "slug" = 'personal-safety-alarms')
    WHEN 'training' THEN (SELECT "id" FROM "ProductCategory" WHERE "slug" = 'training')
    WHEN 'visibility' THEN (SELECT "id" FROM "ProductCategory" WHERE "slug" = 'visibility')
    ELSE NULL
  END,
  "restrictedClass" = CASE WHEN "category"::text = 'knuckle_stun_device' THEN 'STUN_GUN' ELSE NULL END;

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

ALTER TABLE "StateRestrictionRule" ADD COLUMN "restrictedClass" TEXT;
UPDATE "StateRestrictionRule" SET "restrictedClass" = CASE WHEN "productCategory"::text = 'knuckle_stun_device' THEN 'STUN_GUN' ELSE "productCategory"::text END;
ALTER TABLE "StateRestrictionRule" ALTER COLUMN "restrictedClass" SET NOT NULL;
DROP INDEX IF EXISTS "StateRestrictionRule_state_category_idx";
ALTER TABLE "StateRestrictionRule" DROP CONSTRAINT IF EXISTS "StateRestrictionRule_stateCode_productCategory_productId_key";
ALTER TABLE "StateRestrictionRule" ADD CONSTRAINT "StateRestrictionRule_stateCode_restrictedClass_productId_key" UNIQUE ("stateCode", "restrictedClass", "productId");
CREATE INDEX "StateRestrictionRule_state_restrictedClass_idx" ON "StateRestrictionRule"("stateCode", "restrictedClass");
ALTER TABLE "StateRestrictionRule" DROP COLUMN "productCategory";

ALTER TABLE "LocalRestrictionRule" ADD COLUMN "restrictedClass" TEXT;
UPDATE "LocalRestrictionRule" SET "restrictedClass" = CASE WHEN "productCategory"::text = 'knuckle_stun_device' THEN 'STUN_GUN' ELSE "productCategory"::text END;
ALTER TABLE "LocalRestrictionRule" ALTER COLUMN "restrictedClass" SET NOT NULL;
ALTER TABLE "LocalRestrictionRule" DROP COLUMN "productCategory";

ALTER TABLE "StateVerificationRule" ADD COLUMN "restrictedClass" TEXT;
UPDATE "StateVerificationRule" SET "restrictedClass" = CASE WHEN "productCategory"::text = 'knuckle_stun_device' THEN 'STUN_GUN' ELSE "productCategory"::text END;
ALTER TABLE "StateVerificationRule" ALTER COLUMN "restrictedClass" SET NOT NULL;
ALTER TABLE "StateVerificationRule" DROP CONSTRAINT IF EXISTS "StateVerificationRule_stateCode_productCategory_key";
ALTER TABLE "StateVerificationRule" ADD CONSTRAINT "StateVerificationRule_stateCode_restrictedClass_key" UNIQUE ("stateCode", "restrictedClass");
ALTER TABLE "StateVerificationRule" DROP COLUMN "productCategory";

ALTER TABLE "LocalVerificationRule" ADD COLUMN "restrictedClass" TEXT;
UPDATE "LocalVerificationRule" SET "restrictedClass" = CASE WHEN "productCategory"::text = 'knuckle_stun_device' THEN 'STUN_GUN' ELSE "productCategory"::text END;
ALTER TABLE "LocalVerificationRule" ALTER COLUMN "restrictedClass" SET NOT NULL;
ALTER TABLE "LocalVerificationRule" DROP COLUMN "productCategory";

ALTER TABLE "BuyerVerificationRecord" ADD COLUMN "restrictedClass" TEXT;
UPDATE "BuyerVerificationRecord" SET "restrictedClass" = CASE WHEN "productCategory"::text = 'knuckle_stun_device' THEN 'STUN_GUN' ELSE "productCategory"::text END;
ALTER TABLE "BuyerVerificationRecord" DROP COLUMN "productCategory";

DROP INDEX IF EXISTS "Product_category_status_idx";
ALTER TABLE "Product" DROP COLUMN "category";
DROP TYPE IF EXISTS "ProductCategory";
