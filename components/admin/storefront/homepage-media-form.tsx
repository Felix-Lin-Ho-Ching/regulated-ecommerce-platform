"use client";

import { useActionState } from "react";
import type { HomepageSlide } from "@/lib/storefront/homepage-slides";
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
      <input className={`input ${error ? "border-red-600" : ""}`} name={name} type={type} defaultValue={value ?? ""} />
      <ErrorText message={error} />
    </label>
  );
}

function SlideForm({ slide, isNew = false }: { slide: HomepageSlide; isNew?: boolean }) {
  const initial: HomepageMediaFormState = { ok: false, errors: {} };
  const [state, action, pending] = useActionState(saveHomepageMediaAction, initial);

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="card grid gap-4 p-5 md:grid-cols-2"
    >
      <input type="hidden" name="homepageId" value={slide.id} />

      <div className="flex items-start justify-between gap-4 md:col-span-2">
        <div>
          <h3 className="text-lg font-black">{isNew ? "Add hero slide" : slide.headline}</h3>
          <p className="text-sm text-slate-600">Slides use media, calm sales copy, CTA, and trust badges.</p>
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
          <option value="VIDEO">VIDEO</option>
        </select>
      </label>
      <Field label="Sort order" name="homepageSortOrder" type="number" value={slide.sortOrder} />

      <div className="grid gap-2">
        <Field label="Media URL" name="homepageUrl" value={slide.url} error={state.errors.homepageUrl} />
        <p className="text-center text-xs font-black uppercase text-slate-500">or</p>
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Upload media file
          <input
            className="input"
            name="homepageUpload"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
          />
          <ErrorText message={state.errors.homepageUpload} />
        </label>
      </div>

      <div className="grid gap-2">
        <Field
          label="Fallback image URL / video poster"
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
        <Field label="Headline" name="homepageHeadline" value={slide.headline} error={state.errors.homepageHeadline} />
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">
        Subheadline
        <textarea className="input min-h-24" name="homepageSubheadline" defaultValue={slide.subheadline} />
      </label>
      <Field label="CTA label" name="homepageCtaLabel" value={slide.ctaLabel} />
      <Field label="CTA link" name="homepageCtaHref" value={slide.ctaHref} error={state.errors.homepageCtaHref} />
      <Field label="Badge 1" name="homepageBadge1" value={slide.badge1} />
      <Field label="Badge 2" name="homepageBadge2" value={slide.badge2} />
      <Field label="Badge 3" name="homepageBadge3" value={slide.badge3} />
      <label className="grid gap-2 text-sm font-bold text-slate-800">
        Owner note
        <textarea className="input min-h-20" name="homepageAuditNote" />
      </label>

      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button className="btn btn-primary" name="intent" value="save" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save slide"}
        </button>
        {!isNew ? (
          <button className="btn btn-secondary" name="intent" value="delete" disabled={pending} type="submit">
            Delete slide
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function HomepageMediaForm({ slides }: { slides: HomepageSlide[] }) {
  const nextOrder = Math.max(-1, ...slides.map((slide) => slide.sortOrder)) + 1;
  const blank: HomepageSlide = {
    id: "new",
    slot: "hero-slide",
    type: "IMAGE",
    url: "",
    headline: "",
    subheadline: "",
    ctaLabel: "Shop devices",
    ctaHref: "/products",
    badge1: "Responsible ownership",
    badge2: "Secure order handling",
    badge3: "Verified at checkout",
    enabled: false,
    sortOrder: nextOrder,
  };

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-xl font-black">Homepage hero slideshow</h2>
        <p className="text-sm text-slate-600">Manage up to three active hero slides. Disabled slides may be saved without media.</p>
      </div>
      {slides.map((slide) => (
        <SlideForm key={slide.id} slide={slide} />
      ))}
      <SlideForm slide={blank} isNew />
    </section>
  );
}
