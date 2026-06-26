import { saveStorefrontContentAction } from "@/lib/storefront-content/actions";
import type { StorefrontContent } from "@/lib/storefront-content/defaults";
import { AlertPanel } from "@/components/common/panels";

function TextInput({ label, name, value }: { label: string; name: keyof StorefrontContent | "auditNote"; value?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      {label}
      <input className="input" name={name} defaultValue={value} />
    </label>
  );
}

function TextArea({ label, name, value, rows = 4 }: { label: string; name: keyof StorefrontContent | "auditNote"; value?: string; rows?: number }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      {label}
      <textarea className="input min-h-28" name={name} defaultValue={value} rows={rows} />
    </label>
  );
}

function HiddenStorefrontDefaults({ content }: { content: StorefrontContent }) {
  const hiddenFields: Array<keyof StorefrontContent> = [
    "heroEyebrow",
    "heroTitle",
    "heroSubtitle",
    "primaryCtaLabel",
    "primaryCtaLink",
    "secondaryCtaLabel",
    "secondaryCtaLink",
    "heroImageUrl",
    "heroPlaceholderKey",
    "eligibilityPopupTitle",
    "eligibilityPopupBody",
    "eligibilityAgeConfirmationText",
    "eligibilityStateLabel",
    "eligibilityZipLabel",
    "eligibilityAcknowledgementText",
  ];

  return (
    <>
      {hiddenFields.map((field) => (
        <input key={field} type="hidden" name={field} value={String(content[field] ?? "")} />
      ))}
    </>
  );
}

export function StorefrontSettingsForm({ content }: { content: StorefrontContent }) {
  return (
    <form action={saveStorefrontContentAction} className="grid gap-6">
      <HiddenStorefrontDefaults content={content} />
      <AlertPanel title="Homepage section copy" tone="info">
        The public homepage hero is controlled by the slideshow above. These fields only update visible homepage section copy.
      </AlertPanel>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <TextInput label="Announcement bar text" name="announcementBarText" value={content.announcementBarText} />
        <TextInput label="Featured section eyebrow" name="featuredSectionEyebrow" value={content.featuredSectionEyebrow} />
        <div className="md:col-span-2">
          <TextInput label="Featured section title" name="featuredSectionTitle" value={content.featuredSectionTitle} />
        </div>
        <div className="md:col-span-2">
          <TextInput label="Trust/compliance section title" name="trustComplianceTitle" value={content.trustComplianceTitle} />
        </div>
        <div className="md:col-span-2">
          <TextArea label="Trust/compliance section body" name="trustComplianceBody" value={content.trustComplianceBody} />
        </div>
        <div className="md:col-span-2">
          <TextArea label="Trust badge labels, one per line" name="trustBadgeLabels" value={content.trustBadgeLabels.join("\n")} />
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <TextArea label="Required audit note" name="auditNote" rows={3} />
        <button className="btn btn-primary mt-4" type="submit">
          Save storefront settings
        </button>
      </section>
    </form>
  );
}
