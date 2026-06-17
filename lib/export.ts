import type { DashboardStats } from "./types";
import { formatDateFR } from "./utils";

function ressentiLabel(stats: DashboardStats, index: number | null): string {
  if (index == null) return "";
  const opt = stats.ressenti.options[index];
  if (!opt) return "";
  return opt.split(" ").slice(1).join(" ") || opt;
}

/* ─── Excel ──────────────────────────────────────────────────────────── */

export async function exportExcel(stats: DashboardStats) {
  const XLSX = await import("xlsx");

  const themeLabels = stats.themes.map((t) => t.label);
  const openBlocks = stats.freeText;

  const header = [
    "Matricule",
    "Département",
    "Date",
    "Ressenti",
    ...themeLabels.map((l) => `${l} /5`),
    "NPS",
    ...openBlocks.map((b) => b.label),
  ];

  const rows = stats.collaborators.map((c) => [
    c.name,
    c.dept,
    formatDateFR(c.date),
    ressentiLabel(stats, c.ressentiIndex),
    ...stats.themes.map((t) => {
      const s = c.themeScores[t.id];
      return s != null ? Number(s.toFixed(2)) : "";
    }),
    c.nps != null ? c.nps : "",
    ...openBlocks.map((b) => c.open[b.questionId] ?? ""),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    ...stats.themes.map(() => ({ wch: 16 })),
    { wch: 6 },
    ...openBlocks.map(() => ({ wch: 44 })),
  ];

  const s2: (string | number)[][] = [["Thématique", "Score moyen /5", "Nb de réponses"]];
  for (const t of stats.themes) s2.push([t.label, t.score != null ? Number(t.score.toFixed(2)) : "", t.count]);
  if (stats.totals.nps != null) s2.push(["eNPS", stats.totals.nps, stats.totals.promoters + stats.totals.detractors + stats.totals.passives]);
  const ws2 = XLSX.utils.aoa_to_sheet(s2);
  ws2["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Réponses individuelles");
  XLSX.utils.book_append_sheet(wb, ws2, "Scores par thématique");
  XLSX.writeFile(wb, `${stats.org.name}_Engagement_${stats.org.year}.xlsx`);
}

/* ─── PDF (print window) ─────────────────────────────────────────────── */

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function scoreColorLight(s: number | null): string {
  if (s == null) return "#64748b";
  if (s >= 4) return "#008080";
  if (s >= 3) return "#b45309";
  return "#dc3e4d";
}

export function exportPDF(stats: DashboardStats) {
  const { totals, themes, recommendations, collaborators, freeText, org } = stats;

  let html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Engagement ${esc(org.name)} ${esc(org.year)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;padding:30px;max-width:840px;margin:0 auto}
h1{font-size:21px;color:#008080;margin:0 0 4px}
.meta{font-size:11px;color:#6b7280;margin-bottom:18px}
h2{font-size:13px;color:#008080;margin:22px 0 9px;border-bottom:1px solid #cce7e7;padding-bottom:4px}
.sg{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px}
.sc{background:#F5F7FB;border-radius:8px;padding:11px;text-align:center}
.sn{font-size:19px;font-weight:700;color:#111827}
.sl{font-size:10px;color:#6b7280;margin-top:3px}
.bw{margin-bottom:9px}.bl{display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px}
.bt{height:8px;background:#eef0f4;border-radius:4px;overflow:hidden}.bf{height:100%;border-radius:4px}
.ri{border-left:3px solid;padding:8px 12px;margin-bottom:7px;background:#f9fafb;border-radius:0 6px 6px 0}
.rt{font-size:11px;font-weight:700;margin-bottom:2px}.rb{font-size:10px;color:#4b5563;line-height:1.55}
table{width:100%;border-collapse:collapse;font-size:10px;margin-top:4px}
th{text-align:left;padding:6px;background:#008080;color:#fff;font-weight:600}
td{padding:5px 6px;border-bottom:1px solid #eef0f4}tr:nth-child(even) td{background:#f9fafb}
.oq{margin-bottom:6px;padding:6px 9px;background:#f5f7fb;border-radius:5px;font-size:10px;line-height:1.55}
@media print{body{padding:14px}}
</style></head><body>
<h1>Rapport d'enquête d'engagement — ${esc(org.name)} ${esc(org.year)}</h1>
<div class="meta">Généré le ${formatDateFR(new Date())} · ${totals.responses} réponse${totals.responses > 1 ? "s" : ""} collectée${totals.responses > 1 ? "s" : ""}</div>
<div class="sg">
  <div class="sc"><div class="sn">${totals.responses}</div><div class="sl">Réponses</div></div>
  <div class="sc"><div class="sn">${totals.globalAvg != null ? totals.globalAvg.toFixed(1) : "—"}/5</div><div class="sl">Score global</div></div>
  <div class="sc"><div class="sn">${totals.nps ?? "—"}</div><div class="sl">eNPS</div></div>
  <div class="sc"><div class="sn">${totals.promoters}</div><div class="sl">Promoteurs</div></div>
  <div class="sc"><div class="sn">${totals.detractors}</div><div class="sl">Détracteurs</div></div>
</div>
<h2>Scores par thématique</h2>`;

  for (const t of themes) {
    const pct = t.score != null ? Math.round((t.score / 5) * 100) : 0;
    const c = scoreColorLight(t.score);
    html += `<div class="bw"><div class="bl"><span>${esc(t.label)}</span><span style="font-weight:700;color:${c}">${t.score != null ? t.score.toFixed(1) : "—"}/5</span></div><div class="bt"><div class="bf" style="width:${pct}%;background:${c}"></div></div></div>`;
  }

  html += `<h2>Recommandations</h2>`;
  for (const r of recommendations) {
    html += `<div class="ri" style="border-left-color:${r.color}"><div class="rt" style="color:${r.color}">${r.icon} ${esc(r.title)}</div><div class="rb">${esc(r.body)}</div></div>`;
  }

  html += `<h2>Scores individuels</h2><table><tr><th>Matricule</th><th>Département</th>${themes.map((t) => `<th>${esc(t.label)}</th>`).join("")}<th>NPS</th></tr>`;
  for (const c of collaborators) {
    html += `<tr><td>${esc(c.name)}</td><td>${esc(c.dept)}</td>${themes
      .map((t) => {
        const s = c.themeScores[t.id];
        return `<td>${s != null ? s.toFixed(1) : "—"}</td>`;
      })
      .join("")}<td>${c.nps ?? "—"}</td></tr>`;
  }
  html += `</table>`;

  for (const block of freeText) {
    if (!block.answers.length) continue;
    html += `<h2>${esc(block.label)}</h2>`;
    for (const a of block.answers) {
      html += `<div class="oq"><strong>${esc(a.name)}</strong> · ${esc(a.dept)}<br>${esc(a.text)}</div>`;
    }
  }

  html += `</body></html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Autorisez les fenêtres popup pour générer le PDF.");
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}
