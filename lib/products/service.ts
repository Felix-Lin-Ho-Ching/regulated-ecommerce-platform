import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { getCatalogProducts, type CatalogProduct } from "@/lib/db/catalog";
import type { ProductFeatureInput, ProductFormInput } from "@/lib/products/validation";

export type AdminProductDetail = CatalogProduct & {
  hasInventory: boolean;
};

export async function getAdminProducts(): Promise<AdminProductDetail[]> {
  const products = await getCatalogProducts();
  return products.map((product) => ({ ...product, hasInventory: product.sku !== "UNASSIGNED" }));
}

export async function getAdminProductById(id: string): Promise<AdminProductDetail | undefined> {
  const products = await getAdminProducts();
  return products.find((product) => product.id === id || product.variantId === id);
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

export async function createProduct(input: ProductFormInput): Promise<string> {
  if (!isDatabaseConfigured) return input.id ?? "mock-product";

  const product = await prisma.product.create({
    data: {
      slug: input.slug,
      brand: input.brand,
      name: input.name,
      category: input.category,
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
      category: input.category,
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
}

export async function archiveProduct(productId: string) {
  if (!isDatabaseConfigured) return;

  await prisma.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}
