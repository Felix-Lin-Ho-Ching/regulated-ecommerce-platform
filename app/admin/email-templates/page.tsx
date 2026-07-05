import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";
import { seedDefaultEmailTemplates } from "@/lib/email/template-service";
import { previewDefault } from "@/lib/email/template-service";
import { resetEmailTemplateAction, sendTestEmailAction, updateEmailTemplateAction } from "@/lib/email/admin-actions";
export default async function EmailTemplatesPage() {
  const actor = await requireAdminSession("/admin/email-templates");
  if (!["OWNER", "ADMIN"].includes(actor.role)) return <AdminShell title="Email templates" currentPath="/admin/email-templates"><p>Only owner/admin can manage email templates.</p></AdminShell>;
  await seedDefaultEmailTemplates(prisma as any).catch(() => undefined);
  const templates = await (prisma as any).emailTemplate.findMany({ orderBy: { type: "asc" }, include: { versions: { orderBy: { createdAt: "desc" }, take: 5 } } });
  const logs = await (prisma as any).emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return <AdminShell title="Email templates" currentPath="/admin/email-templates">
    <div className="grid gap-6">
      {templates.map((t: any) => { const preview = previewDefault(t.type); return <section key={t.id} className="card p-5"><h2 className="font-black">{t.name}</h2><p className="text-xs text-slate-500">{t.type} · version {t.version} · {t.enabled ? "Enabled" : "Disabled"}</p>
        <form action={updateEmailTemplateAction} className="mt-4 grid gap-3"><input type="hidden" name="id" value={t.id}/><label className="text-sm font-bold">Subject<input className="input mt-1" name="subject" defaultValue={t.subject}/></label><label className="text-sm font-bold">Text body<textarea className="input mt-1 min-h-40" name="textBody" defaultValue={t.textBody}/></label><label className="text-sm font-bold">HTML body<textarea className="input mt-1 min-h-40 font-mono" name="htmlBody" defaultValue={t.htmlBody}/></label><label className="flex gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={t.enabled}/> Enabled</label><button className="btn-primary w-fit">Save template</button></form>
        <div className="mt-3 flex gap-2"><form action={resetEmailTemplateAction}><input type="hidden" name="id" value={t.id}/><button className="btn-secondary">Reset to default</button></form><form action={sendTestEmailAction}><input type="hidden" name="type" value={t.type}/><button className="btn-secondary">Send test to me</button></form></div>
        <details className="mt-4"><summary className="cursor-pointer font-bold">Preview with fake order data</summary><h3 className="mt-3 font-bold">{preview.subject}</h3><pre className="mt-2 whitespace-pre-wrap rounded bg-slate-100 p-3 text-xs">{preview.text}</pre><div className="mt-2 rounded border p-3" dangerouslySetInnerHTML={{ __html: preview.html }}/></details>
        <details className="mt-4"><summary className="cursor-pointer font-bold">Version history</summary><ul className="mt-2 text-sm">{t.versions.map((v: any) => <li key={v.id}>v{v.version} · {v.createdAt.toISOString()} · {v.subject}</li>)}</ul></details>
      </section>; })}
      <section className="card p-5"><h2 className="font-black">Email logs</h2><ul className="mt-3 grid gap-2 text-sm">{logs.map((l: any) => <li key={l.id}>{l.createdAt.toISOString()} · {l.type} · {l.to} · {l.status}/{l.provider} · {l.subject}</li>)}</ul></section>
    </div>
  </AdminShell>;
}
