import { normalizeMatricule } from "./utils";

/**
 * Allow-list of valid employee matricules. Only these may submit the survey.
 * Edit this list to add/remove employees.
 */
export const ALLOWED_MATRICULES: string[] = [
  "IZI-1805-01001",
  "IZI-1805-02002",
  "IZI-1805-03003",
  "IZI-1805-04004",
  "IZI-1805-05005",
  "IZI-1805-06006",
  "IZI-1805-07007",
  "IZI-2109-01008",
  "IZI-2109-02009",
  "IZI-2109-03010",
  "IZI-2109-04011",
  "IZI-2109-05012",
  "IZI-2109-06013",
  "IZI-2109-07014",
  "IZI-2109-08015",
  "IZI-2109-09016",
  "IZI-2201-01017",
  "IZI-2206-01018",
  "IZI-2206-02019",
  "IZI-2209-01020",
  "IZI-2211-01021",
  "IZI-2211-02022",
  "IZI-2211-03023",
  "IZI-2211-04024",
  "IZI-2212-01025",
  "IZI-2212-02026",
  "IZI-2305-01027",
  "IZI-2308-01028",
  "IZI-2308-02029",
  "IZI-2308-03030",
  "IZI-2308-04031",
  "IZI-2310-01032",
  "IZI-2312-01033",
  "IZI-2408-01034",
  "IZI-2408-02035",
  "IZI-2408-03036",
  "IZI-2409-01037",
  "IZI-2409-02038",
  "IZI-2410-01039",
  "IZI-2411-01040",
  "IZI-2411-02041",
  "IZI-2411-03042",
  "IZI-2502-01043",
  "IZI-2504-01044",
  "IZI-2504-02045",
  "IZI-2506-01046",
  "IZI-2509-01047",
  "IZI-2602-01048",
  "IZI-2602-02049",
  "IZI-2602-03050",
  "IZI-2602-04051",
  "IZI-2605-01052",
  "IZI-2606-01053",
];

const ALLOWED_SET = new Set(ALLOWED_MATRICULES.map(normalizeMatricule));

export function isAllowedMatricule(value: string): boolean {
  return ALLOWED_SET.has(normalizeMatricule(value));
}
