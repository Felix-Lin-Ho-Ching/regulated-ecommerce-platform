"use client";

import { useActionState } from "react";
import type { HomepageHeroMedia } from "@/lib/storefront/homepage-media";
import { saveHomepageMediaAction, type HomepageMediaFormState } from "@/lib/storefront/homepage-media-actions";

function ErrorText({ message }: { message?: string }) { return message ? <p className="text-sm font-bold text-red-700">{message}</p> : null; }
function Field({ label, name, value, error }: { label: string; name: string; value?: string; error?: string }) { return <label className="grid gap-2 text-sm font-bold text-slate-800">{label}<input className={`input ${error ? "border-red-600" : ""}`} name={name} defaultValue={value ?? ""}/><ErrorText message={error}/></label>; }

export function HomepageMediaForm({ media }: { media: HomepageHeroMedia }) {
  const initial: HomepageMediaFormState = { ok: false, errors: {} };
  const [state, action, pending] = useActionState(saveHomepageMediaAction, initial);
  return <form action={action} className="card grid gap-4 p-5 md:grid-cols-2">
    <div className="md:col-span-2"><h2 className="text-lg font-black">Homepage media</h2><p className="mt-1 text-sm text-slate-600">Configure the hero story media independently from product media. URL-based image and video sources are supported.</p>{state.ok ? <p className="mt-2 text-sm font-bold text-green-700">Homepage media saved.</p> : null}</div>
    <label className="grid gap-2 text-sm font-bold text-slate-800">Media type<select className="input" name="homepageType" defaultValue={media.type}><option value="IMAGE">IMAGE</option><option value="VIDEO">VIDEO</option></select></label>
    <label className="flex items-center gap-2 text-sm font-bold text-slate-800"><input name="homepageEnabled" type="checkbox" defaultChecked={media.enabled}/> Enabled</label>
    <Field label="Media URL" name="homepageUrl" value={media.url} error={state.errors.homepageUrl}/>
    <Field label="Thumbnail / fallback URL" name="homepageThumbnailUrl" value={media.thumbnailUrl} error={state.errors.homepageThumbnailUrl}/>
    <Field label="Alt text" name="homepageAlt" value={media.alt}/>
    <Field label="CTA link" name="homepageCtaHref" value={media.ctaHref} error={state.errors.homepageCtaHref}/>
    <div className="md:col-span-2"><Field label="Hero title" name="homepageTitle" value={media.title}/></div>
    <label className="grid gap-2 text-sm font-bold text-slate-800 md:col-span-2">Hero subtitle<textarea className="input min-h-24" name="homepageSubtitle" defaultValue={media.subtitle ?? ""}/></label>
    <Field label="CTA label" name="homepageCtaLabel" value={media.ctaLabel}/>
    <label className="grid gap-2 text-sm font-bold text-slate-800">Required audit note<textarea className={`input min-h-24 ${state.errors.homepageAuditNote ? "border-red-600" : ""}`} name="homepageAuditNote"/><ErrorText message={state.errors.homepageAuditNote}/></label>
    <div className="md:col-span-2"><button className="btn btn-primary" disabled={pending} type="submit">{pending ? "Saving..." : "Save homepage media"}</button></div>
  </form>;
}
