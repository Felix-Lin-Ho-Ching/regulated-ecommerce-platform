import { PrismaClient } from "@prisma/client";
import { getCatalogProducts } from "../lib/db/catalog";
import { processOrderPayment } from "../lib/payments/payment-service";
import { releaseOrderAfterPaymentApproval } from "../lib/orders/order-service";
import { getFulfillmentOrdersForAdmin } from "../lib/fulfillment/admin-queries";
import { shipSingleOrder } from "../lib/fulfillment/ship-orders";
import { createProduct, updateProduct } from "../lib/products/service";
import { getAdminOrder } from "../lib/admin/orders/service";
import { logDebugEmail } from "../lib/email/email-log-service";
import { buildAdminNewOrderEmail } from "../lib/email/templates/admin-new-order";
import { buildOrderConfirmationEmail } from "../lib/email/templates/order-confirmation";
import { parseProductForm, ProductFormValidationError, type ProductFormInput } from "../lib/products/validation";
import type { AdminSession } from "../lib/admin/auth";

const prisma = new PrismaClient();
const run = `regression-${Date.now()}`;
const slug = `${run}-draft-device`;
const sku = `REG-${Date.now()}`;
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function cleanup() {
  if (!process.env.DATABASE_URL) return;
  const orders = await prisma.order.findMany({ where: { orderNumber: { startsWith: "REG-" } }, select: { id: true } });
  const orderIds = orders.map((o: { id: string }) => o.id);
  const orderItemIds = orderIds.length ? (await prisma.orderItem.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } })).map((i: { id: string }) => i.id) : [];
  if (orderIds.length) {
    await prisma.emailLog.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.fulfillmentToken.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.inventoryReservation.deleteMany({ where: { orderItemId: { in: orderItemIds } } });
    await prisma.paymentAttempt.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.shippingAddress.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.auditLog.deleteMany({ where: { entityType: "Order", entityId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }
  const products = await prisma.product.findMany({ where: { slug: { startsWith: "regression-" } }, include: { variants: true } });
  const productIds = products.map((p: { id: string }) => p.id);
  const variantIds = products.flatMap((p: { variants: Array<{ id: string }> }) => p.variants.map((v: { id: string }) => v.id));
  if (variantIds.length) {
    const invIds = (await prisma.inventory.findMany({ where: { variantId: { in: variantIds } }, select: { id: true } })).map((i: { id: string }) => i.id);
    await prisma.inventoryReservation.deleteMany({ where: { inventoryId: { in: invIds } } });
    await prisma.inventoryTransaction.deleteMany({ where: { inventoryId: { in: invIds } } });
    await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
    await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
  }
  if (productIds.length) {
    await prisma.productFeature.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productMedia.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productContentSection.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productIncludedItem.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productSpec.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.productFAQ.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  }
  await prisma.adminUser.deleteMany({ where: { email: { endsWith: "@regression.local" } } });
}

async function assertParsedYouTubeMedia(label: string, fields: Record<string, string>, expectedUrl: string, expectedId = "dQw4w9WgXcQ") {
  const formData = new FormData();
  formData.set("name", `Regression Parser ${label}`);
  formData.set("slug", `regression-parser-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
  formData.set("sku", `REG-PARSER-${label}`);
  formData.set("categoryId", "parser-category");
  formData.set("price", "49.99");
  formData.set("restricted", "on");
  formData.set("restrictedClass", "STUN_GUN");
  formData.set("status", "DRAFT");
  formData.set("mediaSortOrder0", "0");
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);

  const parsed = await parseProductForm(formData);
  assert(parsed.media.length === 1, `${label} parser did not return one media row.`);
  assert(parsed.media[0].type === "YOUTUBE", `${label} parser did not save YouTube media type.`);
  assert(parsed.media[0].url === expectedUrl, `${label} parser did not preserve the original YouTube URL.`);
  assert(parsed.media[0].youtubeVideoId === expectedId, `${label} parser did not extract YouTube video ID.`);
}

async function assertInvalidYouTubeFails() {
  const invalidUrl = "https://www.youtube.com/watch?v=not-valid";
  try {
    await assertParsedYouTubeMedia("invalid-youtube", { mediaType0: "YOUTUBE", mediaYoutubeUrl0: invalidUrl }, invalidUrl, "not-valid");
  } catch (error) {
    assert(error instanceof ProductFormValidationError && error.message === "Media row 1: enter a valid YouTube URL.", "Invalid YouTube URL did not fail with the expected validation error.");
    return;
  }
  throw new Error("Invalid YouTube URL unexpectedly parsed successfully.");
}

async function productInput(categoryId: string, overrides: Partial<ProductFormInput> = {}): Promise<ProductFormInput> {
  return { name: "Regression Draft Device", slug, brand: "Stun Fry", categoryId, restrictedClass: "STUN_GUN", description: "Regression product", status: "DRAFT", restricted: true, sku, priceCents: 4999, stockQuantity: 5, lowStockThreshold: 1, auditNote: "regression", features: [{ code: "safe", label: "Safety", value: "Preserved", restrictedRelevant: true }], media: [], contentSections: [{ sectionKey: "overview", title: "Overview", body: "Preserved section", sortOrder: 0 }], includedItems: [{ label: "Cable", quantity: 1, sortOrder: 0 }], specs: [{ label: "Battery", value: "Rechargeable", sortOrder: 0 }], faqs: [{ question: "Works?", answer: "Yes", sortOrder: 0 }], ...overrides };
}

async function makeOrder(product: any, variant: any, mode: string, state = "TX") {
  return prisma.order.create({ data: { orderNumber: `REG-${mode}-${Date.now()}-${Math.floor(Math.random()*1000)}`, status: "PENDING_PAYMENT", fulfillmentStatus: "FULFILLMENT_HOLD", subtotalCents: 4999, shippingCents: 0, taxCents: 0, totalCents: 4999, customerEmail: mode === "approved" ? "buyer123@example.com" : "buyer@regression.local", customerName: "Regression Buyer", liveCheckoutEnabled: false, liveFulfillmentEnabled: false, paymentMode: mode, eligibilityResult: state === "TX" ? "AUTO_ELIGIBLE" : "BLOCKED", shippingAddress: { create: { name: "Regression Buyer", line1: "1 Main", city: "Austin", state, postalCode: state === "TX" ? "78701" : "96801", normalized: true, deliverable: true } }, items: { create: { productId: product.id, variantId: variant.id, name: product.name, sku, quantity: 1, unitPriceCents: 4999 } } }, include: { items: true, shippingAddress: true } });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for regression smoke tests.");
  await cleanup();

  await assertParsedYouTubeMedia("youtube-field", { mediaType0: "YOUTUBE", mediaYoutubeUrl0: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await assertParsedYouTubeMedia("youtube-media-url", { mediaType0: "YOUTUBE", mediaUrl0: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await assertParsedYouTubeMedia("image-autocorrect", { mediaType0: "IMAGE", mediaUrl0: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await assertParsedYouTubeMedia("youtu-be", { mediaType0: "YOUTUBE", mediaUrl0: "https://youtu.be/dQw4w9WgXcQ" }, "https://youtu.be/dQw4w9WgXcQ");
  await assertParsedYouTubeMedia("watch-url", { mediaType0: "YOUTUBE", mediaUrl0: "https://youtube.com/watch?v=dQw4w9WgXcQ" }, "https://youtube.com/watch?v=dQw4w9WgXcQ");
  await assertParsedYouTubeMedia("nocookie-embed", { mediaType0: "YOUTUBE", mediaUrl0: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" }, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  await assertInvalidYouTubeFails();
  const category = await prisma.productCategory.upsert({ where: { slug: "stun-guns" }, update: {}, create: { slug: "stun-guns", name: "Stun Guns" } });
  const id = await createProduct(await productInput(category.id));
  assert(!(await getCatalogProducts()).some((p) => p.id === id), "Draft product appeared on storefront.");
  await updateProduct(await productInput(category.id, { id, status: "ACTIVE", media: [{ type: "IMAGE", url: "/uploads/regression.jpg", alt: "Regression image", title: "Image", sortOrder: 0 }, { type: "YOUTUBE", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", youtubeVideoId: "dQw4w9WgXcQ", title: "Video", sortOrder: 1 }] }));
  let saved = await prisma.product.findUniqueOrThrow({ where: { id }, include: { media: { orderBy: { sortOrder: "asc" } }, contentSections: true, includedItems: true, specs: true, faqs: true, features: true, variants: { include: { inventory: true } } } });
  assert(saved.status === "ACTIVE" && saved.media.length === 2 && saved.media[1].type === "YOUTUBE" && saved.media[1].youtubeVideoId === "dQw4w9WgXcQ", "Active product media did not persist/reload.");
  assert((await getCatalogProducts()).some((p) => p.id === id && p.media.some((m) => m.type === "YOUTUBE" && m.youtubeVideoId)), "Active product with media did not render in storefront catalog data.");
  await updateProduct(await productInput(category.id, { id, status: "ACTIVE", name: "Regression Renamed", media: saved.media.map((m: any) => ({ type: m.type === "YOUTUBE" ? "YOUTUBE" : "IMAGE", url: m.url, thumbnailUrl: m.thumbnailUrl ?? undefined, youtubeVideoId: m.youtubeVideoId ?? undefined, alt: m.alt ?? undefined, title: m.title ?? undefined, sortOrder: m.sortOrder })) }));
  saved = await prisma.product.findUniqueOrThrow({ where: { id }, include: { media: true, contentSections: true, includedItems: true, specs: true, faqs: true, features: true, variants: { include: { inventory: true } } } });
  assert(saved.media.length === 2 && saved.contentSections.length === 1 && saved.includedItems.length === 1 && saved.specs.length === 1 && saved.faqs.length === 1 && saved.features.length === 1, "Unrelated product save wiped media or repeatable content.");
  await updateProduct(await productInput(category.id, { id, status: "ARCHIVED", auditNote: "archive regression", media: saved.media.map((m: any) => ({ type: m.type === "YOUTUBE" ? "YOUTUBE" : "IMAGE", url: m.url, youtubeVideoId: m.youtubeVideoId ?? undefined, sortOrder: m.sortOrder })) }));
  assert(!(await getCatalogProducts()).some((p) => p.id === id), "Archived product appeared on storefront.");
  await updateProduct(await productInput(category.id, { id, status: "ACTIVE", name: "Regression Empty Collection Guard", features: [], media: [], contentSections: [], includedItems: [], specs: [], faqs: [] }));
  saved = await prisma.product.findUniqueOrThrow({ where: { id }, include: { media: true, contentSections: true, includedItems: true, specs: true, faqs: true, features: true, variants: { include: { inventory: true } } } });
  assert(saved.media.length === 2 && saved.contentSections.length === 1 && saved.includedItems.length === 1 && saved.specs.length === 1 && saved.faqs.length === 1 && saved.features.length === 1, "Empty unrelated product save wiped existing media or repeatable content.");

  const role = await prisma.adminRole.upsert({ where: { code: "FULFILLMENT" }, update: {}, create: { code: "FULFILLMENT", name: "Fulfillment" } });
  const admin = await prisma.adminUser.create({ data: { email: `${run}@regression.local`, name: "Regression Fulfillment", passwordHash: "x", roleId: role.id } });
  const actor: AdminSession = { adminId: admin.id, email: admin.email, name: admin.name, role: "FULFILLMENT", demo: false };
  const variant = saved.variants[0];
  const approved = await makeOrder(saved, variant, "approved");
  assert(approved.customerEmail === "buyer123@example.com", "Guest checkout/order creation did not store buyer123@example.com.");
  const approvedPayment = await processOrderPayment(prisma, approved, "mock_card", { cardNumber: "4111111111111111", expiration: "12/30", cvv: "123", nameOnCard: "Regression Buyer", postalCode: "78701" });
  assert(approvedPayment.paymentAttempt.status === "APPROVED" && !JSON.stringify(approvedPayment.paymentAttempt).includes("4111111111111111") && !JSON.stringify(approvedPayment.paymentAttempt).includes("123"), "Approved payment failed or stored raw card data.");
  await releaseOrderAfterPaymentApproval(approved.id, { email: "regression", role: "SYSTEM" });
  const paid = await prisma.order.findUniqueOrThrow({ where: { id: approved.id }, include: { paymentAttempts: true, shippingAddress: true } });
  assert(paid.status === "PAID" && paid.fulfillmentStatus === "READY_TO_SHIP" && paid.paymentAttempts.some((p: { status: string }) => p.status === "APPROVED"), "Approved order/payment state is inconsistent.");
  const confirmation = buildOrderConfirmationEmail({ orderNumber: paid.orderNumber, createdAt: paid.createdAt, items: approved.items, totalCents: paid.totalCents, shippingAddress: paid.shippingAddress!, hasRestrictedItems: true });
  const adminEmail = buildAdminNewOrderEmail({ orderNumber: paid.orderNumber, customerEmail: paid.customerEmail, totalCents: paid.totalCents, hasRestrictedItems: true, shippingState: paid.shippingAddress?.state, shippingPostalCode: paid.shippingAddress?.postalCode, adminOrderUrl: `/admin/orders/${paid.orderNumber}` });
  await logDebugEmail({ type: "ORDER_REQUEST_CONFIRMATION", to: paid.customerEmail!, subject: confirmation.subject, text: confirmation.text, orderId: paid.id, metadata: { orderNumber: paid.orderNumber } });
  await logDebugEmail({ type: "ADMIN_NEW_ORDER", to: "admin@regression.local", subject: adminEmail.subject, text: adminEmail.text, orderId: paid.id, metadata: { orderNumber: paid.orderNumber } });
  const emailLogs = await prisma.emailLog.findMany({ where: { orderId: paid.id } });
  assert(emailLogs.some((log: any) => log.type === "ORDER_REQUEST_CONFIRMATION" && log.to === "buyer123@example.com"), "Confirmation email log target was not buyer123@example.com.");
  assert(emailLogs.some((log: any) => log.type === "ADMIN_NEW_ORDER" && (log.text ?? "").includes("buyer123@example.com")), "Admin new order email did not include buyer123@example.com.");
  assert(!JSON.stringify({ paid, emailLogs }).includes("guest@stunfry.example"), "Real checkout/order/email regression path used guest@stunfry.example.");
  const adminDetail = await getAdminOrder(paid.orderNumber);
  assert(adminDetail.order?.customerEmail === "buyer123@example.com" && adminDetail.order.paymentAttempts.some((p: any) => p.status === "APPROVED" && p.providerReference && !p.providerReference.includes("4111111111111111") && !p.providerReference.includes("123")), "Admin order detail lacks real email or safe approved payment attempt display data.");
  assert((await getFulfillmentOrdersForAdmin(actor)).some((o) => o.id === approved.id), "Paid approved order was not released to fulfillment.");
  await prisma.order.update({ where: { id: approved.id }, data: { fulfillmentStatus: "PICKING", assignedFulfillmentUserId: admin.id, assignedAt: new Date() } });
  const shipped = await shipSingleOrder({ orderId: approved.id, actor, carrier: "UPS", trackingNumber: "1ZREGRESSION" });
  assert(shipped.shipped, "Claimed paid order did not ship.");

  for (const [label, card] of Object.entries({ zip: { cardNumber: "4111111111111111", expiration: "12/30", cvv: "123", nameOnCard: "Regression Buyer", postalCode: "46282" }, cvv: { cardNumber: "4111111111111111", expiration: "12/30", cvv: "901", nameOnCard: "Regression Buyer", postalCode: "78701" }, expired: { cardNumber: "4111111111111111", expiration: "01/20", cvv: "123", nameOnCard: "Regression Buyer", postalCode: "78701" } })) {
    const order = await makeOrder(saved, variant, `declined-${label}`);
    const result = await processOrderPayment(prisma, order, "mock_card", card);
    assert(result.paymentAttempt.status === "DECLINED", `${label} did not decline.`);
    assert(!(await getFulfillmentOrdersForAdmin(actor)).some((o) => o.id === order.id), `${label} declined order entered fulfillment.`);
  }
  const blocked = await makeOrder(saved, variant, "blocked-hi", "HI");
  assert(blocked.eligibilityResult === "BLOCKED" && !(await getFulfillmentOrdersForAdmin(actor)).some((o) => o.id === blocked.id), "Blocked-state order entered fulfillment.");
  console.log("Regression smoke passed: product persistence/media, storefront visibility, payment, fulfillment, and consistency checks.");
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await cleanup().catch((e) => console.error("Cleanup failed", e)); await prisma.$disconnect(); });
