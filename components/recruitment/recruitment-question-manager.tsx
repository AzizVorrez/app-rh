"use client";

import { ChevronDown, ChevronUp, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Badge, Button, CenteredSpinner, GlassCard, Input, Label, Switch, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { DOMAIN_LABELS, type Domain } from "@/lib/recruitment";
import { cn } from "@/lib/utils";

interface RQ {
  id: string;
  block: number;
  domain: Domain | null;
  section: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  position: number;
  active: boolean;
}

interface Draft {
  id?: string;
  block: number;
  domain: Domain | null;
  section: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const BLOCK3_DOMAINS: Domain[] = ["ops", "graphiste", "crm", "social", "cyber", "dev"];

export function RecruitmentQuestionManager({ locked = false }: { locked?: boolean } = {}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<RQ[] | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<RQ | null>(null);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get<{ questions: RQ[] }>("/api/admin/recrutement/questions");
      setRows(d.questions);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur de chargement des questions.", "error");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const rs = rows ?? [];
    return [
      { key: "b1", title: "Bloc 1 — Raisonnement logique", block: 1, domain: null as Domain | null, items: rs.filter((r) => r.block === 1) },
      { key: "b2", title: "Bloc 2 — Personnalité & comportement", block: 2, domain: null as Domain | null, items: rs.filter((r) => r.block === 2) },
      ...BLOCK3_DOMAINS.map((dom) => ({
        key: `b3-${dom}`,
        title: `Bloc 3 — ${DOMAIN_LABELS[dom]}`,
        block: 3,
        domain: dom as Domain | null,
        items: rs.filter((r) => r.block === 3 && r.domain === dom),
      })),
    ];
  }, [rows]);

  function openNew(block: number, domain: Domain | null) {
    if (locked) return;
    setDraft({ block, domain, section: "", text: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });
    setEditorOpen(true);
  }
  function openEdit(q: RQ) {
    if (locked) return;
    setDraft({
      id: q.id,
      block: q.block,
      domain: q.domain,
      section: q.section,
      text: q.text,
      options: [...q.options],
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    });
    setEditorOpen(true);
  }

  async function save() {
    if (!draft) return;
    const options = draft.options.map((o) => o.trim());
    if (!draft.text.trim()) return toast("L'énoncé est requis.", "error");
    if (options.length < 2) return toast("Au moins 2 options.", "error");
    if (options.some((o) => !o)) return toast("Aucune option ne doit être vide.", "error");
    if (draft.correctIndex >= options.length) return toast("Sélectionnez la bonne réponse.", "error");
    const body = {
      block: draft.block,
      domain: draft.domain,
      section: draft.section.trim(),
      text: draft.text.trim(),
      options,
      correctIndex: draft.correctIndex,
      explanation: draft.explanation.trim(),
    };
    setSaving(true);
    try {
      if (draft.id) await api.put(`/api/admin/recrutement/questions/${draft.id}`, body);
      else await api.post("/api/admin/recrutement/questions", body);
      toast(draft.id ? "Question mise à jour." : "Question ajoutée.", "success");
      setEditorOpen(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec de l'enregistrement.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(q: RQ) {
    try {
      await api.put(`/api/admin/recrutement/questions/${q.id}`, {
        block: q.block,
        domain: q.domain,
        section: q.section,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        active: !q.active,
      });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  async function remove() {
    if (!target) return;
    try {
      await api.del(`/api/admin/recrutement/questions/${target.id}`);
      toast("Question supprimée.", "success");
      setTarget(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    }
  }

  async function move(items: RQ[], index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const order = items.map((r) => r.id);
    [order[index], order[next]] = [order[next], order[index]];
    setReordering(true);
    try {
      await api.patch("/api/admin/recrutement/questions", { order });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec du réordonnancement.", "error");
    } finally {
      setReordering(false);
    }
  }

  if (!rows) return <CenteredSpinner label="Chargement des questions…" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-brand-600" />
        <h3 className="font-display text-base font-semibold text-ink">Questions du test</h3>
        <span className="text-xs font-medium text-slate-400">{rows.length}</span>
      </div>

      {locked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-800">
          Le test est <strong>ouvert</strong> : les questions sont verrouillées pour préserver l'équité des candidats
          en cours. Fermez le test (toggle « Test ouvert » ci-dessus) pour les modifier.
        </div>
      )}

      {groups.map((g) => (
        <GlassCard key={g.key} className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-semibold text-slate-700">
              {g.title} <span className="text-slate-400">({g.items.length})</span>
            </h4>
            <Button variant="outline" size="sm" onClick={() => openNew(g.block, g.domain)} disabled={locked}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </div>
          {g.items.length === 0 ? (
            <p className="py-3 text-center text-[12px] text-slate-400">Aucune question dans ce groupe.</p>
          ) : (
            <div className="space-y-2">
              {g.items.map((q, i) => (
                <div
                  key={q.id}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5",
                    !q.active && "opacity-50",
                  )}
                >
                  <div className="flex flex-col">
                    <button
                      disabled={i === 0 || reordering || locked}
                      onClick={() => move(g.items, i, -1)}
                      className="text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-30"
                      aria-label="Monter"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      disabled={i === g.items.length - 1 || reordering || locked}
                      onClick={() => move(g.items, i, 1)}
                      className="text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-30"
                      aria-label="Descendre"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{q.domain ? DOMAIN_LABELS[q.domain] : "Commun"}</Badge>
                      {q.section && (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {q.section}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[13px] font-medium text-slate-800">{q.text}</p>
                    <p className="mt-0.5 truncate text-[11px] text-accent-700">
                      ✓ {LETTERS[q.correctIndex]}. {q.options[q.correctIndex] ?? "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Switch checked={q.active} onChange={() => !locked && toggleActive(q)} />
                    <button
                      onClick={() => openEdit(q)}
                      disabled={locked}
                      className="p-1.5 text-slate-400 transition-colors hover:text-brand-600 disabled:opacity-30"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => !locked && setTarget(q)}
                      disabled={locked}
                      className="p-1.5 text-slate-400 transition-colors hover:text-danger-600 disabled:opacity-30"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      ))}

      {draft && (
        <QuestionEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          draft={draft}
          setDraft={setDraft}
          onSave={save}
          saving={saving}
        />
      )}

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        danger
        title="Supprimer la question ?"
        message="La question sera retirée du test. Les résultats déjà collectés sont conservés."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function QuestionEditor({
  open,
  onClose,
  draft,
  setDraft,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const scope =
    draft.block === 3 && draft.domain ? `Bloc 3 — ${DOMAIN_LABELS[draft.domain]}` : `Bloc ${draft.block} (commun)`;

  return (
    <Modal open={open} onClose={onClose} title={draft.id ? "Modifier la question" : "Nouvelle question"} size="lg">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        <Badge tone="slate">{scope}</Badge>

        <div>
          <Label>Énoncé de la question</Label>
          <Textarea
            value={draft.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder="Énoncé de la question…"
            className="min-h-[64px]"
          />
        </div>

        <div>
          <Label>Section (titre affiché, facultatif)</Label>
          <Input value={draft.section} onChange={(e) => set({ section: e.target.value })} placeholder="Ex : Raisonnement logique" />
        </div>

        <div>
          <Label>Options — cochez la bonne réponse</Label>
          <div className="space-y-2">
            {draft.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rq-correct"
                  checked={draft.correctIndex === i}
                  onChange={() => set({ correctIndex: i })}
                  className="h-4 w-4 accent-accent-600"
                  aria-label={`Bonne réponse : option ${LETTERS[i]}`}
                />
                <span className="w-4 text-[12px] font-semibold text-slate-400">{LETTERS[i]}</span>
                <Input
                  value={o}
                  onChange={(e) => {
                    const opts = [...draft.options];
                    opts[i] = e.target.value;
                    set({ options: opts });
                  }}
                  placeholder={`Option ${LETTERS[i]}`}
                />
                <button
                  onClick={() => {
                    if (draft.options.length <= 2) return;
                    const opts = draft.options.filter((_, j) => j !== i);
                    let correctIndex = draft.correctIndex;
                    if (i === correctIndex) correctIndex = 0;
                    else if (i < correctIndex) correctIndex -= 1;
                    set({ options: opts, correctIndex });
                  }}
                  className="px-2 text-slate-400 transition-colors hover:text-danger-600 disabled:opacity-30"
                  disabled={draft.options.length <= 2}
                  aria-label="Retirer l'option"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {draft.options.length < 6 && (
            <Button size="sm" variant="subtle" className="mt-2" onClick={() => set({ options: [...draft.options, ""] })}>
              <Plus className="h-4 w-4" /> Option
            </Button>
          )}
        </div>

        <div>
          <Label>Explication (jury RH, facultatif)</Label>
          <Textarea
            value={draft.explanation}
            onChange={(e) => set({ explanation: e.target.value })}
            placeholder="Justification de la bonne réponse…"
          />
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
