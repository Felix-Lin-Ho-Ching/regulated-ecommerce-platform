import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/mock-data";

const panelToneClasses: Record<StatusTone, string> = {
  info: "border-blue-200 bg-blue-50",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
  success: "border-emerald-200 bg-emerald-50",
  neutral: "border-slate-200 bg-slate-50",
};

export function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? (
        <p className="text-sm font-bold uppercase tracking-[.2em] text-teal-900">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
      {children ? <p className="mt-3 max-w-3xl text-slate-600">{children}</p> : null}
    </header>
  );
}

export function AlertPanel({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: React.ReactNode;
  tone?: StatusTone;
}) {
  return (
    <section className={cn("rounded-2xl border p-4", panelToneClasses[tone])} role="status">
      <h2 className="font-black">{title}</h2>
      <div className="mt-1 text-sm text-slate-700">{children}</div>
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-slate-600">{children}</p>
    </div>
  );
}

export function FormField({
  label,
  value,
  hint,
  type = "text",
}: {
  label: string;
  value?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input className="input mt-2 focus-ring" defaultValue={value} type={type} />
      {hint ? <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}
