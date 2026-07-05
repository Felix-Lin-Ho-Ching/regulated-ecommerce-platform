"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AlertPanel } from "@/components/common/panels";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import {
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/lib/products/actions";
import {
  maxProductContentRows,
  maxProductFAQRows,
  maxProductFeatureRows,
  maxProductIncludedRows,
  maxProductMediaRows,
  maxProductSpecRows,
  normalProductSectionKeys,
  productStatuses,
  restrictedClassOptions,
} from "@/lib/products/validation";
import type { AdminProductDetail } from "@/lib/products/service";

type Item<T> = T & { key: string; editing?: boolean; isNew?: boolean };

type MediaItem = Item<{
  type: "IMAGE" | "YOUTUBE";
  url?: string;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
}>;
type SectionItem = Item<{
  sectionKey?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
}>;
type FeatureItem = Item<{
  code?: string;
  label?: string;
  value?: string;
  restrictedRelevant?: boolean;
}>;
type IncludedItem = Item<{
  label?: string;
  description?: string;
  quantity?: number;
}>;
type SpecItem = Item<{ group?: string; label?: string; value?: string }>;
type FaqItem = Item<{ question?: string; answer?: string }>;

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  placeholder,
  required,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}) {
  const controlProps =
    value === undefined
      ? { defaultValue: defaultValue ?? "" }
      : { value, onChange, onBlur };
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      <span>
        {label}
        {required ? (
          <span className="ml-2 text-xs font-semibold text-slate-500">
            Required
          </span>
        ) : null}
      </span>
      <input
        className="input"
        name={name}
        type={type}
        placeholder={placeholder}
        aria-required={required}
        step={type === "number" ? "0.01" : undefined}
        {...controlProps}
      />
      {hint ? (
        <span className="text-xs font-medium text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      {label}
      <textarea
        className="input"
        rows={rows}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
      />
      {hint ? (
        <span className="text-xs font-medium text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
function Select({
  label,
  name,
  defaultValue,
  value,
  onChange,
  values,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  values: readonly string[];
  hint?: string;
  required?: boolean;
}) {
  const controlProps =
    value === undefined ? { defaultValue } : { value, onChange };
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      <span>
        {label}
        {required ? (
          <span className="ml-2 text-xs font-semibold text-slate-500">
            Required
          </span>
        ) : null}
      </span>
      <select
        className="input"
        name={name}
        aria-required={required}
        {...controlProps}
      >
        {values.map((optionValue) => (
          <option key={optionValue} value={optionValue}>
            {optionValue.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      {hint ? (
        <span className="text-xs font-medium text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
function clientSlugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function skuPart(value: string, fallback: string): string {
  const words = value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    (words.length > 1 ? words.map((word) => word[0]).join("") : words[0]) ||
    fallback
  ).slice(0, 4);
}
function localSku(brand: string, category: string, name: string): string {
  const short =
    clientSlugify(name)
      .split("-")
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
      .slice(0, 10) || "ITEM";
  return `${skuPart(brand, "SF")}-${skuPart(category, "CAT")}-${short}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function FormSection({
  title,
  description,
  children,
  open = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="card p-5" open={open}>
      <summary className="cursor-pointer text-lg font-black text-slate-950">
        {title}
      </summary>
      {description ? (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </details>
  );
}

let newKey = 0;
function RepeatableList<
  T extends { key: string; editing?: boolean; isNew?: boolean },
>({
  title,
  help,
  addLabel,
  max,
  items,
  setItems,
  emptyLabel,
  makeItem,
  summary,
  children,
}: {
  title: string;
  help: string;
  addLabel: string;
  max: number;
  items: T[];
  setItems: (items: T[]) => void;
  emptyLabel: string;
  makeItem: () => T;
  summary: (item: T, index: number) => string;
  children: (item: T, index: number) => React.ReactNode;
}) {
  const [status, setStatus] = useState<string>();
  const limitReached = items.length >= max;
  const showStatus = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(undefined), 1800);
  };
  const move = (index: number, delta: number) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    showStatus("Updating...");
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    showStatus("Updated. Save product to persist this order.");
  };
  const remove = (index: number) => {
    const item = items[index];
    if (
      !item.isNew &&
      !window.confirm(
        `Remove ${summary(item, index)}? Existing saved items will be removed when you save the product.`,
      )
    )
      return;
    showStatus("Removing...");
    setItems(items.filter((_, i) => i !== index));
    showStatus("Removed. Save product to persist this removal.");
  };
  const add = () => {
    showStatus("Adding...");
    setItems([...items, makeItem()]);
    showStatus("Added. Fill in details, then save product.");
  };
  return (
    <section className="grid gap-3 rounded-2xl border border-stone-200 p-4 md:col-span-2">
      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="text-sm text-slate-600">{help}</p>
        {status ? (
          <p
            className="mt-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800"
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-slate-600">
          {emptyLabel}
        </p>
      ) : null}
      <div className="grid gap-3">
        {items.map((item, index) => (
          <article
            className="rounded-2xl border border-stone-200 bg-white p-3"
            key={item.key}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black">
                {index + 1}. {summary(item, index)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-secondary px-3 py-2"
                  type="button"
                  onClick={() =>
                    setItems(
                      items.map((row, i) =>
                        i === index ? { ...row, editing: !row.editing } : row,
                      ),
                    )
                  }
                >
                  {item.editing ? "Done" : "Edit"}
                </button>
                <button
                  className="btn btn-secondary px-3 py-2"
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Move up
                </button>
                <button
                  className="btn btn-secondary px-3 py-2"
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Move down
                </button>
                <button
                  className="btn btn-secondary px-3 py-2"
                  type="button"
                  onClick={() => remove(index)}
                >
                  Remove
                </button>
              </div>
            </div>
            <div
              className={
                item.editing ? "mt-3 grid gap-3 md:grid-cols-2" : "hidden"
              }
              aria-hidden={!item.editing}
            >
              {children(item, index)}
            </div>
          </article>
        ))}
      </div>
      {limitReached ? (
        <p className="text-sm font-bold text-amber-700">
          Maximum reached: {max} items. Remove an item before adding another.
        </p>
      ) : (
        <button className="btn btn-secondary w-fit" type="button" onClick={add}>
          {addLabel}
        </button>
      )}
    </section>
  );
}

function MediaRows({ product }: { product?: AdminProductDetail }) {
  const [items, setItems] = useState<MediaItem[]>(() =>
    (product?.media ?? []).map((m, i) => ({
      key: `media-${i}`,
      type: m.type === "YOUTUBE" ? "YOUTUBE" : "IMAGE",
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      alt: m.alt,
      title: m.title,
      editing: false,
    })),
  );
  if (!product)
    return (
      <section className="grid gap-3 rounded-2xl border border-stone-200 p-4 md:col-span-2">
        <div>
          <h3 className="font-black text-slate-950">Product media</h3>
          <p className="text-sm text-slate-600">
            Save the product as draft before adding images or YouTube videos.
          </p>
        </div>
        <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-slate-600">
          Media controls are disabled until this draft has a product record.
        </p>
      </section>
    );
  return (
    <>
      <input type="hidden" name="mediaSubmitted" value="1" />
      <RepeatableList
        title="Product media"
        help="Current media list. Use Add media for add image or add YouTube link, then edit media, remove media, or move up/down. Limits: 8 images, 2 YouTube videos, 10 total media items."
        addLabel="+ Add media"
        max={maxProductMediaRows}
        items={items}
        setItems={setItems}
        emptyLabel="No product media yet. Add media when you are ready."
        makeItem={(): MediaItem => ({
          key: `new-media-${newKey++}`,
          type: "IMAGE",
          alt: product?.name,
          title: product?.name,
          editing: true,
          isNew: true,
        })}
        summary={(item) =>
          item.title ||
          item.alt ||
          (item.type === "YOUTUBE" ? "YouTube video" : "Image media")
        }
      >
        {(item, index) => (
          <>
            <input
              type="hidden"
              name={`mediaSortOrder${index}`}
              value={index}
            />
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Media kind
              <select
                className="input"
                name={`mediaType${index}`}
                value={item.type}
                onChange={(event) =>
                  setItems(
                    items.map((row) =>
                      row.key === item.key
                        ? {
                            ...row,
                            type: event.target.value as "IMAGE" | "YOUTUBE",
                          }
                        : row,
                    ),
                  )
                }
              >
                <option value="IMAGE">Upload image</option>
                <option value="YOUTUBE">Add YouTube video link</option>
              </select>
            </label>
            {item.type === "IMAGE" ? (
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                Image URL
                <input
                  className="input"
                  name={`mediaUrl${index}`}
                  defaultValue={item.url ?? ""}
                />
                <span className="text-xs font-medium text-slate-500">
                  Or upload a product image below.
                </span>
                <input
                  className="input"
                  name={`mediaUpload${index}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                />
              </label>
            ) : (
              <Field
                label="YouTube video URL"
                name={`mediaYoutubeUrl${index}`}
                defaultValue={item.url}
                placeholder="https://www.youtube.com/watch?v=..."
                hint="Paste a normal YouTube or youtu.be link. Video files are not uploaded."
              />
            )}
            {item.type === "YOUTUBE" ? (
              <Field
                label="Thumbnail URL"
                name={`mediaThumbnailUrl${index}`}
                defaultValue={item.thumbnailUrl}
                hint="Optional thumbnail shown before playback when supported."
              />
            ) : null}
            <Field
              label="Alt text"
              name={`mediaAlt${index}`}
              defaultValue={item.alt ?? product?.name}
              placeholder="Front view of StunFry compact safety device."
              hint="Describe the image for accessibility and SEO. Example: Front view of StunFry compact safety device."
            />
            <Field
              label="Title / aria label"
              name={`mediaTitle${index}`}
              defaultValue={item.title ?? product?.name}
              placeholder="Product demonstration video"
              hint="Short title used for accessibility. Example: Product demonstration video."
            />
          </>
        )}
      </RepeatableList>
    </>
  );
}

function ContentRows({ product }: { product?: AdminProductDetail }) {
  const [features, setFeatures] = useState<FeatureItem[]>(() =>
    (product?.features ?? []).map((f, i) => ({ key: `feature-${i}`, ...f })),
  );
  const overview = product?.contentSections.find(
    (section) => section.sectionKey === "overview",
  );
  const stateAvailability = product?.contentSections.find(
    (section) => section.sectionKey === "state_requirements",
  );
  const normalSections = (product?.contentSections ?? []).filter((section) =>
    ["features_design", "comparison", "custom_section"].includes(
      section.sectionKey,
    ),
  );
  const normalOffset = 2;
  const [sections, setSections] = useState<SectionItem[]>(() =>
    normalSections.map((s, i) => ({ key: `section-${i}`, ...s })),
  );
  const [included, setIncluded] = useState<IncludedItem[]>(() =>
    (product?.includedItems ?? []).map((row, i) => ({
      key: `included-${i}`,
      ...row,
    })),
  );
  const [specs, setSpecs] = useState<SpecItem[]>(() =>
    (product?.specs ?? []).map((row, i) => ({ key: `spec-${i}`, ...row })),
  );
  const [faqs, setFaqs] = useState<FaqItem[]>(() =>
    (product?.faqs ?? []).map((row, i) => ({ key: `faq-${i}`, ...row })),
  );
  return (
    <div className="grid gap-6 md:col-span-2">
      <input type="hidden" name="featuresSubmitted" value="1" />
      <input type="hidden" name="contentSubmitted" value="1" />
      <input type="hidden" name="includedSubmitted" value="1" />
      <input type="hidden" name="specsSubmitted" value="1" />
      <input type="hidden" name="faqsSubmitted" value="1" />
      <TextArea
        label="Top product summary"
        name="description"
        defaultValue={product?.description}
        rows={3}
        placeholder="Compact safety device designed for responsible personal protection."
        hint="Brief summary shown near the top of the product page."
      />
      <>
        <input type="hidden" name="sectionKey0" value="overview" />
        <input type="hidden" name="sectionTitle0" value="Top product summary" />
        <input type="hidden" name="sectionSortOrder0" value="0" />
        <TextArea
          label="Top product summary"
          name="sectionBody0"
          defaultValue={overview?.body}
          rows={3}
          hint="Optional override for the summary next to the product media. Leave blank to use the short description."
        />
      </>
      <>
        <input type="hidden" name="sectionKey1" value="state_requirements" />
        <input
          type="hidden"
          name="sectionTitle1"
          value="State availability copy"
        />
        <input type="hidden" name="sectionSortOrder1" value="1" />
        <TextArea
          label="State availability copy"
          name="sectionBody1"
          defaultValue={stateAvailability?.body}
          rows={3}
          hint="Compliance box copy shown for restricted products."
        />
      </>
      <RepeatableList
        title="Normal content sections shown as page blocks"
        help="Add page blocks that render between the product hero and included/spec/FAQ areas. Overview, included items, specs, FAQs, and state availability have their own editors below."
        addLabel="+ Add content section"
        max={maxProductContentRows}
        items={sections}
        setItems={setSections}
        emptyLabel="No normal content sections yet."
        makeItem={() => ({
          key: `new-section-${newKey++}`,
          sectionKey: "features_design",
          title: product?.name ?? "Product section",
          editing: true,
          isNew: true,
        })}
        summary={(item) => item.title || "Content section"}
      >
        {(item, index) => {
          const formIndex = normalOffset + index;
          return (
            <>
              <Select
                label="Section type"
                name={`sectionKey${formIndex}`}
                defaultValue={item.sectionKey ?? "features_design"}
                values={normalProductSectionKeys}
              />
              <Field
                label="Title"
                name={`sectionTitle${formIndex}`}
                defaultValue={item.title ?? product?.name}
              />
              <input
                type="hidden"
                name={`sectionSortOrder${formIndex}`}
                value={formIndex}
              />
              <Field
                label="Eyebrow"
                name={`sectionEyebrow${formIndex}`}
                defaultValue={item.eyebrow}
              />
              <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
                Body
                <textarea
                  className="input min-h-24"
                  name={`sectionBody${formIndex}`}
                  defaultValue={item.body ?? ""}
                />
              </label>
            </>
          );
        }}
      </RepeatableList>
      <RepeatableList
        title="Features"
        help="Short selling points shown as bullet points. Example: Compact size for everyday carry."
        addLabel="+ Add feature"
        max={maxProductFeatureRows}
        items={features}
        setItems={setFeatures}
        emptyLabel="No features yet."
        makeItem={() => ({
          key: `new-feature-${newKey++}`,
          editing: true,
          isNew: true,
        })}
        summary={(item) => item.label || item.code || "Feature"}
      >
        {(item, index) => (
          <>
            <Field
              label="Internal code"
              name={`featureCode${index}`}
              defaultValue={item.code}
              placeholder="compact-carry"
              hint="Internal identifier for this feature."
            />
            <Field
              label="Label"
              name={`featureLabel${index}`}
              defaultValue={item.label}
              placeholder="Compact size for everyday carry."
              hint="Customer-facing feature text."
            />
            <Field
              label="Value"
              name={`featureValue${index}`}
              defaultValue={item.value}
              placeholder="Fits easily in a bag or pocket."
              hint="Optional supporting detail."
            />
            <label className="flex items-end gap-2 pb-3 text-sm font-bold">
              <input
                defaultChecked={item.restrictedRelevant}
                name={`featureRestricted${index}`}
                type="checkbox"
              />
              Restricted review
            </label>
          </>
        )}
      </RepeatableList>
      <RepeatableList
        title="Included items"
        help="Items included in the box. Example: Charging cable."
        addLabel="+ Add included item"
        max={maxProductIncludedRows}
        items={included}
        setItems={setIncluded}
        emptyLabel="No included items yet."
        makeItem={() => ({
          key: `new-included-${newKey++}`,
          quantity: 1,
          editing: true,
          isNew: true,
        })}
        summary={(item) => item.label || "Included item"}
      >
        {(item, index) => (
          <>
            <Field
              label="Label"
              name={`includedLabel${index}`}
              defaultValue={item.label}
            />
            <Field
              label="Description"
              name={`includedDescription${index}`}
              defaultValue={item.description}
            />
            <Field
              label="Quantity"
              name={`includedQuantity${index}`}
              defaultValue={item.quantity ?? 1}
              type="number"
            />
            <input
              type="hidden"
              name={`includedSortOrder${index}`}
              value={index}
            />
          </>
        )}
      </RepeatableList>
      <RepeatableList
        title="Specifications"
        help="Technical product details. Example: Label Battery, Value Rechargeable lithium battery."
        addLabel="+ Add specification"
        max={maxProductSpecRows}
        items={specs}
        setItems={setSpecs}
        emptyLabel="No specifications yet."
        makeItem={() => ({
          key: `new-spec-${newKey++}`,
          editing: true,
          isNew: true,
        })}
        summary={(item) => item.label || "Specification"}
      >
        {(item, index) => (
          <>
            <Field
              label="Group"
              name={`specGroup${index}`}
              defaultValue={item.group}
            />
            <Field
              label="Label"
              name={`specLabel${index}`}
              defaultValue={item.label}
            />
            <Field
              label="Value"
              name={`specValue${index}`}
              defaultValue={item.value}
            />
            <input type="hidden" name={`specSortOrder${index}`} value={index} />
          </>
        )}
      </RepeatableList>
      <RepeatableList
        title="FAQs"
        help="Questions customers may ask before buying."
        addLabel="+ Add FAQ"
        max={maxProductFAQRows}
        items={faqs}
        setItems={setFaqs}
        emptyLabel="No FAQs yet."
        makeItem={() => ({
          key: `new-faq-${newKey++}`,
          editing: true,
          isNew: true,
        })}
        summary={(item) => item.question || "FAQ"}
      >
        {(item, index) => (
          <>
            <Field
              label="Question"
              name={`faqQuestion${index}`}
              defaultValue={item.question}
            />
            <Field
              label="Answer"
              name={`faqAnswer${index}`}
              defaultValue={item.answer}
            />
            <input type="hidden" name={`faqSortOrder${index}`} value={index} />
          </>
        )}
      </RepeatableList>
    </div>
  );
}

export function ProductForm({
  product,
  categories = [],
}: {
  product?: AdminProductDetail;
  categories?: Array<{ id: string; name: string; slug: string; status?: string; archivedAt?: string | null }>;
}) {
  const [state, formAction] = useActionState<ProductActionState, FormData>(
    product ? updateProductAction : createProductAction,
    {},
  );
  const isEditing = Boolean(product);
  const [visibleStatus, setVisibleStatus] = useState(
    product?.status ?? "DRAFT",
  );
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "Stun Fry");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [slugManual, setSlugManual] = useState(
    isEditing || Boolean(product?.slug),
  );
  const [skuManual, setSkuManual] = useState(
    isEditing || Boolean(product?.sku),
  );
  const categoryName =
    categories.find((category) => category.id === categoryId)?.name ?? "";
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
    if (!isEditing && !skuManual && name && categoryName)
      setSku(localSku(brand, categoryName, name));
  }, [brand, categoryName, isEditing, name, skuManual]);
  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="grid gap-6"
    >
      {product ? <input name="id" type="hidden" value={product.id} /> : null}
      <AlertPanel title="Create products here" tone="info">
        Create products here. Draft products stay hidden from customers. Active
        products appear on the storefront after required fields are complete.
      </AlertPanel>
      {state.error ? (
        <AlertPanel title="Product change blocked" tone="danger">
          {state.error}
        </AlertPanel>
      ) : null}
      {state.success ? (
        <AlertPanel title="Product saved" tone="success">
          {state.success}
        </AlertPanel>
      ) : null}
      <FormSection
        title="Publishing controls"
        description="Save / publish controls. Current status and save actions. Publish validates required fields before setting Active."
      >
        <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-slate-700">
          Current status: {visibleStatus}
        </p>
        <TextArea
          label="Owner note"
          name="auditNote"
          rows={3}
          placeholder="Updated product details for launch."
          hint="Optional internal note for the audit trail. Required when archiving."
        />
        {product ? (
          <div className="flex flex-wrap gap-3">
            <Link
              className="btn btn-secondary md:w-fit"
              href={`/admin/products/${product.id}/preview`}
            >
              Preview product page
            </Link>
            {product.status === "ACTIVE" ? (
              <Link
                className="btn btn-secondary md:w-fit"
                href={`/products/${product.slug}`}
              >
                View live public page
              </Link>
            ) : null}
          </div>
        ) : (
          <span className="text-sm font-bold text-slate-500">
            Preview product page is available after saving.
          </span>
        )}
        <AdminSubmitButton
          className="btn btn-secondary md:w-fit"
          name="intent"
          value="draft"
          pendingLabel="Saving..."
          success={state.ok && state.intent === "draft"}
          successLabel="Saved"
        >
          Save draft
        </AdminSubmitButton>
        <AdminSubmitButton
          className="btn btn-primary md:w-fit"
          name="intent"
          value="continue"
          pendingLabel="Saving..."
          success={state.ok && state.intent === "continue"}
          successLabel="Saved"
        >
          Save and continue editing
        </AdminSubmitButton>
        <AdminSubmitButton
          className="btn btn-primary md:w-fit"
          name="intent"
          value="publish"
          pendingLabel="Publishing..."
          success={state.ok && state.intent === "publish"}
          successLabel="Published"
        >
          Publish / Set active
        </AdminSubmitButton>
        <AdminSubmitButton
          className="btn btn-secondary md:w-fit"
          name="intent"
          value="archive"
          pendingLabel="Archiving..."
          success={state.ok && state.intent === "archive"}
          successLabel="Archived"
        >
          Archive
        </AdminSubmitButton>
      </FormSection>
      <FormSection
        title="Basic product information"
        description="Basic product info for creating a draft. Required fields are marked neutrally; URL and inventory identifiers can be auto-generated and manually overridden."
      >
        <Field
          label="Product name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="StunFry Compact Safety Device"
          hint="Shown on the product page, cart, checkout, and admin orders."
          required
        />
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          <span>
            Category
            <span className="ml-2 text-xs font-semibold text-slate-500">
              Required
            </span>
          </span>
          <select
            className="input"
            name="categoryId"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              if (!isEditing) setSkuManual(false);
            }}
            aria-required
          >
            <option value="">Choose a product category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-medium text-slate-500">
            Customer-facing product category used for browsing.
          </span>
        </label>
        {product?.categoryId && categories.find((category) => category.id === product.categoryId && ((category.status && category.status !== "ACTIVE") || category.archivedAt)) ? (
          <AlertPanel title="Assigned category is inactive" tone="warning">This product is assigned to an inactive or archived category. It remains selected so saving unrelated fields will not clear the category.</AlertPanel>
        ) : null}
        <Field
          label="Create and assign new category"
          name="newCategoryName"
          placeholder="New category name"
          hint="Optional. If filled, an ACTIVE category is created and assigned to this product on save."
        />
        <Field
          label="Brand"
          name="brand"
          value={brand}
          onChange={(event) => {
            setBrand(event.target.value);
            if (!isEditing) setSkuManual(false);
          }}
          placeholder="Stun Fry"
          hint="Brand shown to customers and admins."
        />
        <Select
          label="Status"
          name="status"
          value={visibleStatus}
          onChange={(event) => setVisibleStatus(event.target.value)}
          values={productStatuses}
          hint="Draft is hidden. Active is visible when required data and inventory rules allow it. Archived is hidden but kept for records."
          required
        />
      </FormSection>
      <FormSection
        title="Advanced URL settings"
        description="Slug and SKU are auto-generated for new products but remain editable when you need custom identifiers."
        open={Boolean(product)}
      >
        <Field
          label="Product slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugManual(true);
            setSlug(clientSlugify(event.target.value));
          }}
          placeholder="stunfry-compact-safety-device"
          hint="Auto-generated from product name. Edit only if you need a custom URL."
        />
        {product ? (
          <button
            className="btn btn-secondary md:w-fit"
            type="button"
            onClick={() => {
              setSlugManual(true);
              setSlug(clientSlugify(name));
            }}
          >
            Regenerate slug from name
          </button>
        ) : null}
        <Field
          label="SKU"
          name="sku"
          value={sku}
          onChange={(event) => {
            setSkuManual(true);
            setSku(event.target.value.toUpperCase());
          }}
          placeholder="SF-SG-COMPACT-1042"
          hint="Auto-generated for inventory and fulfillment. Edit only if you need a custom SKU."
        />
        {product ? (
          <button
            className="btn btn-secondary md:w-fit"
            type="button"
            onClick={() => {
              setSkuManual(true);
              setSku(localSku(brand, categoryName, name));
            }}
          >
            Regenerate SKU
          </button>
        ) : null}
      </FormSection>
      <FormSection title="Pricing and inventory">
        <Field
          label="Price"
          name="price"
          defaultValue={product?.price?.toFixed(2)}
          type="number"
          placeholder="49.99"
          hint="Customer price in USD before tax and shipping."
          required
        />
        <Field
          label="Compare-at price"
          name="compareAtPrice"
          type="number"
          placeholder="69.99"
          hint="Optional crossed-out price shown for sale display."
        />
        <Field
          label="Cost"
          name="cost"
          type="number"
          placeholder="22.50"
          hint="Internal product cost. Not shown to customers."
        />
        <Field
          label="Stock quantity"
          name="stockQuantity"
          defaultValue={product?.stock ?? 0}
          type="number"
          placeholder="100"
          hint="Available quantity for sale."
        />
        <Field
          label="Low stock threshold"
          name="lowStockThreshold"
          defaultValue={0}
          type="number"
          placeholder="10"
          hint="Admin warning level when inventory is low."
        />
      </FormSection>
      <FormSection
        title="Compliance"
        description="Use STUN_GUN for stun-gun products; do not use knuckle_stun_device as a category or restricted class."
      >
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            defaultChecked={product?.restricted}
            name="restricted"
            type="checkbox"
          />
          Restricted product
          <span className="text-xs font-medium text-slate-500">
            Turn this on for stun guns or other regulated self-defense products.
          </span>
        </label>
        <Select
          label="Restricted class"
          name="restrictedClass"
          defaultValue={product?.restrictedClass ?? "STUN_GUN"}
          values={restrictedClassOptions}
          hint="Used by checkout to apply state and age rules. Options include STUN_GUN."
        />
        <AlertPanel title="Age requirement display" tone="warning">
          Restricted products require DOB verification at checkout.
        </AlertPanel>
        <AlertPanel title="State restriction coverage" tone="warning">
          Checkout blocks states with BLOCK rules and allows states with ALLOW
          rules.
        </AlertPanel>
      </FormSection>
      <FormSection
        title="Product media"
        description="Use the dynamic media list. There are no fixed empty slots; sort order is automatic."
        open={false}
      >
        <MediaRows product={product} />
      </FormSection>
      <FormSection
        title="Product page content"
        description="Repeatable product content uses Add item, Edit, Remove, Move up, and Move down controls."
        open={false}
      >
        <ContentRows product={product} />
      </FormSection>
      <FormSection title="SEO/search preview" open={false}>
        <Field
          label="Meta title"
          name="metaTitle"
          defaultValue={product?.name}
          placeholder="StunFry Compact Safety Device"
          hint="Title shown in search results. Keep it clear and under about 60 characters."
        />
        <TextArea
          label="Meta description"
          name="metaDescription"
          rows={3}
          defaultValue={product?.description}
          placeholder="Compact safety device with responsible compliance checks."
          hint="Short search result description. Keep it under about 160 characters."
        />
        <Field
          label="Search keywords"
          name="searchKeywords"
          placeholder="compact safety device, stun gun"
          hint="Internal keywords for admin/search. Do not keyword stuff."
        />
      </FormSection>
    </form>
  );
}
