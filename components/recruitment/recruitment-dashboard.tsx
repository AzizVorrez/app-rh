"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronsUpDown, ChevronUp, Download, Inbox, LogOut, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ConfirmDialog } from "@/components/ui/modal";
import { Button, CenteredSpinner, EmptyState, GlassCard, Input, Label, Select } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { DOMAIN_LABELS, type Domain } from "@/lib/recruitment";
import { cn, formatDateFR } from "@/lib/utils";

interface Result {
  id: string;
  name: string;
  email: string;
  domain: Domain;
  block1: number;
  block2: number;
  block3: number;
  total: number;
  max: number;
  status: string;
  date: string;
}

const STATUS_TONE: Record<string, string> = {
  Admis: "bg-accent-50 text-accent-700",
  Réserve: "bg-amber-50 text-amber-700",
  "Non retenu": "bg-danger-50 text-danger-700",
};

// Rang métier pour trier par statut (meilleur en tête), plutôt qu'alphabétique.
const STATUS_RANK: Record<string, number> = { Admis: 3, Réserve: 2, "Non retenu": 1 };

type SortKey = "name" | "domain" | "date" | "block1" | "block2" | "block3" | "total" | "status";
type SortDir = "asc" | "desc";
// Colonnes qui démarrent en décroissant au 1er clic (meilleur score / plus récent / meilleur statut en tête).
const DESC_FIRST: SortKey[] = ["date", "block1", "block2", "block3", "total", "status"];

export function RecruitmentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<Result[] | null>(null);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "total", dir: "desc" });
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<Domain | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [durB1, setDurB1] = useState("");
  const [durB23, setDurB23] = useState("");
  const [durLoaded, setDurLoaded] = useState(false);
  const [savingDur, setSavingDur] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ results: Result[] }>("/api/admin/recrutement");
      setResults(data.results);
    } catch (e) {
      if (e instanceof Error && /autoris/i.test(e.message)) return router.replace("/admin/login?next=/admin/recrutement");
      toast(e instanceof Error ? e.message : "Erreur.", "error");
    }
  }, [router, toast]);

  const loadDurations = useCallback(async () => {
    try {
      const s = await api.get<{ durationBlock1: number; durationBlock23: number }>(
        "/api/admin/recrutement/settings",
      );
      setDurB1(String(s.durationBlock1));
      setDurB23(String(s.durationBlock23));
      setDurLoaded(true);
    } catch {
      // silencieux : les réglages ne bloquent pas l'affichage des résultats
    }
  }, []);

  useEffect(() => {
    load();
    loadDurations();
  }, [load, loadDurations]);

  const stats = useMemo(() => {
    const r = results ?? [];
    const n = r.length;
    const admis = r.filter((x) => x.status === "Admis").length;
    const reserve = r.filter((x) => x.status === "Réserve").length;
    const avg = n ? Math.round(r.reduce((s, x) => s + Math.round((x.total / x.max) * 100), 0) / n) : 0;
    return { n, admis, reserve, avg };
  }, [results]);

  // Filtrage (recherche + domaine + statut) puis tri — tout côté client (dataset petit, déjà chargé).
  const view = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (results ?? []).filter((r) => {
      if (domainFilter !== "all" && r.domain !== domainFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !`${r.name} ${r.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    const key = sort.key;
    const cmp = (a: Result, b: Result): number => {
      switch (key) {
        case "name":
          return a.name.localeCompare(b.name, "fr");
        case "domain":
          return DOMAIN_LABELS[a.domain].localeCompare(DOMAIN_LABELS[b.domain], "fr");
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "status":
          return (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
        case "block1":
        case "block2":
        case "block3":
        case "total":
          return a[key] - b[key];
      }
    };
    return rows.sort((a, b) => dir * cmp(a, b));
  }, [results, search, domainFilter, statusFilter, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: DESC_FIRST.includes(key) ? "desc" : "asc" },
    );
  }

  const dirArrow = (k: SortKey) =>
    sort.key !== k ? (
      <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40" />
    ) : sort.dir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 shrink-0" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
    );

  const sortTh = (k: SortKey, label: string, opts?: { pad?: string; center?: boolean }) => (
    <th className={cn("py-3 font-semibold", opts?.pad ?? "px-2")}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={cn(
          "ring-focus inline-flex items-center gap-1 rounded transition-colors hover:text-slate-600",
          opts?.center && "w-full justify-center",
          sort.key === k && "text-brand-600",
        )}
      >
        {label}
        {dirArrow(k)}
      </button>
    </th>
  );

  async function saveDurations() {
    const b1 = Number(durB1);
    const b23 = Number(durB23);
    if (![b1, b23].every((n) => Number.isInteger(n) && n >= 5 && n <= 600)) {
      return toast("Durées invalides (entier entre 5 et 600 s).", "error");
    }
    setSavingDur(true);
    try {
      await api.put("/api/admin/recrutement/settings", { durationBlock1: b1, durationBlock23: b23 });
      toast("Durées enregistrées.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setSavingDur(false);
    }
  }

  async function logout() {
    await api.post("/api/admin/logout").catch(() => {});
    router.replace("/admin/login");
  }

  function exportCsv() {
    // Exporte ce qui est affiché (filtré + trié), pas toute la base.
    if (!view.length) return toast("Aucune donnée à exporter.", "error");
    const rows: (string | number)[][] = [
      ["Candidat", "Email", "Domaine", "Date", "Bloc1/10", "Bloc2/12", "Bloc3/10", "Total", "%", "Statut"],
    ];
    for (const r of view) {
      rows.push([
        r.name,
        r.email,
        DOMAIN_LABELS[r.domain],
        formatDateFR(r.date),
        r.block1,
        r.block2,
        r.block3,
        r.total,
        `${Math.round((r.total / r.max) * 100)}%`,
        r.status,
      ]);
    }
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
    a.download = "IZICHANGE_Resultats_JT2026.csv";
    a.click();
  }

  async function wipe() {
    setWiping(true);
    try {
      await api.del("/api/admin/recrutement");
      toast("Tous les résultats ont été supprimés.", "success");
      setWipeOpen(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec.", "error");
    } finally {
      setWiping(false);
    }
  }

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CenteredSpinner label="Chargement des résultats…" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden border-l border-slate-200 pl-4 sm:block">
            <h1 className="font-display text-lg font-bold text-ink">Recrutement — Jeune Talent 2026</h1>
            <p className="text-[11px] text-slate-400">Résultats du test psychotechnique · Confidentiel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="ring-focus inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Engagement
          </Link>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </header>

      {/* Stats (global, indépendant des filtres) */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: stats.n, l: "Candidats", c: "text-ink" },
          { v: stats.admis, l: "Admis ≥ 70%", c: "text-accent-600" },
          { v: stats.reserve, l: "En réserve", c: "text-amber-600" },
          { v: `${stats.avg}%`, l: "Score moyen", c: "text-brand-600" },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass glass-hover flex flex-col justify-center px-4 py-4"
          >
            <div className={cn("font-display text-2xl font-bold leading-none", s.c)}>{s.v}</div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.l}</div>
          </motion.div>
        ))}
      </div>

      {/* Réglages : durées du test */}
      <GlassCard className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-ink">Durées du test</h3>
            <p className="text-[11px] text-slate-400">
              Temps par question (5–600 s). S'applique aux tests démarrés après enregistrement.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="durB1">Bloc 1 (s)</Label>
              <Input
                id="durB1"
                type="number"
                min={5}
                max={600}
                value={durB1}
                onChange={(e) => setDurB1(e.target.value)}
                className="w-24"
              />
            </div>
            <div>
              <Label htmlFor="durB23">Blocs 2 &amp; 3 (s)</Label>
              <Input
                id="durB23"
                type="number"
                min={5}
                max={600}
                value={durB23}
                onChange={(e) => setDurB23(e.target.value)}
                className="w-24"
              />
            </div>
            <Button size="sm" onClick={saveDurations} loading={savingDur} disabled={!durLoaded}>
              Enregistrer
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      {results.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<Inbox className="h-7 w-7" />}
            title="Aucun candidat n'a encore soumis le test"
            hint="Partagez le lien /recrutement aux candidats pour collecter des résultats."
          />
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-3">
            <h3 className="font-display text-sm font-semibold text-ink">
              Candidats ({view.length}
              {view.length !== results.length ? ` / ${results.length}` : ""})
            </h3>
            <Button variant="danger" size="sm" onClick={() => setWipeOpen(true)}>
              <Trash2 className="h-4 w-4" /> Vider
            </Button>
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-2 px-5 pb-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un nom ou un email…"
                className="pl-9"
              />
            </div>
            <Select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as Domain | "all")}
              className="sm:w-56"
            >
              <option value="all">Tous les domaines</option>
              {Object.entries(DOMAIN_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
              <option value="all">Tous les statuts</option>
              {Object.keys(STATUS_TONE).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-y border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  {sortTh("name", "Candidat", { pad: "px-5" })}
                  {sortTh("domain", "Domaine")}
                  {sortTh("date", "Date")}
                  {sortTh("block1", "B1/10", { center: true })}
                  {sortTh("block2", "B2/12", { center: true })}
                  {sortTh("block3", "B3/10", { center: true })}
                  {sortTh("total", "Total", { center: true })}
                  {sortTh("status", "Statut", { pad: "px-3" })}
                </tr>
              </thead>
              <tbody>
                {view.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-[13px] text-slate-400">
                      Aucun candidat ne correspond aux filtres.
                    </td>
                  </tr>
                ) : (
                  view.map((r) => {
                    const pct = Math.round((r.total / r.max) * 100);
                    return (
                      <tr key={r.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                        <td className="px-5 py-2.5">
                          <div className="font-semibold text-slate-800">{r.name}</div>
                          <div className="text-[11px] text-slate-400">{r.email}</div>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                            {DOMAIN_LABELS[r.domain]}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-[11px] text-slate-400">{formatDateFR(r.date)}</td>
                        <td className="px-2 py-2.5 text-center text-slate-600">{r.block1}/10</td>
                        <td className="px-2 py-2.5 text-center text-slate-600">{r.block2}/12</td>
                        <td className="px-2 py-2.5 text-center text-slate-600">{r.block3}/10</td>
                        <td className="px-2 py-2.5 text-center font-bold text-ink">
                          {r.total}/{r.max} <span className="text-[10px] font-medium text-slate-400">({pct}%)</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_TONE[r.status] ?? "bg-slate-100 text-slate-600")}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <ConfirmDialog
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        onConfirm={wipe}
        loading={wiping}
        danger
        title="Supprimer tous les résultats ?"
        message="Tous les résultats du test de recrutement seront définitivement supprimés. Cette action est irréversible."
        confirmLabel="Tout supprimer"
      />
    </div>
  );
}
