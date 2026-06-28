ALTER TABLE "StateRestrictionRule" ADD COLUMN IF NOT EXISTS "legalSourceNote" TEXT NOT NULL DEFAULT '';

UPDATE "StateRestrictionRule" SET "outcome" = 'BLOCK' WHERE "outcome" IN ('MANUAL_REVIEW', 'DOCUMENTS_REQUIRED');
UPDATE "LocalRestrictionRule" SET "outcome" = 'BLOCK' WHERE "outcome" IN ('MANUAL_REVIEW', 'DOCUMENTS_REQUIRED');
UPDATE "ProductFeatureRestrictionRule" SET "outcome" = 'BLOCK' WHERE "outcome" IN ('MANUAL_REVIEW', 'DOCUMENTS_REQUIRED');
DO $$
BEGIN
  IF to_regclass('public."VerificationDecision"') IS NOT NULL THEN
    UPDATE "VerificationDecision" SET "outcome" = 'BLOCK' WHERE "outcome" IN ('MANUAL_REVIEW', 'DOCUMENTS_REQUIRED');
  END IF;
END $$;

ALTER TABLE "StateRestrictionRule" ALTER COLUMN "outcome" DROP DEFAULT;
ALTER TABLE "LocalRestrictionRule" ALTER COLUMN "outcome" DROP DEFAULT;
ALTER TABLE "ProductFeatureRestrictionRule" ALTER COLUMN "outcome" DROP DEFAULT;
ALTER TABLE IF EXISTS "VerificationDecision" ALTER COLUMN "outcome" DROP DEFAULT;

ALTER TYPE "RuleOutcome" RENAME TO "RuleOutcome_old";
CREATE TYPE "RuleOutcome" AS ENUM ('ALLOW', 'BLOCK');
ALTER TABLE "StateRestrictionRule" ALTER COLUMN "outcome" TYPE "RuleOutcome" USING "outcome"::text::"RuleOutcome";
ALTER TABLE "LocalRestrictionRule" ALTER COLUMN "outcome" TYPE "RuleOutcome" USING "outcome"::text::"RuleOutcome";
ALTER TABLE "ProductFeatureRestrictionRule" ALTER COLUMN "outcome" TYPE "RuleOutcome" USING "outcome"::text::"RuleOutcome";
ALTER TABLE IF EXISTS "VerificationDecision" ALTER COLUMN "outcome" TYPE "RuleOutcome" USING "outcome"::text::"RuleOutcome";
DROP TYPE "RuleOutcome_old";

ALTER TABLE "StateRestrictionRule" ALTER COLUMN "outcome" SET DEFAULT 'BLOCK';
ALTER TABLE "StateRestrictionRule" ALTER COLUMN "reviewStatus" SET DEFAULT 'COUNSEL_REVIEW_REQUIRED';
ALTER TABLE "LocalRestrictionRule" ALTER COLUMN "outcome" SET DEFAULT 'BLOCK';
ALTER TABLE "LocalRestrictionRule" ALTER COLUMN "reviewStatus" SET DEFAULT 'COUNSEL_REVIEW_REQUIRED';
ALTER TABLE "ProductFeatureRestrictionRule" ALTER COLUMN "outcome" SET DEFAULT 'BLOCK';
ALTER TABLE "ProductFeatureRestrictionRule" ALTER COLUMN "reviewStatus" SET DEFAULT 'COUNSEL_REVIEW_REQUIRED';
