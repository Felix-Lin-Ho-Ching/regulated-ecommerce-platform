import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { getCatalogProducts, type CatalogProduct } from "@/lib/db/catalog";
import type { ProductFeatureInput, ProductFormInput, ProductMediaInput } from "@/lib/products/validation";

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
  variants: Array<{ id: string; sku: string; priceCents: number; inventory: { onHand: number; reserved: number } | null }>;
  features: Array<{ code: string; label: string; value: string; restrictedRelevant: boolean }>;
  media: Array<{ id: string; type: "IMAGE" | "VIDEO"; url: string; thumbnailUrl: string | null; alt: string | null; title: string | null; sortOrder: number }>;
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
    media: product.media.map((media) => ({ type: media.type, url: media.url, thumbnailUrl: media.thumbnailUrl ?? undefined, alt: media.alt ?? undefined, title: media.title ?? undefined, sortOrder: media.sortOrder })),
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
    include: { variants: { include: { inventory: true } }, features: true, media: { orderBy: { sortOrder: "asc" } }, category: true },
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
    include: { variants: { include: { inventory: true } }, features: true, media: { orderBy: { sortOrder: "asc" } }, category: true },
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
        sortOrder: media.sortOrder,
      },
    });
  }
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
          inventory: { create: { onHand: 0, reserved: 0, reorderThreshold: 0 } },
        },
      },
    },
  });

  await replaceFeatures(product.id, input.features);
  await replaceMedia(product.id, input.media);
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
      data: { sku: input.sku, priceCents: input.priceCents },
    });
  } else {
    await prisma.productVariant.create({
      data: {
        productId: input.id,
        sku: input.sku,
        name: "Default",
        priceCents: input.priceCents,
        status: "ACTIVE",
        inventory: { create: { onHand: 0, reserved: 0, reorderThreshold: 0 } },
      },
    });
  }

  await replaceFeatures(input.id, input.features);
  await replaceMedia(input.id, input.media);
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
