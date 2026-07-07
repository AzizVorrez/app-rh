"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Download, Inbox, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ConfirmDialog } from "@/components/ui/modal";
import { Button, CenteredSpinner, EmptyState, GlassCard } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { DOMAIN_LABELS, type Domain } from "@/lib/recruitment";
import { cn, formatDateFR } from "@/lib/utils";

interface Result {
  id: string;
  name: string;
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

export function RecruitmentDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<Result[] | null>(null);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wiping, setWiping] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ results: Result[] }>("/api/admin/recrutement");
      setResults(data.results);
    } catch (e) {
      if (e instanceof Error && /autoris/i.test(e.message)) return router.replace("/admin/login?next=/admin/recrutement");
      toast(e instanceof Error ? e.message : "Erreur.", "error");
    }
  }, [router, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const r = results ?? [];
    const n = r.length;
    const admis = r.filter((x) => x.status === "Admis").length;
    const reserve = r.filter((x) => x.status === "Réserve").length;
    const avg = n ? Math.round(r.reduce((s, x) => s + Math.round((x.total / x.max) * 100), 0) / n) : 0;
    return { n, admis, reserve, avg };
  }, [results]);

  async function logout() {
    await api.post("/api/admin/logout").catch(() => {});
    router.replace("/admin/login");
  }

  function exportCsv() {
    if (!results?.length) return toast("Aucune donnée à exporter.", "error");
    const rows: (string | number)[][] = [
      ["Candidat", "Domaine", "Date", "Bloc1/10", "Bloc2/12", "Bloc3/10", "Total", "%", "Statut"],
    ];
    for (const r of results) {
      rows.push([
        r.name,
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

      {/* Stats */}
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
            <h3 className="font-display text-sm font-semibold text-ink">Candidats ({results.length})</h3>
            <Button variant="danger" size="sm" onClick={() => setWipeOpen(true)}>
              <Trash2 className="h-4 w-4" /> Vider
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-y border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Candidat</th>
                  <th className="px-2 py-3 font-semibold">Domaine</th>
                  <th className="px-2 py-3 font-semibold">Date</th>
                  <th className="px-2 py-3 text-center font-semibold">B1/10</th>
                  <th className="px-2 py-3 text-center font-semibold">B2/12</th>
                  <th className="px-2 py-3 text-center font-semibold">B3/10</th>
                  <th className="px-2 py-3 text-center font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const pct = Math.round((r.total / r.max) * 100);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="px-5 py-2.5 font-semibold text-slate-800">{r.name}</td>
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
                })}
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
