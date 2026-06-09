"use client";

import { Trash2, Users } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState, GlassCard } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { scoreClass, formatDateFR } from "@/lib/utils";
import type { CollaboratorRow, DashboardStats } from "@/lib/types";

export function CollaboratorsTab({ stats, onChanged }: { stats: DashboardStats; onChanged: () => void }) {
  const { toast } = useToast();
  const { collaborators, themes, ressenti } = stats;
  const [target, setTarget] = useState<CollaboratorRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!target) return;
    setDeleting(true);
    try {
      await api.del(`/api/admin/responses/${target.id}`);
      toast("Réponse supprimée.", "success");
      setTarget(null);
      onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Suppression impossible.", "error");
    } finally {
      setDeleting(false);
    }
  }

  if (!collaborators.length) {
    return (
      <GlassCard>
        <EmptyState icon={<Users className="h-7 w-7" />} title="Aucune réponse enregistrée" hint="Partagez le lien de l'enquête pour collecter des réponses." />
      </GlassCard>
    );
  }

  const ressentiEmoji = (i: number | null) => (i != null ? ressenti.options[i]?.split(" ")[0] ?? "—" : "—");

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-semibold">Collaborateur</th>
              <th className="px-2 py-3 font-semibold">Dpt</th>
              {themes.map((t) => (
                <th key={t.id} className="px-2 py-3 text-center font-semibold" title={t.label}>
                  {t.label.split(" ")[0]}
                </th>
              ))}
              <th className="px-2 py-3 text-center font-semibold">NPS</th>
              <th className="px-2 py-3 text-center font-semibold">😊</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {collaborators.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="font-semibold text-slate-800">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{formatDateFR(c.date)}</div>
                </td>
                <td className="px-2 py-2.5 text-[11px] text-slate-500">{c.dept.split(" ")[0]}</td>
                {themes.map((t) => {
                  const s = c.themeScores[t.id];
                  return (
                    <td key={t.id} className={`px-2 py-2.5 text-center font-semibold ${scoreClass(s)}`}>
                      {s != null ? s.toFixed(1) : "—"}
                    </td>
                  );
                })}
                <td className="px-2 py-2.5 text-center font-bold text-slate-800">{c.nps ?? "—"}</td>
                <td className="px-2 py-2.5 text-center text-base">{ressentiEmoji(c.ressentiIndex)}</td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={() => setTarget(c)}
                    className="text-slate-400 transition-colors hover:text-red-600"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        title="Supprimer cette réponse ?"
        message={`La réponse de ${target?.name ?? ""} sera définitivement supprimée.`}
        confirmLabel="Supprimer"
      />
    </GlassCard>
  );
}
