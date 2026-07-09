"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, GlassCard, Input, Label, Switch } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { RecruitmentQuestionManager } from "./recruitment-question-manager";

interface Settings {
  durationBlock1: number;
  durationBlock23: number;
  passThreshold: number;
  enabled: boolean;
}

export function RecruitmentSettings() {
  const { toast } = useToast();
  const [durB1, setDurB1] = useState("");
  const [durB23, setDurB23] = useState("");
  const [passThr, setPassThr] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setLink(`${window.location.origin}/recrutement`), []);

  const load = useCallback(async () => {
    try {
      const s = await api.get<Settings>("/api/admin/recrutement/settings");
      setDurB1(String(s.durationBlock1));
      setDurB23(String(s.durationBlock23));
      setPassThr(String(s.passThreshold));
      setEnabled(s.enabled);
      setLoaded(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur de chargement des réglages.", "error");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveReglages() {
    const b1 = Number(durB1);
    const b23 = Number(durB23);
    const thr = Number(passThr);
    if (![b1, b23].every((n) => Number.isInteger(n) && n >= 5 && n <= 600)) {
      return toast("Durées invalides (entier entre 5 et 600 s).", "error");
    }
    if (!Number.isInteger(thr) || thr < 1 || thr > 100) {
      return toast("Seuil de réussite invalide (entier entre 1 et 100).", "error");
    }
    setSaving(true);
    try {
      await api.put("/api/admin/recrutement/settings", { durationBlock1: b1, durationBlock23: b23, passThreshold: thr });
      toast("Réglages enregistrés.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(next: boolean) {
    setEnabled(next); // optimiste
    try {
      await api.put("/api/admin/recrutement/settings", { enabled: next });
      toast(next ? "Test ouvert aux candidats." : "Test fermé.", "success");
    } catch (e) {
      setEnabled(!next);
      toast(e instanceof Error ? e.message : "Échec.", "error");
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

  return (
    <div className="space-y-6">
      {/* Fil d'Ariane / en-tête */}
      <div>
        <h1 className="font-display text-lg font-bold text-ink">Recrutement — Jeune Talent 2026</h1>
        <p className="text-[11px] text-slate-400">Paramètres du test · Confidentiel</p>
      </div>

      {/* Diffusion : ouvert/fermé + lien à partager */}
      <GlassCard className="space-y-4 p-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Test ouvert</p>
            <p className="text-[11px] text-slate-400">
              Lorsqu'il est fermé, les candidats ne peuvent plus démarrer ni soumettre le test.
            </p>
          </div>
          <Switch checked={enabled} onChange={toggleEnabled} />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-brand-600" />
            <span className="text-[13px] font-semibold text-slate-700">Lien à partager</span>
          </div>
          <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
            Envoyez ce lien aux candidats (email, WhatsApp…). Ils accèdent directement au test, sans voir l'espace RH.
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
        </div>
      </GlassCard>

      {/* Réglages du test */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-ink">Réglages du test</h3>
            <p className="text-[11px] text-slate-400">
              Durées par question (nouveaux tests) · seuil de réussite appliqué à tous les résultats.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="durB1">Bloc 1 (s)</Label>
              <Input id="durB1" type="number" min={5} max={600} value={durB1} onChange={(e) => setDurB1(e.target.value)} className="w-24" />
            </div>
            <div>
              <Label htmlFor="durB23">Blocs 2 &amp; 3 (s)</Label>
              <Input id="durB23" type="number" min={5} max={600} value={durB23} onChange={(e) => setDurB23(e.target.value)} className="w-24" />
            </div>
            <div>
              <Label htmlFor="passThr">Seuil réussite (%)</Label>
              <Input id="passThr" type="number" min={1} max={100} value={passThr} onChange={(e) => setPassThr(e.target.value)} className="w-24" />
            </div>
            <Button size="sm" onClick={saveReglages} loading={saving} disabled={!loaded}>
              Enregistrer
            </Button>
          </div>
        </div>
      </GlassCard>

      <RecruitmentQuestionManager locked={enabled} />
    </div>
  );
}
