"use client";

import { ChevronDown, ChevronUp, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge, Button, GlassCard, Input, Label, Select, Switch, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { AdminQuestion, AdminTheme, QuestionType } from "@/lib/types";

const TYPE_LABELS: Record<QuestionType, string> = {
  emoji: "Ressenti (emojis)",
  scale5: "Échelle 1–5",
  yesno: "Choix unique",
  nps: "Recommandation 0–10",
  multi: "Choix multiple",
  open: "Réponse libre",
};
const TYPE_TONE: Record<QuestionType, "brand" | "accent" | "amber" | "gold" | "slate"> = {
  emoji: "gold",
  scale5: "brand",
  yesno: "accent",
  nps: "amber",
  multi: "brand",
  open: "slate",
};
const NEEDS_OPTIONS: QuestionType[] = ["emoji", "yesno", "multi"];

interface Draft {
  id?: string;
  section: string;
  label: string;
  type: QuestionType;
  options: string[];
  themeId: string | null;
  includedInScore: boolean;
  required: boolean;
}

const emptyDraft = (): Draft => ({
  section: "",
  label: "",
  type: "scale5",
  options: [],
  themeId: null,
  includedInScore: true,
  required: false,
});

export function QuestionManager({
  questions,
  themes,
  onChanged,
}: {
  questions: AdminQuestion[];
  themes: AdminTheme[];
  onChanged: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<AdminQuestion | null>(null);
  const [reordering, setReordering] = useState(false);

  function openNew() {
    setDraft(emptyDraft());
    setEditorOpen(true);
  }
  function openEdit(q: AdminQuestion) {
    setDraft({
      id: q.id,
      section: q.section,
      label: q.label,
      type: q.type,
      options: [...q.options],
      themeId: q.themeId,
      includedInScore: q.includedInScore,
      required: q.required,
    });
    setEditorOpen(true);
  }

  async function save() {
    if (!draft.label.trim()) {
      toast("Le libellé est obligatoire.", "error");
      return;
    }
    if (NEEDS_OPTIONS.includes(draft.type) && draft.options.filter((o) => o.trim()).length < 2) {
      toast("Ajoutez au moins 2 options.", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        section: draft.section.trim(),
        label: draft.label.trim(),
        type: draft.type,
        options: NEEDS_OPTIONS.includes(draft.type) ? draft.options.map((o) => o.trim()).filter(Boolean) : [],
        themeId: draft.type === "scale5" ? draft.themeId : null,
        includedInScore: draft.type === "scale5" ? draft.includedInScore : false,
        required: draft.required,
      };
      if (draft.id) await api.put(`/api/admin/questions/${draft.id}`, body);
      else await api.post("/api/admin/questions", body);
      toast(draft.id ? "Question mise à jour." : "Question ajoutée.", "success");
      setEditorOpen(false);
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(q: AdminQuestion) {
    try {
      await api.put(`/api/admin/questions/${q.id}`, { active: !q.active });
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  async function remove() {
    if (!target) return;
    try {
      await api.del(`/api/admin/questions/${target.id}`);
      toast("Question supprimée.", "success");
      setTarget(null);
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= questions.length) return;
    const order = questions.map((q) => q.id);
    [order[index], order[next]] = [order[next], order[index]];
    setReordering(true);
    try {
      await api.patch("/api/admin/questions", { order });
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec du réordonnancement.", "error");
    } finally {
      setReordering(false);
    }
  }

  const themeName = (id: string | null) => themes.find((t) => t.id === id)?.label;

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-brand-600" />
        <h3 className="font-display text-base font-semibold text-ink">Questions</h3>
        <span className="text-xs font-medium text-slate-400">{questions.length}</span>
        <Button size="sm" className="ml-auto" onClick={openNew}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="space-y-2">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5 ${!q.active ? "opacity-50" : ""}`}
          >
            <div className="flex flex-col">
              <button disabled={i === 0 || reordering} onClick={() => move(i, -1)} className="text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-30">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button disabled={i === questions.length - 1 || reordering} onClick={() => move(i, 1)} className="text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-30">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Badge tone={TYPE_TONE[q.type]}>{TYPE_LABELS[q.type]}</Badge>
                {q.section && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{q.section}</span>}
                {q.type === "scale5" && q.themeId && <Badge tone="slate">{themeName(q.themeId) ?? "—"}</Badge>}
                {q.required && <Badge tone="red">obligatoire</Badge>}
              </div>
              <p className="truncate text-[13px] font-medium text-slate-800">{q.label}</p>
            </div>

            <div className="flex items-center gap-1">
              <Switch checked={q.active} onChange={() => toggleActive(q)} />
              <button onClick={() => openEdit(q)} className="p-1.5 text-slate-400 transition-colors hover:text-brand-600" aria-label="Modifier">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setTarget(q)} className="p-1.5 text-slate-400 transition-colors hover:text-danger-600" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <QuestionEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        draft={draft}
        setDraft={setDraft}
        themes={themes}
        onSave={save}
        saving={saving}
      />

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        danger
        title="Supprimer la question ?"
        message="La question sera retirée de l'enquête. Les réponses déjà collectées sont conservées."
        confirmLabel="Supprimer"
      />
    </GlassCard>
  );
}

function QuestionEditor({
  open,
  onClose,
  draft,
  setDraft,
  themes,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  draft: Draft;
  setDraft: (d: Draft) => void;
  themes: AdminTheme[];
  onSave: () => void;
  saving: boolean;
}) {
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const showOptions = NEEDS_OPTIONS.includes(draft.type);

  return (
    <Modal open={open} onClose={onClose} title={draft.id ? "Modifier la question" : "Nouvelle question"} size="lg">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <Label>Libellé de la question</Label>
          <Textarea
            value={draft.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="Ex : Je dispose des outils nécessaires pour accomplir mes missions."
            className="min-h-[64px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Section (titre affiché)</Label>
            <Input value={draft.section} onChange={(e) => set({ section: e.target.value })} placeholder="Ex : Environnement" />
          </div>
          <div>
            <Label>Type de réponse</Label>
            <Select
              value={draft.type}
              onChange={(e) => {
                const type = e.target.value as QuestionType;
                set({
                  type,
                  options:
                    NEEDS_OPTIONS.includes(type) && draft.options.length === 0
                      ? type === "yesno"
                        ? ["Oui", "Plutôt oui", "Plutôt non", "Non"]
                        : ["", ""]
                      : draft.options,
                });
              }}
            >
              {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {draft.type === "scale5" && (
          <div className="grid grid-cols-2 items-end gap-3">
            <div>
              <Label>Thématique notée</Label>
              <Select value={draft.themeId ?? ""} onChange={(e) => set({ themeId: e.target.value || null })}>
                <option value="">Aucune</option>
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="pb-2.5">
              <Switch
                checked={draft.includedInScore}
                onChange={(v) => set({ includedInScore: v })}
                label="Compter dans le score"
              />
            </div>
          </div>
        )}

        {showOptions && (
          <div>
            <Label>Options {draft.type === "emoji" && <span className="font-normal text-slate-400">(préfixez d'un emoji, ex : « 🙂 Bien »)</span>}</Label>
            <div className="space-y-2">
              {draft.options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={o}
                    onChange={(e) => {
                      const opts = [...draft.options];
                      opts[i] = e.target.value;
                      set({ options: opts });
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    onClick={() => set({ options: draft.options.filter((_, j) => j !== i) })}
                    className="px-2 text-slate-400 transition-colors hover:text-danger-600"
                    aria-label="Retirer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="subtle" className="mt-2" onClick={() => set({ options: [...draft.options, ""] })}>
              <Plus className="h-4 w-4" /> Option
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
          <span className="text-sm font-medium text-slate-700">Réponse obligatoire</span>
          <Switch checked={draft.required} onChange={(v) => set({ required: v })} />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2.5 border-t border-slate-200 pt-4">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={onSave} loading={saving}>
          {draft.id ? "Enregistrer" : "Ajouter la question"}
        </Button>
      </div>
    </Modal>
  );
}
