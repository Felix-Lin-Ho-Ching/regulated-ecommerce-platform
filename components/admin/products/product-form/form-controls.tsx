import type { ChangeEventHandler, FocusEventHandler, ReactNode } from "react";

export function Field({
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
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
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
      {hint ? <span className="text-xs font-medium text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function TextArea({ label, name, defaultValue, rows = 4, hint, placeholder }: {
  label: string; name: string; defaultValue?: string | null; rows?: number; hint?: string; placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      {label}
      <textarea className="input" rows={rows} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} />
      {hint ? <span className="text-xs font-medium text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Select({ label, name, defaultValue, value, onChange, values, hint, required }: {
  label: string; name: string; defaultValue?: string; value?: string; onChange?: ChangeEventHandler<HTMLSelectElement>; values: readonly string[]; hint?: string; required?: boolean;
}) {
  const controlProps = value === undefined ? { defaultValue } : { value, onChange };
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-800">
      <span>{label}{required ? <span className="ml-2 text-xs font-semibold text-slate-500">Required</span> : null}</span>
      <select className="input" name={name} aria-required={required} {...controlProps}>
        {values.map((optionValue) => <option key={optionValue} value={optionValue}>{optionValue.replaceAll("_", " ")}</option>)}
      </select>
      {hint ? <span className="text-xs font-medium text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function FormSection({ title, description, children, open = true }: {
  title: string; description?: string; children: ReactNode; open?: boolean;
}) {
  return (
    <details className="card p-5" open={open}>
      <summary className="cursor-pointer text-lg font-black text-slate-950">{title}</summary>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </details>
  );
}
