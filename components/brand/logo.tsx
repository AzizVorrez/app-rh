import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
        <path
          d="M7 8h9l-2.4-2.4M17 16H8l2.4 2.4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <div className="leading-tight">
        <div className="font-display text-[15px] font-bold tracking-tight text-ink">
          IZI<span className="text-brand-600">CHANGE</span>
        </div>
        {subtitle && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

/** Soft ambient color wash behind hero sections (very subtle on light). */
export function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-40 h-80 w-80 rounded-full bg-brand-300/25 blur-[120px]" />
      <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-accent-400/20 blur-[120px]" />
    </div>
  );
}
