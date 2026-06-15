"use client";

import { MessageSquareText } from "lucide-react";
import { EmptyState, GlassCard } from "@/components/ui/primitives";
import type { DashboardStats } from "@/lib/types";

export function FreeTextTab({ stats }: { stats: DashboardStats }) {
  const blocks = stats.freeText.filter((b) => b.answers.length > 0);
  if (!blocks.length) {
    return (
      <GlassCard>
        <EmptyState icon={<MessageSquareText className="h-7 w-7" />} title="Aucune réponse libre" hint="Les commentaires des collaborateurs s'afficheront ici." />
      </GlassCard>
    );
  }
  return (
    <div className="space-y-5">
      {blocks.map((block) => (
        <GlassCard key={block.questionId}>
          <h3 className="mb-3 font-display text-base font-semibold text-ink">{block.label}</h3>
          <div className="space-y-2.5">
            {block.answers.map((a, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="mb-1 flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-slate-800">{a.name}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-500">{a.dept}</span>
                </div>
                <p className="text-[13px] leading-relaxed text-slate-600">{a.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
