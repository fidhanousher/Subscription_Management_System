import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  QUOTATION: "bg-sky-100 text-sky-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-amber-100 text-amber-800",
  CLOSED: "bg-slate-200 text-slate-700",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
  OVERDUE: "bg-rose-100 text-rose-800",
  ADMIN: "bg-violet-100 text-violet-800",
  STAFF: "bg-sky-100 text-sky-800",
  CUSTOMER: "bg-teal-100 text-teal-800",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[value] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
