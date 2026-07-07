import { RecruitmentTest } from "@/components/recruitment/recruitment-test";
import { getRecruitmentSettings } from "@/lib/settings";

// Lecture des durées au chargement → rendu dynamique (pas de cache statique).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "IZICHANGE · Test Jeune Talent 2026",
};

export default async function RecrutementPage() {
  const s = await getRecruitmentSettings();
  return <RecruitmentTest durations={{ block1: s.durationBlock1, block23: s.durationBlock23 }} />;
}
