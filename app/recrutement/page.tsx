import { RecruitmentTest } from "@/components/recruitment/recruitment-test";
import { getDomainQuestionCounts } from "@/lib/recruitment-bank";
import { getRecruitmentSettings } from "@/lib/settings";

// Lecture des durées au chargement → rendu dynamique (pas de cache statique).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "IZICHANGE · Test Jeune Talent 2026",
};

export default async function RecrutementPage() {
  const [s, counts] = await Promise.all([getRecruitmentSettings(), getDomainQuestionCounts()]);

  if (!s.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Test momentanément fermé</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Le test de recrutement Jeune Talent 2026 n'est pas ouvert actuellement. Merci de revenir plus tard ou de
            contacter l'équipe RH d'IZICHANGE.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RecruitmentTest durations={{ block1: s.durationBlock1, block23: s.durationBlock23 }} counts={counts} />
  );
}
