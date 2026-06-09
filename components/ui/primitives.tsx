"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

/* ─── Button ─────────────────────────────────────────────────────────── */

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-brand-sm hover:bg-brand-700 active:bg-brand-700",
  accent: "bg-accent-600 text-white shadow-[0_6px_16px_-6px_rgba(5,150,105,0.5)] hover:bg-accent-700",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white shadow-[0_6px_16px_-6px_rgba(220,38,38,0.5)] hover:bg-red-700",
  subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "ring-focus inline-flex select-none items-center justify-center font-semibold transition-all duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

/* ─── Card ───────────────────────────────────────────────────────────── */

export function GlassCard({
  className,
  children,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn("glass p-5 sm:p-6", hover && "glass-hover", className)} {...props}>
      {children}
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────── */

export function Badge({
  className,
  tone = "brand",
  children,
}: {
  className?: string;
  tone?: "brand" | "accent" | "amber" | "red" | "slate" | "gold";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    accent: "bg-accent-50 text-accent-700 border-accent-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    gold: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ─── Form fields ────────────────────────────────────────────────────── */

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-xs font-semibold text-slate-700", className)} {...props}>
      {children}
    </label>
  );
}

const fieldBase =
  "ring-focus w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-400 disabled:opacity-50 disabled:bg-slate-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, "min-h-[96px] resize-y", className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          fieldBase,
          "appearance-none bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9",
          "[background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

/* ─── Switch ─────────────────────────────────────────────────────────── */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="ring-focus inline-flex items-center gap-2.5 disabled:opacity-50"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          checked ? "bg-brand-600" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200",
            checked ? "left-[1.45rem]" : "left-0.5",
          )}
        />
      </span>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </button>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────── */

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ─── Spinner / states ───────────────────────────────────────────────── */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand-600", className)} />;
}

export function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner className="h-7 w-7" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon && <div className="mb-1 text-slate-300">{icon}</div>}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="max-w-sm text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
