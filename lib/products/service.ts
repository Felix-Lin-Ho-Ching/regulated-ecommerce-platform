import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { getCatalogProducts, type CatalogProduct } from "@/lib/db/catalog";
import type { ProductContentSectionInput, ProductFAQInput, ProductFeatureInput, ProductFormInput, ProductIncludedItemInput, ProductMediaInput, ProductSpecInput } from "@/lib/products/validation";

export type AdminProductListFilter = "active" | "archived" | "all";

export type AdminProductDetail = CatalogProduct & {
  archivedAt: Date | null;
  hasInventory: boolean;
};

type AdminProductRow = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: { id: string; slug: string; name: string } | null;
  restrictedClass?: string | null;
  description: string;
  status: string;
  restricted: boolean;
  archivedAt: Date | null;
  variants: Array<{ id: string; sku: string; priceCents: number; inventory: { onHand: number; reserved: number; reorderThreshold: number } | null }>;
  features: Array<{ code: string; label: string; value: string; restrictedRelevant: boolean }>;
  media: Array<{ id: string; type: "IMAGE" | "VIDEO" | "YOUTUBE"; url: string; thumbnailUrl: string | null; youtubeVideoId: string | null; alt: string | null; title: string | null; sortOrder: number }>;
  contentSections: Array<{ sectionKey: string; eyebrow: string | null; title: string; body: string | null; imageUrl: string | null; videoUrl: string | null; ctaLabel: string | null; ctaHref: string | null; sortOrder: number }>;
  includedItems: Array<{ label: string; description: string | null; quantity: number; sortOrder: number }>;
  specs: Array<{ label: string; value: string; group: string | null; sortOrder: number }>;
  faqs: Array<{ question: string; answer: string; sortOrder: number }>;
};

function toAdminProductDetail(product: AdminProductRow): AdminProductDetail {
  const variant = product.variants[0];
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    category: product.category?.name ?? "Uncategorized",
    categoryId: product.category?.id ?? null,
    categorySlug: product.category?.slug ?? null,
    restrictedClass: product.restrictedClass ?? null,
    description: product.description,
    status: product.status,
    restricted: product.restricted,
    archivedAt: product.archivedAt,
    variantId: variant?.id ?? product.id,
    sku: variant?.sku ?? "UNASSIGNED",
    price: (variant?.priceCents ?? 0) / 100,
    stock: variant?.inventory?.onHand ?? 0,
    reserved: variant?.inventory?.reserved ?? 0,
    features: product.features.map((feature) => ({ code: feature.code, label: feature.label, value: feature.value, restrictedRelevant: feature.restrictedRelevant })),
    media: product.media.map((media) => ({ type: media.type, url: media.url, thumbnailUrl: media.thumbnailUrl ?? undefined, youtubeVideoId: media.youtubeVideoId ?? undefined, alt: media.alt ?? undefined, title: media.title ?? undefined, sortOrder: media.sortOrder })),
    contentSections: product.contentSections.map((section) => ({ sectionKey: section.sectionKey, eyebrow: section.eyebrow ?? undefined, title: section.title, body: section.body ?? undefined, imageUrl: section.imageUrl ?? undefined, videoUrl: section.videoUrl ?? undefined, ctaLabel: section.ctaLabel ?? undefined, ctaHref: section.ctaHref ?? undefined, sortOrder: section.sortOrder })),
    includedItems: product.includedItems.map((item) => ({ label: item.label, description: item.description ?? undefined, quantity: item.quantity, sortOrder: item.sortOrder })),
    specs: product.specs.map((spec) => ({ label: spec.label, value: spec.value, group: spec.group ?? undefined, sortOrder: spec.sortOrder })),
    faqs: product.faqs.map((faq) => ({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder })),
    hasInventory: Boolean(variant?.inventory) && (variant?.sku ?? "UNASSIGNED") !== "UNASSIGNED",
  };
}

export async function getAdminProducts(filter: AdminProductListFilter = "active"): Promise<AdminProductDetail[]> {
  if (!isDatabaseConfigured) {
    const products = await getCatalogProducts();
    return products.map((product) => ({ ...product, archivedAt: null, hasInventory: product.sku !== "UNASSIGNED" }));
  }

  const where = filter === "active" ? { archivedAt: null } : filter === "archived" ? { archivedAt: { not: null } } : undefined;
  const products = await prisma.product.findMany({
    where,
    include: { variants: { include: { inventory: true } }, features: true, media: { orderBy: { sortOrder: "asc" } }, contentSections: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, includedItems: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, specs: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, faqs: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, category: true },
    orderBy: { createdAt: "asc" },
  });
  return (products as AdminProductRow[]).map((product: AdminProductRow) => toAdminProductDetail(product));
}

export async function getAdminProductById(id: string): Promise<AdminProductDetail | undefined> {
  if (!isDatabaseConfigured) {
    const products = await getAdminProducts("all");
    return products.find((product) => product.id === id || product.variantId === id);
  }

  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { variants: { some: { id } } }] },
    include: { variants: { include: { inventory: true } }, features: true, media: { orderBy: { sortOrder: "asc" } }, contentSections: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, includedItems: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, specs: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, faqs: { where: { archivedAt: null }, orderBy: { sortOrder: "asc" } }, category: true },
  });

  return product ? toAdminProductDetail(product as AdminProductRow) : undefined;
}

async function replaceFeatures(productId: string, features: ProductFeatureInput[]) {
  await prisma.productFeature.deleteMany({ where: { productId } });

  for (const feature of features) {
    await prisma.productFeature.create({
      data: {
        productId,
        code: feature.code,
        label: feature.label,
        value: feature.value,
        restrictedRelevant: feature.restrictedRelevant,
      },
    });
  }
}

async function replaceMedia(productId: string, mediaRows: ProductMediaInput[]) {
  await prisma.productMedia.deleteMany({ where: { productId } });

  for (const media of mediaRows) {
    await prisma.productMedia.create({
      data: {
        productId,
        type: media.type,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        alt: media.alt,
        title: media.title,
        youtubeVideoId: media.youtubeVideoId,
        sortOrder: media.sortOrder,
      },
    });
  }
}

async function replaceContent(productId: string, sections: ProductContentSectionInput[], includedItems: ProductIncludedItemInput[], specs: ProductSpecInput[], faqs: ProductFAQInput[]) {
  await prisma.productContentSection.deleteMany({ where: { productId } });
  await prisma.productIncludedItem.deleteMany({ where: { productId } });
  await prisma.productSpec.deleteMany({ where: { productId } });
  await prisma.productFAQ.deleteMany({ where: { productId } });
  for (const section of sections) await prisma.productContentSection.create({ data: { productId, ...section } });
  for (const item of includedItems) await prisma.productIncludedItem.create({ data: { productId, ...item } });
  for (const spec of specs) await prisma.productSpec.create({ data: { productId, ...spec } });
  for (const faq of faqs) await prisma.productFAQ.create({ data: { productId, ...faq } });
}

export async function createProduct(input: ProductFormInput): Promise<string> {
  if (!isDatabaseConfigured) return input.id ?? "mock-product";

  const product = await prisma.product.create({
    data: {
      slug: input.slug,
      brand: input.brand,
      name: input.name,
      categoryId: input.categoryId,
      restrictedClass: input.restricted ? input.restrictedClass ?? "STUN_GUN" : null,
      description: input.description,
      status: input.status,
      restricted: input.restricted,
      variants: {
        create: {
          sku: input.sku,
          name: "Default",
          priceCents: input.priceCents,
          status: input.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
          inventory: { create: { onHand: input.stockQuantity, reserved: 0, reorderThreshold: input.lowStockThreshold } },
        },
      },
    },
  });

  await replaceFeatures(product.id, input.features);
  await replaceMedia(product.id, input.media);
  await replaceContent(product.id, input.contentSections, input.includedItems, input.specs, input.faqs);
  return product.id as string;
}

export async function updateProduct(input: ProductFormInput) {
  if (!isDatabaseConfigured || !input.id) return;

  const product = await prisma.product.findUnique({
    where: { id: input.id },
    include: { variants: true },
  });
  const variant = product?.variants?.[0];

  await prisma.product.update({
    where: { id: input.id },
    data: {
      slug: input.slug,
      brand: input.brand,
      name: input.name,
      categoryId: input.categoryId,
      restrictedClass: input.restricted ? input.restrictedClass ?? "STUN_GUN" : null,
      description: input.description,
      status: input.status,
      restricted: input.restricted,
    },
  });

  if (variant) {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { sku: input.sku, priceCents: input.priceCents, status: input.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE", inventory: { upsert: { create: { onHand: input.stockQuantity, reserved: 0, reorderThreshold: input.lowStockThreshold }, update: { onHand: input.stockQuantity, reorderThreshold: input.lowStockThreshold } } } },
    });
  } else {
    await prisma.productVariant.create({
      data: {
        productId: input.id,
        sku: input.sku,
        name: "Default",
        priceCents: input.priceCents,
        status: "ACTIVE",
        inventory: { create: { onHand: input.stockQuantity, reserved: 0, reorderThreshold: input.lowStockThreshold } },
      },
    });
  }

  await replaceFeatures(input.id, input.features);
  await replaceMedia(input.id, input.media);
  await replaceContent(input.id, input.contentSections, input.includedItems, input.specs, input.faqs);
}

export async function archiveProduct(productId: string): Promise<boolean> {
  if (!isDatabaseConfigured) return true;

  const existing = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!existing) return false;

  await prisma.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  return true;
}

export async function restoreProduct(productId: string): Promise<boolean> {
  if (!isDatabaseConfigured) return true;

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { restricted: true, variants: { select: { id: true } } } });
  if (!product) return false;
  const restoredStatus = product?.restricted ? "RESTRICTED_REVIEW" : "ACTIVE";

  await prisma.product.update({
    where: { id: productId },
    data: { status: restoredStatus, archivedAt: null },
  });

  await prisma.productVariant.updateMany({
    where: { productId },
    data: { status: restoredStatus, archivedAt: null },
  });
  return true;
}
