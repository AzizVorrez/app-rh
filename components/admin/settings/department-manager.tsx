"use client";

import { Building2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";
import { Button, GlassCard, Input, Switch } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { AdminDepartment } from "@/lib/types";

export function DepartmentManager({
  departments,
  onChanged,
}: {
  departments: AdminDepartment[];
  onChanged: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<AdminDepartment | null>(null);

  async function add() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await api.post("/api/admin/departments", { name: newName.trim() });
      setNewName("");
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function rename(d: AdminDepartment, name: string) {
    if (name.trim() === d.name || !name.trim()) return;
    try {
      await api.put(`/api/admin/departments/${d.id}`, { name: name.trim() });
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  async function toggle(d: AdminDepartment) {
    try {
      await api.put(`/api/admin/departments/${d.id}`, { active: !d.active });
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  async function remove() {
    if (!target) return;
    try {
      await api.del(`/api/admin/departments/${target.id}`);
      toast("Département supprimé.", "success");
      setTarget(null);
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-brand-600" />
        <h3 className="font-display text-base font-semibold text-slate-900">Départements</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{departments.length}</span>
      </div>

      <div className="space-y-2">
        {departments.map((d) => (
          <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
            <Input
              defaultValue={d.name}
              onBlur={(e) => rename(d, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className={`h-9 flex-1 border-transparent bg-transparent px-2 hover:border-slate-300 ${!d.active ? "text-slate-400 line-through" : ""}`}
            />
            <Switch checked={d.active} onChange={() => toggle(d)} />
            <button onClick={() => setTarget(d)} className="p-1.5 text-slate-400 transition-colors hover:text-red-600" aria-label="Supprimer">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nouveau département…"
          className="flex-1"
        />
        <Button onClick={add} loading={busy} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        danger
        title="Supprimer le département ?"
        message={`« ${target?.name ?? ""} » sera retiré de la liste. Les réponses déjà reçues conservent le nom du département.`}
        confirmLabel="Supprimer"
      />
    </GlassCard>
  );
}
