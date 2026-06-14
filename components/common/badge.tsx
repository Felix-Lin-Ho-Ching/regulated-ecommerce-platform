import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/mock-data";

const badgeToneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-800 border-slate-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: StatusTone;
}) {
  return <span className={cn("badge", badgeToneClasses[tone])}>{children}</span>;
}

export function RestrictedProductBadge() {
  return <StatusBadge tone="warning">Restricted item · Verified at checkout</StatusBadge>;
}
