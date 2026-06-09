"use client";

import { motion } from "framer-motion";
import { scoreClass } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

function StatCard({
  value,
  label,
  valueClass,
  delay,
}: {
  value: React.ReactNode;
  label: string;
  valueClass?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass glass-hover flex flex-col justify-center px-4 py-4"
    >
      <div className={`font-display text-2xl font-bold leading-none ${valueClass ?? "text-slate-900"}`}>{value}</div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
    </motion.div>
  );
}

export function StatGrid({ stats }: { stats: DashboardStats }) {
  const { totals } = stats;
  const npsClass = totals.nps == null ? "" : totals.nps >= 0 ? "text-accent-600" : "text-rose-600";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard value={totals.responses} label="Réponses" delay={0} />
      <StatCard
        value={totals.globalAvg != null ? `${totals.globalAvg.toFixed(1)}/5` : "—"}
        label="Score global"
        valueClass={scoreClass(totals.globalAvg)}
        delay={0.05}
      />
      <StatCard value={totals.nps ?? "—"} label="eNPS" valueClass={npsClass} delay={0.1} />
      <StatCard
        value={totals.dominantEmoji ?? "—"}
        label={totals.dominantLabel ?? "Ressenti"}
        delay={0.15}
      />
      <StatCard value={totals.promoters} label="Promoteurs" valueClass="text-accent-600" delay={0.2} />
      <StatCard value={totals.detractors} label="Détracteurs" valueClass="text-rose-600" delay={0.25} />
    </div>
  );
}
