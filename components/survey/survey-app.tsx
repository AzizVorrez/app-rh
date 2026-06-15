"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AmbientGlow, Logo } from "@/components/brand/logo";
import { Button, CenteredSpinner, GlassCard, Input, Label, ProgressBar, Select } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { SubmittedAnswer, SurveyConfig } from "@/lib/types";
import { QuestionInput, type AnswerValue } from "./question-input";

type Phase = "loading" | "error" | "closed" | "welcome" | "survey" | "thanks";

export function SurveyApp() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("loading");
  const [config, setConfig] = useState<SurveyConfig | null>(null);
  const [name, setName] = useState("");
  const [deptId, setDeptId] = useState("");
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<SurveyConfig>("/api/survey")
      .then((c) => {
        setConfig(c);
        setPhase(c.enabled ? "welcome" : "closed");
      })
      .catch(() => setPhase("error"));
  }, []);

  const questions = config?.questions ?? [];
  const q = questions[cur];

  const isAnswered = (value: AnswerValue, type: string) => {
    if (type === "open") return typeof value === "string" && value.trim().length > 0;
    if (type === "multi") return Array.isArray(value) && value.length > 0;
    return typeof value === "number";
  };

  function start() {
    if (!name.trim() || !deptId) {
      toast("Veuillez renseigner votre nom et votre département.", "error");
      return;
    }
    setCur(0);
    setDir(1);
    setPhase("survey");
  }

  function next() {
    if (!q) return;
    if (q.required && !isAnswered(answers[q.id] ?? null, q.type)) {
      toast("Cette question est obligatoire.", "error");
      return;
    }
    if (cur === questions.length - 1) {
      submit();
      return;
    }
    setDir(1);
    setCur((c) => c + 1);
  }

  function prev() {
    if (cur > 0) {
      setDir(-1);
      setCur((c) => c - 1);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const payload: SubmittedAnswer[] = [];
      for (const question of questions) {
        const v = answers[question.id];
        if (v == null) continue;
        if (question.type === "open") {
          if (typeof v === "string" && v.trim()) payload.push({ questionId: question.id, text: v.trim() });
        } else if (question.type === "multi") {
          if (Array.isArray(v) && v.length) payload.push({ questionId: question.id, json: v });
        } else if (typeof v === "number") {
          payload.push({ questionId: question.id, num: v });
        }
      }
      await api.post("/api/responses", { name: name.trim(), departmentId: deptId, answers: payload });
      setPhase("thanks");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec de l'envoi.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setName("");
    setDeptId("");
    setAnswers({});
    setCur(0);
    setPhase(config?.enabled ? "welcome" : "closed");
  }

  const progress = useMemo(
    () => (questions.length ? Math.round((cur / questions.length) * 100) : 0),
    [cur, questions.length],
  );

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6 sm:py-10">
      <AmbientGlow />

      <header className="mb-8 flex items-center justify-between">
        <Logo subtitle={config ? `${config.orgName} · ${config.year}` : "Engagement"} />
        <Link
          href="/admin/login"
          className="ring-focus inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-ink"
        >
          <Lock className="h-3.5 w-3.5" /> Espace RH
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center">
        {phase === "loading" && <CenteredSpinner label="Chargement de l'enquête…" />}

        {phase === "error" && (
          <GlassCard className="text-center">
            <p className="text-sm text-slate-600">Impossible de charger l'enquête. Réessayez plus tard.</p>
          </GlassCard>
        )}

        {phase === "closed" && (
          <GlassCard className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Lock className="h-6 w-6 text-slate-400" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink">Enquête fermée</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              L'enquête d'engagement n'est pas ouverte pour le moment. Merci de revenir ultérieurement.
            </p>
          </GlassCard>
        )}

        {phase === "welcome" && config && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <GlassCard className="overflow-hidden p-7 sm:p-9">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-600" /> Confidentiel · ~5 minutes
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                <span className="text-brand-gradient">{config.title}</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">{config.intro}</p>

              <div className="mt-7 space-y-4">
                <div>
                  <Label htmlFor="name">Nom et prénom</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Kofi Mensah"
                    onKeyDown={(e) => e.key === "Enter" && start()}
                  />
                </div>
                <div>
                  <Label htmlFor="dept">Département</Label>
                  <Select id="dept" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                    <option value="">Sélectionner…</option>
                    {config.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button size="lg" className="w-full" onClick={start}>
                  Commencer le questionnaire <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {phase === "survey" && q && (
          <div>
            <div className="mb-3 flex items-center justify-between text-[11px] font-semibold">
              <span className="uppercase tracking-[0.16em] text-brand-600">{q.section}</span>
              <span className="text-slate-400">
                {cur + 1} / {questions.length}
              </span>
            </div>
            <ProgressBar value={progress} className="mb-6" />

            <GlassCard className="min-h-[300px] p-6 sm:p-8">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={q.id}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -40 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="mb-6 text-lg font-bold leading-snug text-ink sm:text-xl">
                    {q.label}
                    {q.required && <span className="ml-1 text-brand-600">*</span>}
                  </h2>
                  <QuestionInput
                    question={q}
                    value={answers[q.id] ?? null}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
                <Button variant="ghost" onClick={prev} disabled={cur === 0}>
                  <ArrowLeft className="h-4 w-4" /> Précédent
                </Button>
                <Button onClick={next} loading={submitting} variant={cur === questions.length - 1 ? "accent" : "primary"}>
                  {cur === questions.length - 1 ? (
                    <>
                      <Sparkles className="h-4 w-4" /> Soumettre
                    </>
                  ) : (
                    <>
                      Suivant <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {phase === "thanks" && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <GlassCard className="p-9 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shadow-[0_12px_30px_-10px_rgba(5,150,105,0.6)]"
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="font-display text-2xl font-bold text-ink">Merci pour votre participation&nbsp;!</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                Vos réponses ont bien été enregistrées. La Direction RH les analysera et vous communiquera les actions
                mises en place.
              </p>
              <Button variant="subtle" className="mt-6" onClick={reset}>
                <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </main>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        IZICHANGE · Enquête confidentielle · Vos réponses servent uniquement à améliorer votre quotidien au travail.
      </footer>
    </div>
  );
}
