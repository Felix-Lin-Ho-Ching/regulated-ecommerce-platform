"use client";

import { useActionState } from "react";
import { createProductAction, updateProductAction, type ProductActionState } from "@/lib/products/actions";
import { maxProductMediaRows, productCategories, productMediaTypes, productStatuses } from "@/lib/products/validation";
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
              <input className="input" name={`mediaUpload${index}`} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" />
              <span className="text-xs font-medium text-slate-500">Upload is stored locally for development. Use external storage before production launch.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Thumbnail URL
              <input className="input" name={`mediaThumbnailUrl${index}`} defaultValue={media?.thumbnailUrl} type="text" />
              <span>Thumbnail upload file</span>
              <input className="input" name={`mediaThumbnailUpload${index}`} type="file" accept="image/jpeg,image/png,image/webp" />
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

export function ProductForm({ product }: { product?: AdminProductDetail }) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction] = useActionState<ProductActionState, FormData>(action, {});

  return (
    <form action={formAction} className="grid gap-6">
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
        <Select label="Category" name="category" defaultValue={product?.category} values={productCategories} />
        <Select label="Status" name="status" defaultValue={product?.status ?? "DRAFT"} values={productStatuses} />
        <Field label="SKU" name="sku" defaultValue={product?.sku} />
        <Field label="Price" name="price" defaultValue={product?.price?.toFixed(2)} type="number" />
        <label className="flex items-end gap-2 pb-3 text-sm font-bold text-slate-800">
          <input defaultChecked={product?.restricted} name="restricted" type="checkbox" />
          Restricted product
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
          Description
          <textarea className="input min-h-32" name="description" defaultValue={product?.description} />
        </label>
        <MediaRows product={product} />
        <FeatureRows product={product} />
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
