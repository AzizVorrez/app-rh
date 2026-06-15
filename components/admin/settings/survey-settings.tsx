"use client";

import { Check, Copy, Database, KeyRound, Link2, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";
import { Button, GlassCard, Input, Label, Switch, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { plural } from "@/lib/utils";
import type { AdminSettings } from "@/lib/types";

export function SurveySettings({
  settings,
  responseCount,
  onChanged,
  onWiped,
}: {
  settings: AdminSettings;
  responseCount: number;
  onChanged: () => Promise<void> | void;
  onWiped: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(settings);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const [wipeOpen, setWipeOpen] = useState(false);
  const [wiping, setWiping] = useState(false);

  useEffect(() => setForm(settings), [settings]);
  useEffect(() => setLink(`${window.location.origin}/`), []);

  async function saveGeneral() {
    setSavingGeneral(true);
    try {
      await api.put("/api/admin/settings", {
        orgName: form.org_name,
        title: form.survey_title,
        year: form.survey_year,
        intro: form.survey_intro,
        enabled: form.survey_enabled,
      });
      toast("Paramètres enregistrés.", "success");
      await onChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setSavingGeneral(false);
    }
  }

  async function savePassword() {
    if (pw.length < 4) {
      toast("Le mot de passe doit faire au moins 4 caractères.", "error");
      return;
    }
    if (pw !== pw2) {
      toast("Les deux mots de passe ne correspondent pas.", "error");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/api/admin/settings", { newPassword: pw });
      toast("Mot de passe modifié.", "success");
      setPw("");
      setPw2("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setSavingPw(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("Copie impossible.", "error");
    }
  }

  async function wipe() {
    setWiping(true);
    try {
      await api.del("/api/admin/responses");
      toast("Toutes les réponses ont été supprimées.", "success");
      setWipeOpen(false);
      await onWiped();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* General */}
      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-brand-600" />
          <h3 className="font-display text-base font-semibold text-ink">Général</h3>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Enquête ouverte</p>
            <p className="text-[11px] text-slate-400">Lorsqu'elle est fermée, les collaborateurs ne peuvent plus répondre.</p>
          </div>
          <Switch checked={form.survey_enabled} onChange={(v) => setForm({ ...form, survey_enabled: v })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>Titre de l'enquête</Label>
            <Input value={form.survey_title} onChange={(e) => setForm({ ...form, survey_title: e.target.value })} />
          </div>
          <div>
            <Label>Année</Label>
            <Input value={form.survey_year} onChange={(e) => setForm({ ...form, survey_year: e.target.value })} />
          </div>
        </div>
        <div className="mt-3">
          <Label>Nom de l'organisation</Label>
          <Input value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} />
        </div>
        <div className="mt-3">
          <Label>Texte d'introduction</Label>
          <Textarea value={form.survey_intro} onChange={(e) => setForm({ ...form, survey_intro: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={saveGeneral} loading={savingGeneral}>
            Enregistrer
          </Button>
        </div>
      </GlassCard>

      {/* Share link */}
      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-brand-600" />
          <h3 className="font-display text-base font-semibold text-ink">Lien à partager</h3>
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-slate-400">
          Envoyez ce lien par email, WhatsApp ou tout autre canal. Les collaborateurs accèdent directement au
          questionnaire, sans voir l'espace RH.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12px] text-slate-600">
            {link}
          </code>
          <Button variant="subtle" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-accent-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié" : "Copier"}
          </Button>
        </div>
      </GlassCard>

      {/* Password */}
      <GlassCard>
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand-600" />
          <h3 className="font-display text-base font-semibold text-ink">Mot de passe RH</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <Label>Confirmer</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="subtle" onClick={savePassword} loading={savingPw} disabled={!pw || !pw2}>
            Modifier le mot de passe
          </Button>
        </div>
      </GlassCard>

      {/* Data */}
      <GlassCard className="border-danger-200">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-danger-500" />
          <h3 className="font-display text-base font-semibold text-ink">Gestion des données</h3>
        </div>
        <p className="mb-4 text-[12px] text-slate-500">
          {responseCount} {plural(responseCount, "réponse")} {plural(responseCount, "enregistrée")} dans la base de
          données PostgreSQL.
        </p>
        <Button variant="danger" onClick={() => setWipeOpen(true)} disabled={responseCount === 0}>
          <Trash2 className="h-4 w-4" /> Supprimer toutes les réponses
        </Button>
      </GlassCard>

      <ConfirmDialog
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        onConfirm={wipe}
        loading={wiping}
        danger
        title="Tout supprimer ?"
        message={`Les ${responseCount} ${plural(responseCount, "réponse")} seront définitivement supprimées. Cette action est irréversible.`}
        confirmLabel="Tout supprimer"
      />
    </div>
  );
}
