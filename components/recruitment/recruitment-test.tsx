"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AmbientGlow, Logo } from "@/components/brand/logo";
import { Badge, Button, GlassCard, Input, Label, ProgressBar } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { cn, isValidEmail } from "@/lib/utils";
import { BLOCK_LABELS, DOMAIN_OPTIONS, type Domain, type PublicTQ, type TestDurations, type TestScore } from "@/lib/recruitment";

type Phase = "welcome" | "quiz" | "thanks";

const LETTERS = ["A", "B", "C", "D"];
const blockOf = (i: number) => (i < 10 ? 0 : i < 22 ? 1 : 2);

export function RecruitmentTest({
  durations,
  counts,
}: {
  durations: TestDurations;
  counts: Record<Domain, number>;
}) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState<Domain | null>(null);
  const [checking, setChecking] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  const [qs, setQs] = useState<PublicTQ[]>([]);
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [expired, setExpired] = useState(false);
  const [tLeft, setTLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<TestScore | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const q = qs[cur];
  const selected = answers[cur] ?? null;

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Countdown for the current question.
  useEffect(() => {
    if (phase !== "quiz" || !q) return;
    setExpired(false);
    setTLeft(q.sec);
    clearTimer();
    timerRef.current = setInterval(() => {
      setTLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, cur, q, clearTimer]);

  async function startTest() {
    if (!name.trim() || !isValidEmail(email) || !domain) {
      toast("Renseignez votre nom, un email valide et choisissez un domaine.", "error");
      return;
    }
    setChecking(true);
    try {
      const { taken } = await api.get<{ taken: boolean }>(
        `/api/recrutement/check?email=${encodeURIComponent(email.trim())}`,
      );
      if (taken) {
        setEmailTaken(true);
        toast("Vous avez déjà passé ce test.", "error");
        return;
      }
      // Les questions (sans bonnes réponses) sont servies par le serveur.
      const { questions } = await api.get<{ questions: PublicTQ[] }>(
        `/api/recrutement/test?domain=${domain}`,
      );
      setQs(questions);
      setAnswers(new Array(questions.length).fill(null));
      setCur(0);
      setScore(null);
      setPhase("quiz");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Impossible de démarrer le test.", "error");
    } finally {
      setChecking(false);
    }
  }

  function selectAnswer(i: number) {
    if (expired) return;
    setAnswers((a) => {
      const next = [...a];
      next[cur] = i;
      return next;
    });
  }

  function next() {
    clearTimer();
    advance();
  }

  function advance() {
    if (cur >= qs.length - 1) {
      finish();
      return;
    }
    setCur((c) => c + 1);
  }

  async function finish() {
    clearTimer();
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; score: TestScore }>("/api/recrutement/submit", {
        name: name.trim(),
        email: email.trim(),
        domain,
        answers,
        questionIds: qs.map((q) => q.id),
      });
      setScore(res.score);
      setPhase("thanks");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec de l'envoi.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setName("");
    setEmail("");
    setEmailTaken(false);
    setDomain(null);
    setQs([]);
    setAnswers([]);
    setCur(0);
    setScore(null);
    setPhase("welcome");
  }

  const progress = qs.length ? Math.round((cur / qs.length) * 100) : 0;
  const emailInvalid = email.trim().length > 0 && !isValidEmail(email);
  const startReady = !!name.trim() && isValidEmail(email) && !!domain && !emailTaken;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6 sm:py-10">
      <AmbientGlow />

      <header className="mb-8 flex items-center justify-between">
        <Logo subtitle="Jeune Talent 2026" />
        {phase === "welcome" && (
          <Link
            href="/admin/recrutement"
            className="ring-focus inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <Lock className="h-3.5 w-3.5" /> Accès RH
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col justify-center">
        {phase === "welcome" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <GlassCard className="p-7 sm:p-9">
              <span className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">
                Programme Jeune Talent 2026
              </span>
              <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                <span className="text-brand-gradient">Test de sélection psychotechnique</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                Ce test comprend 3 blocs — raisonnement logique, personnalité et aptitudes métier. Chaque question a une
                durée limitée. Répondez rapidement et honnêtement.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { v: `${counts[domain ?? "ops"]} questions`, l: "3 blocs" },
                  { v: `${durations.block1} sec`, l: "Bloc 1 — par question" },
                  { v: `${durations.block23} sec`, l: "Blocs 2 & 3 — par question" },
                ].map((c) => (
                  <div key={c.l} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="font-display text-lg font-semibold text-brand-600">{c.v}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{c.l}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="cand">Votre nom complet <span className="text-red-700">*</span></Label>
                  <Input id="cand" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Jean Dupont" />
                </div>
                <div>
                  <Label htmlFor="cmail">Adresse email <span className="text-red-700">*</span></Label>
                  <Input
                    id="cmail"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailTaken(false);
                    }}
                    placeholder="Ex : jean.dupont@email.com"
                    autoComplete="email"
                    className={emailTaken || emailInvalid ? "border-danger-400 focus-visible:ring-danger-500/40" : ""}
                  />
                  {emailTaken && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Vous avez déjà passé ce test avec cet email.
                    </p>
                  )}
                  {emailInvalid && !emailTaken && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Format d&apos;email invalide.
                    </p>
                  )}
                </div>
                <div>
                  <Label>Domaine visé <span className="text-red-700">*</span></Label>
                  <div className="space-y-2">
                    {DOMAIN_OPTIONS.map((d) => {
                      const active = domain === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDomain(d.id)}
                          className={cn(
                            "ring-focus w-full rounded-xl border px-4 py-3 text-left transition-all",
                            active
                              ? "border-brand-500 bg-brand-50"
                              : "border-slate-200 bg-white hover:border-brand-400",
                          )}
                        >
                          <div className={cn("text-[13px] font-semibold", active ? "text-brand-700" : "text-slate-800")}>
                            {d.label}
                          </div>
                          <div className={cn("mt-0.5 text-[11px]", active ? "text-brand-600/80" : "text-slate-400")}>
                            {d.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button size="lg" className="w-full" onClick={startTest} loading={checking} disabled={!startReady}>
                  Commencer le test <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {phase === "quiz" && q && (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <Badge tone="brand">{BLOCK_LABELS[blockOf(cur)]}</Badge>
                <div className="mt-1.5 text-[11px] text-slate-400">
                  Question {cur + 1} / {qs.length}
                </div>
              </div>
              <CircularTimer seconds={q.sec} left={tLeft} />
            </div>
            <ProgressBar value={progress} className="mb-6" />

            <GlassCard className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={cur}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{q.s}</div>
                  <h2 className="mb-6 text-[15px] font-semibold leading-relaxed text-ink sm:text-base">{q.t}</h2>

                  <div className="space-y-2">
                    {q.o.map((opt, i) => {
                      const isSel = selected === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectAnswer(i)}
                          disabled={expired}
                          className={cn(
                            "ring-focus flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13px] leading-relaxed transition-all",
                            isSel
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-brand-400",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                              isSel ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {LETTERS[i]}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex justify-end">
                <Button onClick={next} loading={submitting} disabled={selected === null && !expired}>
                  {cur === qs.length - 1 ? (
                    <>
                      <Sparkles className="h-4 w-4" /> Terminer
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

        {phase === "thanks" && score && (
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
              <h1 className="font-display text-2xl font-bold text-ink">Test soumis avec succès</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                Vos réponses ont été enregistrées. L'équipe RH de IZICHANGE les analysera et vous contactera si vous êtes éligible pour la suite du processus.
              </p>
              <Button variant="subtle" className="mt-6" onClick={reset}>
                Nouveau test
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </main>

      <footer className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
        <Clock className="h-3.5 w-3.5" /> IZICHANGE · Programme Jeune Talent 2026 · Test confidentiel et chronométré.
      </footer>
    </div>
  );
}

function CircularTimer({ seconds, left }: { seconds: number; left: number }) {
  const R = 20;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - left / seconds);
  const danger = left <= 5;
  const color = danger ? "#dc3e4d" : "#008080";
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={R} fill="none" strokeWidth="4" className="stroke-slate-200" />
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          strokeWidth="4"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold"
        style={{ color: danger ? "#dc3e4d" : "#2d264b" }}
      >
        {Math.max(0, left)}
      </span>
    </div>
  );
}
