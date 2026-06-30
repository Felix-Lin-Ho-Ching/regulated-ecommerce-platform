"use client";

import { useActionState } from "react";
import { createProductAction, updateProductAction, type ProductActionState } from "@/lib/products/actions";
import { maxProductContentRows, maxProductFAQRows, maxProductIncludedRows, maxProductMediaRows, maxProductSpecRows, productMediaTypes, productSectionKeys, productStatuses, restrictedClassOptions } from "@/lib/products/validation";
import type { AdminProductDetail } from "@/lib/products/service";
import { AlertPanel } from "@/components/common/panels";

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue?: string | number; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      {label}
      <input className="input" name={name} defaultValue={defaultValue} type={type} />
    </label>
  );
}

function Select({ label, name, defaultValue, values }: { label: string; name: string; defaultValue?: string; values: readonly string[] }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      {label}
      <select className="input" name={name} defaultValue={defaultValue}>
        {values.map((value) => (
          <option key={value} value={value}>
            {value.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function FeatureRows({ product }: { product?: AdminProductDetail }) {
  const features = product?.features ?? [];

  return (
    <div className="grid gap-3 md:col-span-2">
      <div>
        <h3 className="font-black">Product specs / features</h3>
        <p className="mt-1 text-sm text-slate-600">
          Optional product details shown or used for restricted-item review. Leave blank if not needed.
        </p>
      </div>
      {[0, 1, 2, 3, 4].map((index) => {
        const feature = features[index];
        return (
          <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto]" key={index}>
            <Field label="Internal code" name={`featureCode${index}`} defaultValue={feature?.code} />
            <Field label="Public label" name={`featureLabel${index}`} defaultValue={feature?.label} />
            <Field label="Value" name={`featureValue${index}`} defaultValue={feature?.value} />
            <label className="flex items-end gap-2 pb-3 text-sm font-bold text-slate-800">
              <input defaultChecked={feature?.restrictedRelevant} name={`featureRestricted${index}`} type="checkbox" />
              Relevant to restricted-item review
            </label>
          </div>
        );
      })}
    </div>
  );
}

function MediaRows({ product }: { product?: AdminProductDetail }) {
  const mediaRows = product?.media ?? [];

  return (
    <div className="grid gap-3 md:col-span-2">
      <div>
        <h3 className="font-black">Product media</h3>
        <p className="mt-1 text-sm text-slate-600">
          Optional storefront images or videos. Paste a URL or upload local media for development/testing. Blank rows are ignored; media URLs must be http(s) or local paths.
        </p>
      </div>
      {Array.from({ length: maxProductMediaRows }, (_, index) => {
        const media = mediaRows[index];
        return (
          <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-6" key={index}>
            <Select label="Type" name={`mediaType${index}`} defaultValue={media?.type ?? "IMAGE"} values={productMediaTypes} />
            <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
              Media URL
              <input className="input invalid:border-red-500" name={`mediaUrl${index}`} defaultValue={media?.url} type="text" />
              <span className="text-center text-xs font-black uppercase text-slate-500">or</span>
              <span>Upload file</span>
              <input className="input" name={`mediaUpload${index}`} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.webm" />
              <span className="text-xs font-medium text-slate-500">Local uploads are for development/testing. Use durable external storage before production launch.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Thumbnail URL
              <input className="input" name={`mediaThumbnailUrl${index}`} defaultValue={media?.thumbnailUrl} type="text" />
              <span>Thumbnail upload file</span>
              <input className="input" name={`mediaThumbnailUpload${index}`} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />
            </label>
            <Field label="Alt text" name={`mediaAlt${index}`} defaultValue={media?.alt} />
            <Field label="Title" name={`mediaTitle${index}`} defaultValue={media?.title} />
            <Field label="Sort order" name={`mediaSortOrder${index}`} defaultValue={media?.sortOrder} type="number" />
          </div>
        );
      })}
    </div>
  );
}

function ProductContentRows({ product }: { product?: AdminProductDetail }) {
  const sections = product?.contentSections ?? [];
  const included = product?.includedItems ?? [];
  const specs = product?.specs ?? [];
  const faqs = product?.faqs ?? [];
  return (
    <div className="grid gap-6 md:col-span-2">
      <h3 className="font-black">Editable product detail content</h3>
      <div className="grid gap-3">
        <h4 className="font-bold">Content sections</h4>
        {Array.from({ length: maxProductContentRows }, (_, index) => { const row = sections[index]; return <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-4" key={`section-${index}`}><Select label="Section key" name={`sectionKey${index}`} defaultValue={row?.sectionKey ?? productSectionKeys[index] ?? "overview"} values={productSectionKeys} /><Field label="Eyebrow" name={`sectionEyebrow${index}`} defaultValue={row?.eyebrow} /><Field label="Title" name={`sectionTitle${index}`} defaultValue={row?.title} /><Field label="Sort" name={`sectionSortOrder${index}`} defaultValue={row?.sortOrder ?? index} type="number" /><label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-4">Body<textarea className="input min-h-24" name={`sectionBody${index}`} defaultValue={row?.body} /></label><Field label="Image URL" name={`sectionImageUrl${index}`} defaultValue={row?.imageUrl} /><Field label="Video URL" name={`sectionVideoUrl${index}`} defaultValue={row?.videoUrl} /><Field label="CTA label" name={`sectionCtaLabel${index}`} defaultValue={row?.ctaLabel} /><Field label="CTA href" name={`sectionCtaHref${index}`} defaultValue={row?.ctaHref} /></div>; })}
      </div>
      <div className="grid gap-3"><h4 className="font-bold">What’s included</h4>{Array.from({ length: maxProductIncludedRows }, (_, index) => { const row = included[index]; return <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-4" key={`included-${index}`}><Field label="Label" name={`includedLabel${index}`} defaultValue={row?.label} /><Field label="Description" name={`includedDescription${index}`} defaultValue={row?.description} /><Field label="Quantity" name={`includedQuantity${index}`} defaultValue={row?.quantity ?? 1} type="number" /><Field label="Sort" name={`includedSortOrder${index}`} defaultValue={row?.sortOrder ?? index} type="number" /></div>; })}</div>
      <div className="grid gap-3"><h4 className="font-bold">Specs</h4>{Array.from({ length: maxProductSpecRows }, (_, index) => { const row = specs[index]; return <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-4" key={`spec-${index}`}><Field label="Group" name={`specGroup${index}`} defaultValue={row?.group} /><Field label="Label" name={`specLabel${index}`} defaultValue={row?.label} /><Field label="Value" name={`specValue${index}`} defaultValue={row?.value} /><Field label="Sort" name={`specSortOrder${index}`} defaultValue={row?.sortOrder ?? index} type="number" /></div>; })}</div>
      <div className="grid gap-3"><h4 className="font-bold">FAQ</h4>{Array.from({ length: maxProductFAQRows }, (_, index) => { const row = faqs[index]; return <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-[1fr_2fr_auto]" key={`faq-${index}`}><Field label="Question" name={`faqQuestion${index}`} defaultValue={row?.question} /><Field label="Answer" name={`faqAnswer${index}`} defaultValue={row?.answer} /><Field label="Sort" name={`faqSortOrder${index}`} defaultValue={row?.sortOrder ?? index} type="number" /></div>; })}</div>
    </div>
  );
}

export function ProductForm({ product, categories = [] }: { product?: AdminProductDetail; categories?: Array<{ id: string; name: string; slug: string }> }) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction] = useActionState<ProductActionState, FormData>(action, {});

  return (
    <form action={formAction} encType="multipart/form-data" className="grid gap-6">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}
      <AlertPanel title="Dangerous product changes require notes" tone="warning">
        Archive actions and restricted-status changes are audit logged. Use ARCHIVED instead of hard delete.
      </AlertPanel>
      {state.error ? <AlertPanel title="Product change blocked" tone="danger">{state.error}</AlertPanel> : null}
      {state.success ? <AlertPanel title="Product saved" tone="success">{state.success}</AlertPanel> : null}
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <Field label="Product name" name="name" defaultValue={product?.name} />
        <Field label="Slug" name="slug" defaultValue={product?.slug} />
        <Field label="Brand" name="brand" defaultValue={product?.brand ?? "Stun Fry"} />
        <label className="grid gap-2 text-sm font-bold text-slate-800">Category<select className="input" name="categoryId" defaultValue={product?.categoryId ?? ""}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <Select label="Status" name="status" defaultValue={product?.status ?? "DRAFT"} values={productStatuses} />
        <Field label="SKU" name="sku" defaultValue={product?.sku} />
        <Field label="Price" name="price" defaultValue={product?.price?.toFixed(2)} type="number" />
        <label className="flex items-end gap-2 pb-3 text-sm font-bold text-slate-800">
          <input defaultChecked={product?.restricted} name="restricted" type="checkbox" />
          Restricted product
        </label>
        <Select label="Restricted class" name="restrictedClass" defaultValue={product?.restrictedClass ?? "STUN_GUN"} values={restrictedClassOptions} />
        <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
          Description
          <textarea className="input min-h-32" name="description" defaultValue={product?.description} />
        </label>
        <MediaRows product={product} />
        <FeatureRows product={product} />
        <ProductContentRows product={product} />
        <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
          Owner note (optional for routine details)
          <textarea className="input min-h-24" name="auditNote" />
        </label>
        <button className="btn btn-primary md:w-fit" type="submit">
          {product ? "Save product" : "Create product"}
        </button>
      </section>
    </form>
  );
}
