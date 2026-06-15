"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AmbientGlow, Logo } from "@/components/brand/logo";
import { Button, GlassCard, Input, Label } from "@/components/ui/primitives";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/api/admin/login", { password });
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <AmbientGlow />
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-6">
        <Logo subtitle="Espace RH" />
        <Link href="/" className="text-xs font-semibold text-slate-500 transition-colors hover:text-ink">
          ← Retour à l'enquête
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <GlassCard className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-sm">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">Accès RH sécurisé</h1>
          <p className="mt-1.5 text-sm text-slate-500">Réservé à la Direction des Ressources Humaines</p>

          <div className="mt-7 text-left">
            <Label htmlFor="pw">Mot de passe</Label>
            <Input
              id="pw"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className="text-center tracking-widest"
            />
            {error && <p className="mt-2 text-xs font-semibold text-danger-600">{error}</p>}
            <Button className="mt-4 w-full" onClick={submit} loading={loading}>
              Accéder au tableau de bord <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Session chiffrée · cookie httpOnly
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
