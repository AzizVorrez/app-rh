"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  MessageSquareText,
  Settings2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button, CenteredSpinner } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { exportExcel, exportPDF } from "@/lib/export";
import { cn } from "@/lib/utils";
import type { AdminConfig, DashboardStats } from "@/lib/types";
import { CollaboratorsTab } from "./collaborators-tab";
import { FreeTextTab } from "./freetext-tab";
import { RecommendationsTab } from "./recommendations-tab";
import { ScoresTab } from "./scores-tab";
import { SettingsTab } from "./settings-tab";
import { StatGrid } from "./stat-grid";
import { RecruitmentDashboard } from "@/components/recruitment/recruitment-dashboard";
import { RecruitmentSettings } from "@/components/recruitment/recruitment-settings";

const TABS = [
  { key: "scores", label: "Scores", icon: BarChart3 },
  { key: "recos", label: "Recommandations", icon: Lightbulb },
  { key: "freetext", label: "Réponses libres", icon: MessageSquareText },
  { key: "collab", label: "Par collaborateur", icon: Users },
  { key: "settings", label: "Paramètres", icon: Settings2 },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function AdminDashboard({ initialView }: { initialView?: "recrutement" } = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<"engagement" | "recrutement">(
    initialView === "recrutement" ? "recrutement" : "engagement",
  );
  const [engagementOpen, setEngagementOpen] = useState(initialView !== "recrutement");
  const [recrutementOpen, setRecrutementOpen] = useState(initialView === "recrutement");
  const [recTab, setRecTab] = useState<"candidats" | "params">("candidats");
  const [tab, setTab] = useState<TabKey>("scores");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadStats = useCallback(async () => {
    try {
      setStats(await api.get<DashboardStats>("/api/admin/stats"));
    } catch (e) {
      if (e instanceof Error && /autoris/i.test(e.message)) return router.replace("/admin/login");
      toast(e instanceof Error ? e.message : "Erreur.", "error");
    }
  }, [router, toast]);

  const reloadConfig = useCallback(async () => {
    try {
      setConfig(await api.get<AdminConfig>("/api/admin/config"));
    } catch (e) {
      if (e instanceof Error && /autoris/i.test(e.message)) return router.replace("/admin/login");
      toast(e instanceof Error ? e.message : "Erreur.", "error");
    }
  }, [router, toast]);

  const reloadAll = useCallback(async () => {
    await Promise.all([reloadStats(), reloadConfig()]);
  }, [reloadStats, reloadConfig]);

  useEffect(() => {
    reloadAll().finally(() => setLoading(false));
  }, [reloadAll]);

  async function logout() {
    await api.post("/api/admin/logout").catch(() => {});
    router.replace("/admin/login");
  }

  function doExportExcel() {
    if (!stats?.totals.responses) return toast("Aucune réponse à exporter.", "error");
    exportExcel(stats).catch(() => toast("Export Excel impossible.", "error"));
  }
  function doExportPDF() {
    if (!stats?.totals.responses) return toast("Aucune réponse à exporter.", "error");
    exportPDF(stats);
  }

  if (loading && view === "engagement") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CenteredSpinner label="Chargement du tableau de bord…" />
      </div>
    );
  }

  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo subtitle="Espace RH" />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {/* Engagement — dropdown regroupant les sections d'enquête */}
          <button
            onClick={() => {
              setEngagementOpen((o) => !o);
              setView("engagement");
            }}
            className={cn(
              "ring-focus flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              view === "engagement"
                ? "font-semibold text-ink"
                : "font-medium text-slate-600 hover:bg-slate-100 hover:text-ink",
            )}
          >
            <span className="flex items-center gap-3">
              <LayoutDashboard className="h-[18px] w-[18px]" /> Engagement
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", engagementOpen && "rotate-180")} />
          </button>
          {engagementOpen && (
            <div className="ml-3 flex flex-col gap-1 border-l border-slate-200 pl-2">
              {TABS.map((t) => (
                <NavItem
                  key={t.key}
                  active={view === "engagement" && tab === t.key}
                  icon={<t.icon className="h-[18px] w-[18px]" />}
                  label={t.label}
                  onClick={() => {
                    setView("engagement");
                    setTab(t.key);
                  }}
                />
              ))}
            </div>
          )}
          {/* Recrutement — dropdown : Candidats + Paramètres */}
          <button
            onClick={() => {
              setRecrutementOpen((o) => !o);
              setView("recrutement");
            }}
            className={cn(
              "ring-focus flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              view === "recrutement"
                ? "font-semibold text-ink"
                : "font-medium text-slate-600 hover:bg-slate-100 hover:text-ink",
            )}
          >
            <span className="flex items-center gap-3">
              <GraduationCap className="h-[18px] w-[18px]" /> Recrutement
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", recrutementOpen && "rotate-180")} />
          </button>
          {recrutementOpen && (
            <div className="ml-3 flex flex-col gap-1 border-l border-slate-200 pl-2">
              <NavItem
                active={view === "recrutement" && recTab === "candidats"}
                icon={<Users className="h-[18px] w-[18px]" />}
                label="Candidats"
                onClick={() => {
                  setView("recrutement");
                  setRecTab("candidats");
                }}
              />
              <NavItem
                active={view === "recrutement" && recTab === "params"}
                icon={<Settings2 className="h-[18px] w-[18px]" />}
                label="Paramètres"
                onClick={() => {
                  setView("recrutement");
                  setRecTab("params");
                }}
              />
            </div>
          )}
        </nav>
        <div className="border-t border-slate-200 pt-3">
          <button
            onClick={logout}
            className="ring-focus flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-h-screen flex-col">
        {/* Mobile top bar + nav */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Logo subtitle="Espace RH" />
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> Quitter
            </Button>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setView("engagement");
                  setTab(t.key);
                }}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  view === "engagement" && tab === t.key
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:bg-slate-100",
                )}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => {
                setView("recrutement");
                setRecTab("candidats");
              }}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                view === "recrutement" && recTab === "candidats"
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100",
              )}
            >
              Candidats
            </button>
            <button
              onClick={() => {
                setView("recrutement");
                setRecTab("params");
              }}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                view === "recrutement" && recTab === "params"
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100",
              )}
            >
              Recrut. · Réglages
            </button>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {view === "recrutement" ? (
            recTab === "params" ? (
              <RecruitmentSettings />
            ) : (
              <RecruitmentDashboard embedded />
            )
          ) : (
            <>
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">{activeLabel}</h1>
              <p className="text-[12px] text-slate-400">
                {stats?.org.name} · {stats?.org.title} {stats?.org.year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={doExportExcel}>
                <Download className="h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={doExportPDF}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>

          {/* KPI grid */}
          {stats && (
            <div className="mb-6">
              <StatGrid stats={stats} />
            </div>
          )}

          {/* Tab content */}
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {stats && tab === "scores" && <ScoresTab stats={stats} />}
            {stats && tab === "recos" && <RecommendationsTab stats={stats} />}
            {stats && tab === "freetext" && <FreeTextTab stats={stats} />}
            {stats && tab === "collab" && <CollaboratorsTab stats={stats} onChanged={reloadStats} />}
            {config && tab === "settings" && (
              <SettingsTab
                config={config}
                responseCount={stats?.totals.responses ?? 0}
                reloadConfig={reloadConfig}
                reloadAll={reloadAll}
              />
            )}
          </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "ring-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        active ? "bg-brand-50 font-semibold text-brand-700" : "font-medium text-slate-600 hover:bg-slate-100 hover:text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
