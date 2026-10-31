import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-dark shadow-sm disabled:opacity-50",
  secondary:
    "bg-white text-foreground border border-line hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-danger text-white hover:bg-red-700 disabled:opacity-50",
  ghost: "text-foreground hover:bg-slate-100 disabled:opacity-50",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
