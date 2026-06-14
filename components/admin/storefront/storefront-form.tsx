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

export function StorefrontSettingsForm({ content }: { content: StorefrontContent }) {
  return (
    <form action={saveStorefrontContentAction} className="grid gap-6">
      <AlertPanel title="Owner-editable storefront copy" tone="info">
        These settings drive the public homepage. Leave image URL empty to use the branded Stun Fry placeholder.
      </AlertPanel>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <TextInput label="Hero eyebrow" name="heroEyebrow" value={content.heroEyebrow} />
        <TextInput label="Announcement bar text" name="announcementBarText" value={content.announcementBarText} />
        <div className="md:col-span-2">
          <TextArea label="Hero title" name="heroTitle" rows={3} value={content.heroTitle} />
        </div>
        <div className="md:col-span-2">
          <TextArea label="Hero subtitle" name="heroSubtitle" value={content.heroSubtitle} />
        </div>
        <TextInput label="Primary CTA label" name="primaryCtaLabel" value={content.primaryCtaLabel} />
        <TextInput label="Primary CTA link" name="primaryCtaLink" value={content.primaryCtaLink} />
        <TextInput label="Secondary CTA label" name="secondaryCtaLabel" value={content.secondaryCtaLabel} />
        <TextInput label="Secondary CTA link" name="secondaryCtaLink" value={content.secondaryCtaLink} />
        <TextInput label="Hero image URL" name="heroImageUrl" value={content.heroImageUrl} />
        <TextInput label="Hero placeholder key" name="heroPlaceholderKey" value={content.heroPlaceholderKey} />
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <TextInput label="Featured section eyebrow" name="featuredSectionEyebrow" value={content.featuredSectionEyebrow} />
        <TextInput label="Featured section title" name="featuredSectionTitle" value={content.featuredSectionTitle} />
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


      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-lg font-black">Eligibility pop-up copy</h2>
          <p className="mt-1 text-sm text-slate-600">Shown before restricted browsing and checkout pre-checks. This text must not promise final legal approval.</p>
        </div>
        <TextInput label="Popup title" name="eligibilityPopupTitle" value={content.eligibilityPopupTitle} />
        <TextInput label="State label" name="eligibilityStateLabel" value={content.eligibilityStateLabel} />
        <TextInput label="ZIP label" name="eligibilityZipLabel" value={content.eligibilityZipLabel} />
        <div className="md:col-span-2">
          <TextArea label="Popup body" name="eligibilityPopupBody" value={content.eligibilityPopupBody} />
        </div>
        <div className="md:col-span-2">
          <TextArea label="Age confirmation text" name="eligibilityAgeConfirmationText" value={content.eligibilityAgeConfirmationText} rows={2} />
        </div>
        <div className="md:col-span-2">
          <TextArea label="Acknowledgement text" name="eligibilityAcknowledgementText" value={content.eligibilityAcknowledgementText} rows={2} />
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
