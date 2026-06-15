import { cn } from "@/lib/utils";

/**
 * Official IZICHANGE wordmark (white) shown on a teal brand badge so it reads
 * on the light UI. Asset lives at /public/logo-white.png.
 */
export function Logo({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="inline-flex items-center rounded-xl bg-brand-600 px-3 py-2 shadow-brand-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="IZICHANGE" className="h-[18px] w-auto" />
      </span>
      {subtitle && (
        <span className="border-l border-slate-200 pl-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {subtitle}
        </span>
      )}
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
