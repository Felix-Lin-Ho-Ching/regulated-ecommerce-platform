import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();
const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];
const restrictedCategories = ["knuckle_stun_device"] as const;
const templates = [
  ["AGE_18_ATTESTATION_ONLY", "Age 18+ attestation only", [["ATTESTATION", "Buyer attests they are at least 18 years old"]]],
  ["AGE_18_ID_VERIFICATION", "Age 18+ ID verification", [["ID_DOCUMENT", "Government ID confirms buyer is at least 18"]]],
  ["AGE_21_ID_VERIFICATION", "Age 21+ ID verification", [["ID_DOCUMENT", "Government ID confirms buyer is at least 21"]]],
  ["FOID_OR_PERMIT_REQUIRED", "FOID or permit required", [["PERMIT", "FOID or applicable permit document required"]]],
  ["LICENSE_TO_CARRY_OR_FIREARM_ID_REQUIRED", "License to carry or firearm ID required", [["PERMIT", "License to carry or firearm ID required"]]],
  ["LOCAL_LICENSE_BACKGROUND_BRIEFING_REQUIRED", "Local license/background/briefing required", [["LOCAL_LICENSE", "Local license document required"], ["BACKGROUND_BRIEFING", "Background or briefing confirmation required"]]],
  ["SELLER_LICENSE_OR_VOLUME_THRESHOLD_REQUIRED", "Seller license or volume threshold required", [["SELLER_LICENSE", "Seller licensing or volume threshold review required"]]],
  ["BLOCKED", "Blocked", [["BLOCKED", "Purchase is blocked until counsel-approved rules say otherwise"]]],
  ["MANUAL_REVIEW_DEFAULT", "Manual review default", [["MANUAL_REVIEW", "Admin review required because final legal rules are not approved"]]],
] as const;

async function main() {
  const ownerRole = await prisma.adminRole.upsert({
    where: { code: "OWNER" },
    update: {},
    create: { id: "role_owner", code: "OWNER", name: "Owner", description: "Owner-level access for launch gates and approvals." },
  });
  // Local development seed credential only. Replace before production.
  const ownerPasswordHash = hashPassword("linhochingfelix");
  const owner = await prisma.adminUser.upsert({
    where: { email: "linhochingfelix@gmail.com" },
    update: { name: "Felix Lin", passwordHash: ownerPasswordHash, roleId: ownerRole.id, status: "ACTIVE" },
    create: { id: "admin_owner", email: "linhochingfelix@gmail.com", name: "Felix Lin", passwordHash: ownerPasswordHash, roleId: ownerRole.id, status: "ACTIVE" },
  });

  await prisma.storefrontSettings.upsert({
    where: { key: "default" },
    update: {},
    create: {
      key: "default",
      heroEyebrow: "Stun Fry safety essentials",
      heroTitle: "Shop Stun Fry personal safety gear built for everyday confidence.",
      heroSubtitle: "Browse self-defense devices, alarms, visibility gear, and training essentials with clear restricted-product guidance before checkout.",
      primaryCtaLabel: "Shop products",
      primaryCtaLink: "/products",
      secondaryCtaLabel: "Restricted-product policy",
      secondaryCtaLink: "/restricted-products-policy",
      heroImageUrl: "",
      heroPlaceholderKey: "stun-fry-gradient-devices",
      announcementBarText: "",
      featuredSectionEyebrow: "Featured products",
      featuredSectionTitle: "Shop Stun Fry picks",
      trustComplianceTitle: "Shop confidently with clear availability guidance.",
      trustComplianceBody: "Restricted-product availability is previewed before browsing and reviewed again with the shipping address before payment.",
      trustBadgeLabels: ["Fast shipping", "Clear availability", "Secure packaging"],
      eligibilityPopupTitle: "Check restricted-product availability",
      eligibilityPopupBody: "Tell us your age confirmation and shipping destination to preview whether restricted products may be available. This is not final legal approval.",
      eligibilityAgeConfirmationText: "I confirm I am at least 18 years old.",
      eligibilityStateLabel: "Shipping state",
      eligibilityZipLabel: "ZIP code",
      eligibilityAcknowledgementText: "I understand restricted products may be unavailable or require additional verification before payment.",
    },
  });

  for (const tier of [
    ["BASIC", "Basic", 0],
    ["PLUS", "Plus", 500],
    ["PRO", "Pro", 1000],
  ] as const) {
    await prisma.membershipTier.upsert({ where: { code: tier[0] }, update: {}, create: { id: `tier_${tier[0].toLowerCase()}`, code: tier[0], name: tier[1], discountBps: tier[2], description: `${tier[1]} membership tier.` } });
  }

  const products = [
    { id: "prod_alarm", slug: "guardian-rescue-alarm", brand: "Stun Fry", name: "Guardian Rescue Alarm", category: "personal_safety_alarm", description: "Compact audible alarm for emergency signaling without aggressive claims.", sku: "GRA-100", priceCents: 2900, stock: 144, restricted: false, status: "ACTIVE" },
    { id: "prod_training", slug: "securewalk-training-kit", brand: "Stun Fry", name: "SecureWalk Training Kit", category: "training", description: "Scenario cards and safety planning tools for responsible preparedness.", sku: "SWT-200", priceCents: 4900, stock: 61, restricted: false, status: "ACTIVE" },
    { id: "prod_knuckle", slug: "arcguard-knuckle-stun-device", brand: "Stun Fry", name: "ArcGuard Restricted Knuckle Stun Device", category: "knuckle_stun_device", description: "Restricted Stun Fry self-defense device. Availability depends on destination laws and buyer verification.", sku: "AKS-310", priceCents: 11900, stock: 18, restricted: true, status: "RESTRICTED_REVIEW" },
    { id: "prod_light", slug: "civicshield-safety-light", brand: "Stun Fry", name: "CivicShield Safety Light", category: "visibility", description: "High-visibility light and whistle bundle for commuting and travel.", sku: "CSL-400", priceCents: 3900, stock: 92, restricted: false, status: "ACTIVE" },
  ] as const;
  for (const product of products) {
    await prisma.product.upsert({ where: { slug: product.slug }, update: {}, create: { id: product.id, slug: product.slug, brand: product.brand, name: product.name, category: product.category, description: product.description, restricted: product.restricted, status: product.status } });
    const variant = await prisma.productVariant.upsert({ where: { sku: product.sku }, update: {}, create: { id: `variant_${product.sku.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, productId: product.id, sku: product.sku, name: "Default", priceCents: product.priceCents, status: product.status === "RESTRICTED_REVIEW" ? "RESTRICTED_REVIEW" : "ACTIVE" } });
    const inventory = await prisma.inventory.upsert({ where: { variantId: variant.id }, update: { onHand: product.stock }, create: { id: `inventory_${variant.id}`, variantId: variant.id, onHand: product.stock, reserved: product.restricted ? 2 : 0, reorderThreshold: product.restricted ? 5 : 20 } });
    await prisma.inventoryTransaction.create({ data: { id: `seed_tx_${variant.id}`, inventoryId: inventory.id, type: "STOCK_IN", quantity: product.stock, reason: "Phase 1 seed stock; reason captured for auditability." } }).catch(() => undefined);
  }
  for (const feature of [
    ["contact_prongs", "Contact prongs", "Integrated restricted feature"],
    ["stun_capability", "Stun capability", "Electrical defense function"],
    ["knuckle_form_factor", "Knuckle form factor", "Knuckle-style grip profile"],
  ] as const) {
    await prisma.productFeature.upsert({ where: { productId_code: { productId: "prod_knuckle", code: feature[0] } }, update: {}, create: { productId: "prod_knuckle", code: feature[0], label: feature[1], value: feature[2], restrictedRelevant: true } });
    await prisma.productFeatureRestrictionRule.create({ data: { id: `feature_rule_${feature[0]}`, productId: "prod_knuckle", featureCode: feature[0], outcome: "MANUAL_REVIEW", reviewStatus: "MANUAL_REVIEW", reason: "Default manual review; not attorney-reviewed or provider-approved." } }).catch(() => undefined);
  }

  for (const [code, name, requirements] of templates) {
    const template = await prisma.verificationTemplate.upsert({ where: { code }, update: {}, create: { id: `vt_${code.toLowerCase()}`, code, name, description: `${name}; Phase 1 workflow template only.` } });
    for (const [index, req] of requirements.entries()) {
      await prisma.verificationRequirement.create({ data: { id: `req_${code.toLowerCase()}_${index}`, templateId: template.id, type: req[0], label: req[1], sortOrder: index } }).catch(() => undefined);
    }
  }

  const manualTemplate = await prisma.verificationTemplate.findUniqueOrThrow({ where: { code: "MANUAL_REVIEW_DEFAULT" } });
  for (const state of states) {
    for (const category of restrictedCategories) {
      await prisma.stateRestrictionRule.upsert({ where: { stateCode_productCategory_productId: { stateCode: state, productCategory: category, productId: "prod_knuckle" } }, update: {}, create: { id: `rule_${state}_${category}`, stateCode: state, productCategory: category, productId: "prod_knuckle", outcome: "MANUAL_REVIEW", reviewStatus: "MANUAL_REVIEW", reason: "Default manual_review until final counsel-approved rules are added." } });
      await prisma.stateVerificationRule.upsert({ where: { stateCode_productCategory: { stateCode: state, productCategory: category } }, update: {}, create: { id: `vrule_${state}_${category}`, stateCode: state, productCategory: category, templateId: manualTemplate.id, reviewStatus: "MANUAL_REVIEW", reason: "Default verification review; automatic-first but exceptions stay in admin review." } });
    }
  }

  const ageIdTemplate = await prisma.verificationTemplate.findUniqueOrThrow({ where: { code: "AGE_18_ID_VERIFICATION" } });
  const blockedTemplate = await prisma.verificationTemplate.findUniqueOrThrow({ where: { code: "BLOCKED" } });
  const permitTemplate = await prisma.verificationTemplate.findUniqueOrThrow({ where: { code: "FOID_OR_PERMIT_REQUIRED" } });
  const reviewedExamples = [
    { stateCode: "CA", outcome: "MANUAL_REVIEW", templateId: ageIdTemplate.id, reason: "Example: CA requires ID verification workflow review; not final legal advice." },
    { stateCode: "HI", outcome: "BLOCK", templateId: blockedTemplate.id, reason: "Example: HI blocked until counsel-approved rules say otherwise; not final legal advice." },
    { stateCode: "IL", outcome: "MANUAL_REVIEW", templateId: permitTemplate.id, reason: "Example: IL requires permit/FOID-style manual review; not final legal advice." },
  ] as const;
  for (const example of reviewedExamples) {
    await prisma.stateRestrictionRule.upsert({
      where: { stateCode_productCategory_productId: { stateCode: example.stateCode, productCategory: "knuckle_stun_device", productId: "prod_knuckle" } },
      update: { outcome: example.outcome, reviewStatus: "COUNSEL_REVIEW_REQUIRED", reason: example.reason },
      create: { stateCode: example.stateCode, productCategory: "knuckle_stun_device", productId: "prod_knuckle", outcome: example.outcome, reviewStatus: "COUNSEL_REVIEW_REQUIRED", reason: example.reason },
    });
    await prisma.stateVerificationRule.upsert({
      where: { stateCode_productCategory: { stateCode: example.stateCode, productCategory: "knuckle_stun_device" } },
      update: { templateId: example.templateId, reviewStatus: "COUNSEL_REVIEW_REQUIRED", reason: example.reason },
      create: { stateCode: example.stateCode, productCategory: "knuckle_stun_device", templateId: example.templateId, reviewStatus: "COUNSEL_REVIEW_REQUIRED", reason: example.reason },
    });
  }


  await prisma.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { id: "coupon_welcome10", code: "WELCOME10", description: "10% launch welcome coupon for development/testing.", percentOff: 10, status: "ACTIVE" } });
  for (const gate of ["LIVE_CHECKOUT", "LIVE_PAYMENT", "LIVE_FULFILLMENT", "RULE_COVERAGE", "LEGAL_APPROVAL"] as const) {
    await prisma.launchGate.upsert({ where: { code: gate }, update: { status: "DISABLED", liveCheckoutEnabled: false, livePaymentEnabled: false, liveFulfillmentEnabled: false }, create: { id: `gate_${gate.toLowerCase()}`, code: gate, name: gate.replaceAll("_", " ").toLowerCase(), status: "DISABLED", ownerOnly: true, reason: "Disabled by default for safe local development.", liveCheckoutEnabled: false, livePaymentEnabled: false, liveFulfillmentEnabled: false } });
  }
  await prisma.paymentAttempt.create({ data: { id: "pay_mock_dev_seed", order: { create: { id: "order_seed_payment", orderNumber: "DEV-PAYMENT-SEED", status: "READY_FOR_PAYMENT", totalCents: 0, liveCheckoutEnabled: false, liveFulfillmentEnabled: false } }, provider: "MOCK", providerStatus: "DEVELOPMENT_APPROVED", status: "APPROVED", amountCents: 0, livePaymentEnabled: false, providerReference: "mock-approved-development-only" } }).catch(() => undefined);
  await prisma.paymentAttempt.create({ data: { id: "pay_nmi_manual_review_seed", order: { connect: { id: "order_seed_payment" } }, provider: "NMI", providerStatus: "MANUAL_REVIEW", status: "MANUAL_REVIEW", amountCents: 0, livePaymentEnabled: false, providerReference: "nmi-manual-review-until-approved" } }).catch(() => undefined);
  await prisma.auditLog.create({ data: { actorAdminId: owner.id, action: "SEED", entityType: "database", entityId: "phase_2b", note: "Seeded Phase 2B storefront content and owner-admin examples on top of Phase 1 foundation with manual-review legal defaults and disabled launch gates." } });
}

main().finally(async () => prisma.$disconnect());
