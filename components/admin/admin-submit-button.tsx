"use client";

import { useFormStatus } from "react-dom";

type AdminSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  pendingLabel?: string;
  success?: boolean;
  successLabel?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function AdminSubmitButton({ children, className = "btn btn-primary", name, value, pendingLabel = "Saving...", success = false, successLabel = "Saved", disabled = false, onClick }: AdminSubmitButtonProps) {
  const { pending, data } = useFormStatus();
  const active = pending && (!name || data?.get(name) === value);
  return (
    <button className={className} name={name} value={value} disabled={disabled || pending} type="submit" aria-busy={active} onClick={onClick}>
      {active ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : null}
      {active ? pendingLabel : success ? successLabel : children}
    </button>
  );
}
