"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { createProductAction, updateProductAction, type ProductActionState } from "@/lib/products/actions";
import { productStatuses } from "@/lib/products/validation";
import type { AdminProductDetail } from "@/lib/products/service";
import { Field, FormSection, Select, TextArea } from "./product-form/form-controls";
import { ProductBasicSection } from "./product-form/product-basic-section";
import { ProductCategorySection, type ProductFormCategory } from "./product-form/product-category-section";
import { ProductComplianceSection } from "./product-form/product-compliance-section";
import { ProductContentBlocksSection } from "./product-form/product-content-blocks-section";
import { ProductFaqSection } from "./product-form/product-faq-section";
import { ProductFeaturesSection } from "./product-form/product-features-section";
import { ProductIncludedItemsSection } from "./product-form/product-included-items-section";
import { ProductMediaSection } from "./product-form/product-media-section";
import { ProductPricingInventorySection } from "./product-form/product-pricing-inventory-section";
import { ProductSaveControls } from "./product-form/product-save-controls";
import { ProductSpecificationsSection } from "./product-form/product-specifications-section";
import { clientSlugify, localSku } from "./product-form/product-form-utils";

export function ProductForm({ product, categories = [] }: { product?: AdminProductDetail; categories?: ProductFormCategory[] }) {
  const [state, formAction] = useActionState<ProductActionState, FormData>(
    product ? updateProductAction : createProductAction,
    {},
  );
  const isEditing = Boolean(product);
  const [visibleStatus, setVisibleStatus] = useState(product?.status ?? "DRAFT");
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "Stun Fry");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [slugManual, setSlugManual] = useState(isEditing || Boolean(product?.slug));
  const [skuManual, setSkuManual] = useState(isEditing || Boolean(product?.sku));
  const categoryName = categories.find((category) => category.id === categoryId)?.name ?? "";

  useEffect(() => {
    if (!state.ok) return;
    if (state.intent === "publish") setVisibleStatus("ACTIVE");
    if (state.intent === "draft") setVisibleStatus("DRAFT");
    if (state.intent === "archive") setVisibleStatus("ARCHIVED");
  }, [state]);
  useEffect(() => {
    if (!isEditing && !slugManual) setSlug(clientSlugify(name));
  }, [isEditing, name, slugManual]);
  useEffect(() => {
    if (!isEditing && !skuManual && name && categoryName) setSku(localSku(brand, categoryName, name));
  }, [brand, categoryName, isEditing, name, skuManual]);

  return (
    <form action={formAction} encType="multipart/form-data" className="grid gap-6">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}
      <AlertPanel title="Create products here" tone="info">Create products here. Draft products stay hidden from customers. Active products appear on the storefront after required fields are complete.</AlertPanel>
      {state.error ? <AlertPanel title="Product change blocked" tone="danger">{state.error}</AlertPanel> : null}
      {state.success ? <AlertPanel title="Product saved" tone="success">{state.success}</AlertPanel> : null}

      <FormSection title="Publishing controls" description="Save / publish controls. Current status and save actions. Publish validates required fields before setting Active.">
        <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-slate-700">Current status: {visibleStatus}</p>
        <ProductSaveControls product={product} state={state} />
      </FormSection>

      <FormSection title="Basic product information" description="Basic product info for creating a draft. Required fields are marked neutrally; URL and inventory identifiers can be auto-generated and manually overridden.">
        <ProductBasicSection name={name} setName={setName} brand={brand} setBrand={setBrand} isEditing={isEditing} setSkuManual={setSkuManual} />
        <ProductCategorySection product={product} categories={categories} categoryId={categoryId} setCategoryId={setCategoryId} isEditing={isEditing} setSkuManual={setSkuManual} />
        <Select label="Status" name="status" value={visibleStatus} onChange={(event) => setVisibleStatus(event.target.value)} values={productStatuses} hint="Draft is hidden. Active is visible when required data and inventory rules allow it. Archived is hidden but kept for records." required />
      </FormSection>

      <FormSection title="Advanced URL settings" description="Slug and SKU are auto-generated for new products but remain editable when you need custom identifiers." open={Boolean(product)}>
        <Field label="Product slug" name="slug" value={slug} onChange={(event) => { setSlugManual(true); setSlug(clientSlugify(event.target.value)); }} placeholder="stunfry-compact-safety-device" hint="Auto-generated from product name. Edit only if you need a custom URL." />
        {product ? <button className="btn btn-secondary md:w-fit" type="button" onClick={() => { setSlugManual(true); setSlug(clientSlugify(name)); }}>Regenerate slug from name</button> : null}
        <Field
          label="SKU"
          name="sku"
          value={sku} onChange={(event) => { setSkuManual(true); setSku(event.target.value.toUpperCase()); }} placeholder="SF-SG-COMPACT-1042" hint="Auto-generated for inventory and fulfillment. Edit only if you need a custom SKU." />
        {product ? <button className="btn btn-secondary md:w-fit" type="button" onClick={() => { setSkuManual(true); setSku(localSku(brand, categoryName, name)); }}>Regenerate SKU</button> : null}
      </FormSection>

      <FormSection title="Pricing and inventory"><ProductPricingInventorySection product={product} /></FormSection>
      <FormSection title="Compliance" description="Use STUN_GUN for stun-gun products; do not use knuckle_stun_device as a category or restricted class."><ProductComplianceSection product={product} /></FormSection>
      <FormSection title="Product media" description="Use the dynamic media list. There are no fixed empty slots; sort order is automatic." open={false}><ProductMediaSection product={product} /></FormSection>
      <FormSection title="Product page content" description="Repeatable product content uses Add item, Edit, Remove, Move up, and Move down controls." open={false}>
        <div className="grid gap-6 md:col-span-2">
          <ProductContentBlocksSection product={product} />
          <ProductFeaturesSection product={product} />
          <ProductIncludedItemsSection product={product} />
          <ProductSpecificationsSection product={product} />
          <ProductFaqSection product={product} />
        </div>
      </FormSection>
      <FormSection title="SEO/search preview" open={false}>
        <Field label="Meta title" name="metaTitle" defaultValue={product?.name} placeholder="StunFry Compact Safety Device" hint="Title shown in search results. Keep it clear and under about 60 characters." />
        <TextArea label="Meta description" name="metaDescription" rows={3} defaultValue={product?.description} placeholder="Compact safety device with responsible compliance checks." hint="Short search result description. Keep it under about 160 characters." />
        <Field label="Search keywords" name="searchKeywords" placeholder="compact safety device, stun gun" hint="Internal keywords for admin/search. Do not keyword stuff." />
      </FormSection>
    </form>
  );
}
