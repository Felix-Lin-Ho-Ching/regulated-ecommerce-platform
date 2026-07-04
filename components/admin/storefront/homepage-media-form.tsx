"use client";

import { useActionState, useState } from "react";
import type { HomepageSlide } from "@/lib/storefront/homepage-slides";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { saveHomepageMediaAction, type HomepageMediaFormState } from "@/lib/storefront/homepage-media-actions";

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="text-xs font-bold text-red-700">{message}</p> : null;
}

function Field({
  label,
  name,
  value,
  error,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string | number;
  error?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      {label}
      <input
        className={`input ${error ? "border-red-600" : ""}`}
        name={name}
        type={type}
        defaultValue={value ?? ""}
      />
      <ErrorText message={error} />
    </label>
  );
}

function SlideForm({ slide, isNew = false }: { slide: HomepageSlide; isNew?: boolean }) {
  const initial: HomepageMediaFormState = { ok: false, errors: {} };
  const [state, action] = useActionState(saveHomepageMediaAction, initial);

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="card grid gap-4 p-5 md:grid-cols-2"
    >
      <input type="hidden" name="homepageId" value={slide.id} />

      <div className="md:col-span-2 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black">{isNew ? "Add slideshow media" : slide.headline}</h3>
          <p className="text-sm text-slate-600">Slides use image media or YouTube URLs plus an accessibility label. Overlay copy is not shown on the public homepage.</p>
          {state.ok ? <p className="mt-2 text-sm font-bold text-green-700">Slide saved.</p> : null}
        </div>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input name="homepageEnabled" type="checkbox" defaultChecked={slide.enabled} /> Enabled
        </label>
      </div>

      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Media type
        <select className="input" name="homepageType" defaultValue={slide.type}>
          <option value="IMAGE">IMAGE</option>
          <option value="YOUTUBE">YOUTUBE</option>
        </select>
      </label>
      <input type="hidden" name="homepageSortOrder" value={slide.sortOrder} />

      <div className="grid gap-2">
        <Field label="Image or YouTube URL" name="homepageUrl" value={slide.url} error={state.errors.homepageUrl} />
        <p className="text-center text-xs font-black uppercase text-slate-500">or</p>
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Upload image file
          <input
            className="input"
            name="homepageUpload"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          />
          <ErrorText message={state.errors.homepageUpload} />
        </label>
      </div>

      <div className="grid gap-2">
        <Field
          label="Optional thumbnail image URL"
          name="homepageThumbnailUrl"
          value={slide.thumbnailUrl}
          error={state.errors.homepageThumbnailUrl}
        />
        <p className="text-center text-xs font-black uppercase text-slate-500">or</p>
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Upload fallback image
          <input
            className="input"
            name="homepageThumbnailUpload"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          />
          <ErrorText message={state.errors.homepageThumbnailUpload} />
        </label>
      </div>

      <div className="md:col-span-2">
        <Field label="Alt/accessibility label" name="homepageHeadline" value={slide.headline} error={state.errors.homepageHeadline} />
      </div>
      <Field label="Slide link" name="homepageCtaHref" value={slide.ctaHref} error={state.errors.homepageCtaHref} />
      <input type="hidden" name="homepageSubheadline" value={slide.subheadline || ""} />
      <input type="hidden" name="homepageCtaLabel" value={slide.ctaLabel || "Shop products"} />
      <input type="hidden" name="homepageBadge1" value={slide.badge1 || ""} />
      <input type="hidden" name="homepageBadge2" value={slide.badge2 || ""} />
      <input type="hidden" name="homepageBadge3" value={slide.badge3 || ""} />
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Owner note
        <textarea className="input min-h-20" name="homepageAuditNote" />
      </label>

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <AdminSubmitButton className="btn btn-primary" name="intent" value="save" pendingLabel="Saving..." success={state.ok} successLabel="Saved">Save slide</AdminSubmitButton>
        {!isNew ? (
          <AdminSubmitButton className="btn btn-secondary" name="intent" value="delete" pendingLabel="Removing..." onClick={(event) => { if (!window.confirm("Remove this saved homepage slide?")) event.preventDefault(); }}>Remove slide</AdminSubmitButton>
        ) : null}
      </div>
    </form>
  );
}

export function HomepageMediaForm({ slides }: { slides: HomepageSlide[] }) {
  const maxSlides = 5;
  const [items, setItems] = useState(() => slides.map((slide) => ({ ...slide, editing: false, localKey: slide.id })));
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<string>();
  const nextOrder = items.length;
  const blank: HomepageSlide & { localKey?: string; editing?: boolean } = {
    id: "new",
    slot: "hero-slide",
    type: "IMAGE",
    url: "",
    headline: "",
    subheadline: "",
    ctaLabel: "Shop products",
    ctaHref: "/products",
    badge1: "Responsible ownership",
    badge2: "Secure order handling",
    badge3: "Verified at checkout",
    enabled: false,
    sortOrder: nextOrder,
    localKey: "new-slide",
    editing: true,
  };
  const showStatus = (message: string) => { setStatus(message); window.setTimeout(() => setStatus(undefined), 1800); };
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    showStatus("Updating...");
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((slide, sortOrder) => ({ ...slide, sortOrder })));
    showStatus("Updated. Save each edited slide to persist the new order.");
  };

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-xl font-black">Homepage slideshow</h2>
        <p className="text-sm text-slate-600">Manage current slides as a dynamic list. Use + Add slide, then edit, remove, or reorder. Recommended max: 5 slides.</p>
          {status ? <p className="mt-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800" role="status" aria-live="polite">{status}</p> : null}
      </div>
      {items.length === 0 ? <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-slate-600">No homepage slides exist. Add a slide to show slideshow media.</p> : null}
      <div className="grid gap-3">
        {items.map((slide, index) => (
          <article className="card grid gap-3 p-4" key={slide.localKey}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black">{index + 1}. {slide.headline || "Homepage slide"}</h3>
                <p className="text-sm text-slate-600">{slide.enabled ? "Enabled" : "Disabled"} · {slide.type}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-secondary px-3 py-2" type="button" onClick={() => setItems(items.map((row) => row.id === slide.id ? { ...row, editing: !row.editing } : row))}>{slide.editing ? "Done" : "Edit"}</button>
                <button className="btn btn-secondary px-3 py-2" type="button" disabled={index === 0} onClick={() => move(index, -1)}>Move up</button>
                <button className="btn btn-secondary px-3 py-2" type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)}>Move down</button>
              </div>
            </div>
            {slide.editing ? <SlideForm slide={slide} /> : <p className="text-sm text-slate-600">Open Edit to change this slide, save its current order, or remove it.</p>}
          </article>
        ))}
      </div>
      {adding ? <SlideForm slide={blank} isNew /> : items.length >= maxSlides ? <p className="text-sm font-bold text-amber-700">Maximum reached: 5 hero slides. Remove a slide before adding another.</p> : <button className="btn btn-secondary w-fit" type="button" onClick={() => { showStatus("Adding..."); setAdding(true); showStatus("Added. Fill in details, then save slide."); }}>+ Add slide</button>}
    </section>
  );
}
