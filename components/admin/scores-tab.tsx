"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/ui/primitives";
import { scoreHex } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

export function ScoresTab({ stats }: { stats: DashboardStats }) {
  const { themes, departments, ressenti, motivations } = stats;
  const ressentiData = ressenti.options.map((o, i) => ({
    name: o.split(" ")[0],
    label: o.split(" ").slice(1).join(" "),
    value: ressenti.counts[i] ?? 0,
  }));
  const maxRessenti = Math.max(...ressentiData.map((d) => d.value), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Theme scores */}
      <GlassCard className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink">Scores par thématique</h3>
          <Legend />
        </div>
        <div className="space-y-3.5">
          {themes.length === 0 && <p className="text-sm text-slate-400">Aucune thématique notée.</p>}
          {themes.map((t, i) => {
            const pct = t.score != null ? (t.score / 5) * 100 : 0;
            const hex = scoreHex(t.score);
            return (
              <div key={t.id}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-slate-600">{t.label}</span>
                  <span className="font-bold" style={{ color: hex }}>
                    {t.score != null ? t.score.toFixed(1) : "—"}/5
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: hex }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Ressenti distribution */}
      <GlassCard>
        <h3 className="mb-3 font-display text-base font-semibold text-ink">Ressenti global</h3>
        {ressentiData.length ? (
          <div className="space-y-2.5">
            {ressentiData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-center text-lg">{d.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.value / maxRessenti) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                  />
                </div>
                <span className="w-6 text-right text-xs font-bold text-slate-500">{d.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Pas de données.</p>
        )}
      </GlassCard>

      {/* Departments */}
      <GlassCard className="lg:col-span-2">
        <h3 className="mb-3 font-display text-base font-semibold text-ink">Répartition par département</h3>
        {departments.length ? (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.04)" }}
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#0f172a",
                    boxShadow: "0 8px 24px -8px rgba(16,24,40,0.18)",
                  }}
                  labelStyle={{ color: "#64748b" }}
                  formatter={(v: number) => [`${v} réponse${v > 1 ? "s" : ""}`, ""]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                  {departments.map((_, i) => (
                    <Cell key={i} fill="url(#deptGrad)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="deptGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#008080" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Pas de données.</p>
        )}
      </GlassCard>

      {/* Motivations */}
      <GlassCard>
        <h3 className="mb-3 font-display text-base font-semibold text-ink">Top motivations</h3>
        {motivations.length ? (
          <div className="flex flex-wrap gap-2">
            {motivations.slice(0, 8).map((m) => (
              <span
                key={m.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {m.label} <span className="font-bold text-brand-600">{m.count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Pas de données.</p>
        )}
      </GlassCard>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
      <span className="flex items-center gap-1">
        <i className="h-2 w-2 rounded-full bg-brand-600" />≥4
      </span>
      <span className="flex items-center gap-1">
        <i className="h-2 w-2 rounded-full bg-amber-500" />3–4
      </span>
      <span className="flex items-center gap-1">
        <i className="h-2 w-2 rounded-full bg-danger-500" />&lt;3
      </span>
    </div>
  );
}
