import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();
const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];
const restrictedClasses = ["STUN_GUN"] as const;
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
  await prisma.adminRole.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: { id: "role_admin", code: "ADMIN", name: "Admin", description: "Admin access for operations and employee management." },
  });
  const fulfillmentRole = await prisma.adminRole.upsert({
    where: { code: "FULFILLMENT" },
    update: {},
    create: { id: "role_fulfillment", code: "FULFILLMENT", name: "Fulfillment", description: "Shipping dashboard and shipment action access." },
  });
  // Local development seed credential only. Replace before production.
  const ownerPasswordHash = hashPassword("linhochingfelix");
  const owner = await prisma.adminUser.upsert({
    where: { email: "linhochingfelix@gmail.com" },
    update: { name: "Felix Lin", passwordHash: ownerPasswordHash, roleId: ownerRole.id, status: "ACTIVE" },
    create: { id: "admin_owner", email: "linhochingfelix@gmail.com", name: "Felix Lin", passwordHash: ownerPasswordHash, roleId: ownerRole.id, status: "ACTIVE" },
  });
  const shippingPasswordHash = hashPassword("shipping123");
  await prisma.adminUser.upsert({
    where: { email: "shipping@example.com" },
    update: { name: "Shipping Employee", passwordHash: shippingPasswordHash, roleId: fulfillmentRole.id, status: "ACTIVE" },
    create: { id: "admin_fulfillment", email: "shipping@example.com", name: "Shipping Employee", passwordHash: shippingPasswordHash, roleId: fulfillmentRole.id, status: "ACTIVE" },
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


  const homepageSlides = [
    {
      id: "homepage_hero_slide_1",
      url: "https://placehold.co/1800x1000/123a42/f8f6f1?text=Everyday+Preparedness",
      thumbnailUrl: "https://placehold.co/1800x1000/123a42/f8f6f1?text=Everyday+Preparedness",
      title: "Prepared when the walk home feels different.",
      subtitle: "Compact self-defense tools for people who want one extra layer of protection, without overcomplicating it.",
      ctaLabel: "Shop devices",
      ctaHref: "/products",
      alt: "Responsible ownership | Secure order handling | Verified at checkout",
      sortOrder: 0,
    },
    {
      id: "homepage_hero_slide_2",
      url: "https://placehold.co/1800x1000/f0ede6/164e52?text=Compact+Everyday+Tools",
      thumbnailUrl: "https://placehold.co/1800x1000/f0ede6/164e52?text=Compact+Everyday+Tools",
      title: "Simple tools for everyday preparedness.",
      subtitle: "Designed for people who want something compact, accessible, and easy to keep nearby.",
      ctaLabel: "View products",
      ctaHref: "/products",
      alt: "Compact carry | Clear product details | Stock tracked",
      sortOrder: 1,
    },
    {
      id: "homepage_hero_slide_3",
      url: "https://placehold.co/1800x1000/0f172a/f8f6f1?text=Responsible+Ordering",
      thumbnailUrl: "https://placehold.co/1800x1000/0f172a/f8f6f1?text=Responsible+Ordering",
      title: "Ships only where allowed.",
      subtitle: "We check shipping eligibility during checkout so restricted items are handled responsibly.",
      ctaLabel: "How ordering works",
      ctaHref: "#how-ordering-works",
      alt: "Location checked | Restricted item review | Order request mode",
      sortOrder: 2,
    },
  ];

  for (const slide of homepageSlides) {
    await prisma.homepageMedia.upsert({
      where: { id: slide.id },
      update: { slot: "hero-slide", type: "IMAGE", enabled: true, ...slide },
      create: { slot: "hero-slide", type: "IMAGE", enabled: true, ...slide },
    });
  }

  for (const tier of [
    ["BASIC", "Basic", 0],
    ["PLUS", "Plus", 500],
    ["PRO", "Pro", 1000],
  ] as const) {
    await prisma.membershipTier.upsert({ where: { code: tier[0] }, update: {}, create: { id: `tier_${tier[0].toLowerCase()}`, code: tier[0], name: tier[1], discountBps: tier[2], description: `${tier[1]} membership tier.` } });
  }


  const categoryRows = [
    { id: "cat_stun_guns", slug: "stun-guns", name: "Stun Guns", sortOrder: 10 },
    { id: "cat_personal_safety_alarms", slug: "personal-safety-alarms", name: "Personal Safety Alarms", sortOrder: 20 },
    { id: "cat_training", slug: "training", name: "Training", sortOrder: 30 },
    { id: "cat_visibility", slug: "visibility", name: "Visibility", sortOrder: 40 },
  ] as const;
  for (const category of categoryRows) {
    await prisma.productCategory.upsert({ where: { slug: category.slug }, update: { name: category.name, sortOrder: category.sortOrder, status: "ACTIVE", archivedAt: null }, create: { ...category, status: "ACTIVE" } });
  }
  const categoryBySlug = Object.fromEntries((await prisma.productCategory.findMany()).map((category: { slug: string; id: string }) => [category.slug, category.id]));

  const products = [
    { id: "prod_alarm", slug: "guardian-rescue-alarm", brand: "Stun Fry", name: "Guardian Rescue Alarm", categorySlug: "personal-safety-alarms", description: "Compact audible alarm for emergency signaling without aggressive claims.", sku: "GRA-100", priceCents: 2900, stock: 144, restricted: false, restrictedClass: null, status: "ACTIVE" },
    { id: "prod_training", slug: "securewalk-training-kit", brand: "Stun Fry", name: "SecureWalk Training Kit", categorySlug: "training", description: "Scenario cards and safety planning tools for responsible preparedness.", sku: "SWT-200", priceCents: 4900, stock: 61, restricted: false, restrictedClass: null, status: "ACTIVE" },
    { id: "prod_knuckle", slug: "arcguard-knuckle-stun-device", brand: "Stun Fry", name: "ArcGuard Restricted Knuckle Stun Device", categorySlug: "stun-guns", description: "Restricted Stun Fry self-defense device. Availability depends on destination laws and buyer verification.", sku: "AKS-310", priceCents: 11900, stock: 18, restricted: true, restrictedClass: "STUN_GUN", status: "RESTRICTED_REVIEW" },
    { id: "prod_light", slug: "civicshield-safety-light", brand: "Stun Fry", name: "CivicShield Safety Light", categorySlug: "visibility", description: "High-visibility light and whistle bundle for commuting and travel.", sku: "CSL-400", priceCents: 3900, stock: 92, restricted: false, restrictedClass: null, status: "ACTIVE" },
  ] as const;
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        brand: product.brand,
        name: product.name,
        categoryId: categoryBySlug[product.categorySlug],
        restrictedClass: product.restrictedClass,
        description: product.description,
        restricted: product.restricted,
        status: product.status,
        archivedAt: null,
      },
      create: { id: product.id, slug: product.slug, brand: product.brand, name: product.name, categoryId: categoryBySlug[product.categorySlug],
        restrictedClass: product.restrictedClass, description: product.description, restricted: product.restricted, status: product.status, archivedAt: null },
    });
    const variantStatus = product.status === "RESTRICTED_REVIEW" ? "RESTRICTED_REVIEW" : "ACTIVE";
    const variant = await prisma.productVariant.upsert({
      where: { sku: product.sku },
      update: { productId: product.id, name: "Default", priceCents: product.priceCents, status: variantStatus, archivedAt: null },
      create: { id: `variant_${product.sku.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, productId: product.id, sku: product.sku, name: "Default", priceCents: product.priceCents, status: variantStatus, archivedAt: null },
    });
    const inventory = await prisma.inventory.upsert({ where: { variantId: variant.id }, update: { onHand: product.stock }, create: { id: `inventory_${variant.id}`, variantId: variant.id, onHand: product.stock, reserved: product.restricted ? 2 : 0, reorderThreshold: product.restricted ? 5 : 20 } });
    await prisma.inventoryTransaction.create({ data: { id: `seed_tx_${variant.id}`, inventoryId: inventory.id, type: "STOCK_IN", quantity: product.stock, reason: "Phase 1 seed stock; reason captured for auditability." } }).catch(() => undefined);
  }

  const productMedia = [
    { id: "media_alarm_image", productId: "prod_alarm", type: "IMAGE", url: "https://placehold.co/960x720/0f766e/ffffff?text=Guardian+Alarm", alt: "Guardian Rescue Alarm product image", title: "Guardian Rescue Alarm", sortOrder: 0 },
    { id: "media_training_image", productId: "prod_training", type: "IMAGE", url: "https://placehold.co/960x720/134e4a/ffffff?text=Training+Kit", alt: "SecureWalk Training Kit product image", title: "SecureWalk Training Kit", sortOrder: 0 },
    { id: "media_knuckle_image", productId: "prod_knuckle", type: "IMAGE", url: "https://placehold.co/960x720/1e293b/fbbf24?text=ArcGuard", alt: "ArcGuard restricted device product image", title: "ArcGuard product image", sortOrder: 0 },
    { id: "media_knuckle_video", productId: "prod_knuckle", type: "VIDEO", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", thumbnailUrl: "https://placehold.co/960x720/1e293b/fbbf24?text=ArcGuard+Demo", alt: "ArcGuard safe placeholder demo video", title: "Safe placeholder demo video", sortOrder: 1 },
    { id: "media_light_image", productId: "prod_light", type: "IMAGE", url: "https://placehold.co/960x720/f59e0b/111827?text=Safety+Light", alt: "CivicShield Safety Light product image", title: "CivicShield Safety Light", sortOrder: 0 },
  ] as const;

  for (const media of productMedia) {
    await prisma.productMedia.upsert({
      where: { id: media.id },
      update: { productId: media.productId, type: media.type, url: media.url, thumbnailUrl: "thumbnailUrl" in media ? media.thumbnailUrl : null, alt: media.alt, title: media.title, sortOrder: media.sortOrder },
      create: { id: media.id, productId: media.productId, type: media.type, url: media.url, thumbnailUrl: "thumbnailUrl" in media ? media.thumbnailUrl : null, alt: media.alt, title: media.title, sortOrder: media.sortOrder },
    });
  }
  const detailSections = [
    ["section_knuckle_overview", "overview", "Overview", "Built for regulated self-defense retail workflows, this Stun Fry placeholder product emphasizes responsible ownership, clear storage, and destination-based checkout review."],
    ["section_knuckle_design", "features_design", "Design details", "A compact form factor, status indicator, and textured grip are presented as neutral product attributes without aggressive claims."],
    ["section_knuckle_included", "whats_included", "What’s included", "Package contents are maintained as structured records so owners can update the list without code changes."],
    ["section_knuckle_specs", "specs", "Specifications", "Structured specifications are editable by authorized product administrators."],
    ["section_knuckle_state", "state_requirements", "State requirements", "Availability depends on shipping destination. Checkout performs final destination verification before payment capture or fulfillment."],
    ["section_knuckle_faq", "faq", "Frequently asked questions", "Answers are maintained by store administrators and should be reviewed before production launch."],
  ] as const;
  for (const [id, sectionKey, title, body] of detailSections) {
    await prisma.productContentSection.upsert({ where: { id }, update: { sectionKey, title, body, status: "ACTIVE", archivedAt: null }, create: { id, productId: "prod_knuckle", sectionKey, title, body, sortOrder: detailSections.findIndex((row) => row[0] === id), status: "ACTIVE" } });
  }
  for (const [index, label, description, quantity] of [
    [0, "ArcGuard regulated device", "Primary catalog item for destination-reviewed orders.", 1],
    [1, "Charging cable", "Standard charging accessory for the device.", 1],
    [2, "Owner safety card", "Quick-start storage, handling, and compliance reminder card.", 1],
  ] as const) await prisma.productIncludedItem.upsert({ where: { id: `included_knuckle_${index}` }, update: { label, description, quantity, sortOrder: index, status: "ACTIVE", archivedAt: null }, create: { id: `included_knuckle_${index}`, productId: "prod_knuckle", label, description, quantity, sortOrder: index, status: "ACTIVE" } });
  for (const [index, group, label, value] of [
    [0, "Product", "Brand", "Stun Fry"],
    [1, "Product", "SKU", "AKS-310"],
    [2, "Compliance", "Restricted class", "STUN_GUN"],
    [3, "Fulfillment", "Availability", "Destination verification required"],
  ] as const) await prisma.productSpec.upsert({ where: { id: `spec_knuckle_${index}` }, update: { group, label, value, sortOrder: index, status: "ACTIVE", archivedAt: null }, create: { id: `spec_knuckle_${index}`, productId: "prod_knuckle", group, label, value, sortOrder: index, status: "ACTIVE" } });
  for (const [index, question, answer] of [
    [0, "Can this ship everywhere?", "No. Availability depends on the shipping destination, configured restricted-class rules, and checkout verification."],
    [1, "When is eligibility checked?", "The product page provides a preview link, but checkout remains the final authority before an order proceeds."],
    [2, "Who can edit this information?", "Only owner or admin users can edit product media and detail content."],
  ] as const) await prisma.productFAQ.upsert({ where: { id: `faq_knuckle_${index}` }, update: { question, answer, sortOrder: index, status: "ACTIVE", archivedAt: null }, create: { id: `faq_knuckle_${index}`, productId: "prod_knuckle", question, answer, sortOrder: index, status: "ACTIVE" } });

  for (const feature of [
    ["contact_prongs", "Contact prongs", "Integrated restricted feature"],
    ["stun_capability", "Stun capability", "Electrical defense function"],
    ["knuckle_form_factor", "Knuckle form factor", "Knuckle-style grip profile"],
  ] as const) {
    await prisma.productFeature.upsert({ where: { productId_code: { productId: "prod_knuckle", code: feature[0] } }, update: { label: feature[1], value: feature[2], restrictedRelevant: true }, create: { productId: "prod_knuckle", code: feature[0], label: feature[1], value: feature[2], restrictedRelevant: true } });
    await prisma.productFeatureRestrictionRule.create({ data: { id: `feature_rule_${feature[0]}`, productId: "prod_knuckle", featureCode: feature[0], outcome: "BLOCK", reviewStatus: "DRAFT", reason: "Default blocked feature rule; not attorney-reviewed or provider-approved." } }).catch(() => undefined);
  }

  for (const [code, name, requirements] of templates) {
    const template = await prisma.verificationTemplate.upsert({ where: { code }, update: {}, create: { id: `vt_${code.toLowerCase()}`, code, name, description: `${name}; Phase 1 workflow template only.` } });
    for (const [index, req] of requirements.entries()) {
      await prisma.verificationRequirement.create({ data: { id: `req_${code.toLowerCase()}_${index}`, templateId: template.id, type: req[0], label: req[1], sortOrder: index } }).catch(() => undefined);
    }
  }

  const manualTemplate = await prisma.verificationTemplate.findUniqueOrThrow({ where: { code: "MANUAL_REVIEW_DEFAULT" } });
  const stunGunBlockedStates = new Set(["DC", "HI", "MA"]);
  const stunGunLegalSourceNote =
    "Development rule based on Self Defense Mall stun-gun laws reference; counsel review required before production.";
  const stunGunAllowReason =
    "Allowed by development stun-gun state reference; counsel review required before production.";
  const stunGunBlockReason = "Blocked by development stun-gun state reference.";

  for (const state of states) {
    for (const restrictedClass of restrictedClasses) {
      const outcome = stunGunBlockedStates.has(state) ? "BLOCK" : "ALLOW";
      const reason = outcome === "BLOCK" ? stunGunBlockReason : stunGunAllowReason;

      await prisma.stateRestrictionRule.upsert({
        where: { stateCode_restrictedClass_productId: { stateCode: state, restrictedClass, productId: "prod_knuckle" } },
        update: { outcome, reviewStatus: "COUNSEL_REVIEW_REQUIRED", reason, legalSourceNote: stunGunLegalSourceNote },
        create: {
          id: `rule_${state}_${restrictedClass}`,
          stateCode: state,
          restrictedClass,
          productId: "prod_knuckle",
          outcome,
          reviewStatus: "COUNSEL_REVIEW_REQUIRED",
          reason,
          legalSourceNote: stunGunLegalSourceNote,
        },
      });
      await prisma.stateVerificationRule.upsert({ where: { stateCode_restrictedClass: { stateCode: state, restrictedClass } }, update: {}, create: { id: `vrule_${state}_${restrictedClass}`, stateCode: state, restrictedClass, templateId: manualTemplate.id, reviewStatus: "MANUAL_REVIEW", reason: "Default verification review; automatic-first but exceptions stay in admin review." } });
    }
  }

  const blockedTemplate = await prisma.verificationTemplate.findUniqueOrThrow({ where: { code: "BLOCKED" } });
  for (const state of states) {
    const blocked = stunGunBlockedStates.has(state);
    await prisma.stateVerificationRule.upsert({
      where: { stateCode_restrictedClass: { stateCode: state, restrictedClass: "STUN_GUN" } },
      update: {
        templateId: blocked ? blockedTemplate.id : manualTemplate.id,
        reviewStatus: blocked ? "COUNSEL_REVIEW_REQUIRED" : "MANUAL_REVIEW",
        reason: blocked
          ? "Blocked by development stun-gun state reference."
          : "Allowed by development state restriction matrix; verification/manual counsel review remains required before payment release.",
      },
      create: {
        stateCode: state,
        restrictedClass: "STUN_GUN",
        templateId: blocked ? blockedTemplate.id : manualTemplate.id,
        reviewStatus: blocked ? "COUNSEL_REVIEW_REQUIRED" : "MANUAL_REVIEW",
        reason: blocked
          ? "Blocked by development stun-gun state reference."
          : "Allowed by development state restriction matrix; verification/manual counsel review remains required before payment release.",
      },
    });
  }


  await prisma.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { id: "coupon_welcome10", code: "WELCOME10", description: "10% launch welcome coupon for development/testing.", percentOff: 10, status: "ACTIVE" } });
  for (const gate of ["LIVE_CHECKOUT", "LIVE_PAYMENT", "LIVE_FULFILLMENT", "RULE_COVERAGE", "LEGAL_APPROVAL"] as const) {
    await prisma.launchGate.upsert({ where: { code: gate }, update: { status: "DISABLED", liveCheckoutEnabled: false, livePaymentEnabled: false, liveFulfillmentEnabled: false }, create: { id: `gate_${gate.toLowerCase()}`, code: gate, name: gate.replaceAll("_", " ").toLowerCase(), status: "DISABLED", ownerOnly: true, reason: "Disabled by default for safe local development.", liveCheckoutEnabled: false, livePaymentEnabled: false, liveFulfillmentEnabled: false } });
  }
  await prisma.paymentAttempt.create({ data: { id: "pay_mock_dev_seed", order: { create: { id: "order_seed_payment", orderNumber: "DEV-PAYMENT-SEED", status: "READY_FOR_PAYMENT", totalCents: 0, liveCheckoutEnabled: false, liveFulfillmentEnabled: false } }, provider: "AUTHORIZE_NET_MOCK", providerStatus: "DEVELOPMENT_APPROVED", status: "APPROVED", amountCents: 0, livePaymentEnabled: false, providerReference: "MOCK-TXN-DEV-PAYMENT-SEED" } }).catch(() => undefined);
  await prisma.paymentAttempt.create({ data: { id: "pay_nmi_manual_review_seed", order: { connect: { id: "order_seed_payment" } }, provider: "NMI", providerStatus: "MANUAL_REVIEW", status: "MANUAL_REVIEW", amountCents: 0, livePaymentEnabled: false, providerReference: "nmi-manual-review-until-approved" } }).catch(() => undefined);
  await prisma.auditLog.create({ data: { actorAdminId: owner.id, action: "SEED", entityType: "database", entityId: "phase_2b", note: "Seeded Phase 2B storefront content and owner-admin examples on top of Phase 1 foundation with manual-review legal defaults and disabled launch gates." } });
}

main().finally(async () => prisma.$disconnect());
