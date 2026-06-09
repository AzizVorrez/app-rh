"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { EmptyState, GlassCard } from "@/components/ui/primitives";
import type { DashboardStats } from "@/lib/types";

export function RecommendationsTab({ stats }: { stats: DashboardStats }) {
  const { recommendations } = stats;
  if (!recommendations.length) {
    return (
      <GlassCard>
        <EmptyState icon={<Sparkles className="h-7 w-7" />} title="Aucune recommandation pour l'instant" hint="Les recommandations apparaissent dès que des réponses sont collectées." />
      </GlassCard>
    );
  }
  return (
    <div>
      <p className="mb-4 text-xs text-slate-400">
        Générées automatiquement à partir des scores et tendances observées.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {recommendations.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="glass relative overflow-hidden p-5 pl-6"
          >
            <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: r.color }} />
            <div className="mb-1.5 flex items-center gap-2 text-sm font-bold" style={{ color: r.color }}>
              <span>{r.icon}</span>
              {r.title}
            </div>
            <p className="text-[13px] leading-relaxed text-slate-600">{r.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
