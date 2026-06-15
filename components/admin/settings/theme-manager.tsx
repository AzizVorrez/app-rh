"use client";

import { Layers, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";
import { Button, GlassCard, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { AdminTheme } from "@/lib/types";

export function ThemeManager({
  themes,
  onChanged,
}: {
  themes: AdminTheme[];
  onChanged: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<AdminTheme | null>(null);

  async function add() {
    if (!newLabel.trim()) return;
    setBusy(true);
    try {
      await api.post("/api/admin/themes", { label: newLabel.trim() });
      setNewLabel("");
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function rename(t: AdminTheme, label: string) {
    if (label.trim() === t.label || !label.trim()) return;
    try {
      await api.put(`/api/admin/themes/${t.id}`, { label: label.trim() });
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  async function remove() {
    if (!target) return;
    try {
      await api.del(`/api/admin/themes/${target.id}`);
      toast("Thématique supprimée.", "success");
      setTarget(null);
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4 text-brand-600" />
        <h3 className="font-display text-base font-semibold text-ink">Thématiques notées</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{themes.length}</span>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
        Les questions de type « échelle 1–5 » rattachées à une thématique alimentent son score.
      </p>

      <div className="space-y-2">
        {themes.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
            <Input
              defaultValue={t.label}
              onBlur={(e) => rename(t, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="h-9 flex-1 border-transparent bg-transparent px-2 hover:border-slate-300"
            />
            <button onClick={() => setTarget(t)} className="p-1.5 text-slate-400 transition-colors hover:text-danger-600" aria-label="Supprimer">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nouvelle thématique…"
          className="flex-1"
        />
        <Button onClick={add} loading={busy} disabled={!newLabel.trim()}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        danger
        title="Supprimer la thématique ?"
        message={`« ${target?.label ?? ""} » sera supprimée. Les questions rattachées ne seront plus comptabilisées dans un score de thème.`}
        confirmLabel="Supprimer"
      />
    </GlassCard>
  );
}
