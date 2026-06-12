import { createProductAction, updateProductAction } from "@/lib/products/actions";
import { productCategories, productStatuses } from "@/lib/products/validation";
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
      <h3 className="font-black">Product feature rows</h3>
      {[0, 1, 2, 3, 4].map((index) => {
        const feature = features[index];
        return (
          <div className="grid gap-3 rounded-2xl border border-stone-200 p-3 md:grid-cols-[1fr_1fr_1fr_auto]" key={index}>
            <Field label="Code" name={`featureCode${index}`} defaultValue={feature?.code} />
            <Field label="Label" name={`featureLabel${index}`} defaultValue={feature?.label} />
            <Field label="Value" name={`featureValue${index}`} defaultValue={feature?.value} />
            <label className="flex items-end gap-2 pb-3 text-sm font-bold text-slate-800">
              <input defaultChecked={feature?.restrictedRelevant} name={`featureRestricted${index}`} type="checkbox" />
              Restricted relevant
            </label>
          </div>
        );
      })}
    </div>
  );
}

export function ProductForm({ product }: { product?: AdminProductDetail }) {
  const action = product ? updateProductAction : createProductAction;

  return (
    <form action={action} className="grid gap-6">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}
      <AlertPanel title="Dangerous product changes require notes" tone="warning">
        Archive actions and restricted-status changes are audit logged. Use ARCHIVED instead of hard delete.
      </AlertPanel>
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
        <FeatureRows product={product} />
        <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
          Required audit note
          <textarea className="input min-h-24" name="auditNote" />
        </label>
        <button className="btn btn-primary md:w-fit" type="submit">
          {product ? "Save product" : "Create product"}
        </button>
      </section>
    </form>
  );
}
