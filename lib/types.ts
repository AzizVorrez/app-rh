export type QuestionType = "emoji" | "scale5" | "yesno" | "nps" | "multi" | "open";

/** A question as sent to the public survey client. */
export interface PublicQuestion {
  id: string;
  code: string | null;
  section: string;
  label: string;
  type: QuestionType;
  options: string[];
  themeId: string | null;
  required: boolean;
  position: number;
}

export interface PublicDepartment {
  id: string;
  name: string;
}

export interface SurveyConfig {
  enabled: boolean;
  title: string;
  year: string;
  orgName: string;
  intro: string;
  questions: PublicQuestion[];
  departments: PublicDepartment[];
}

/** One answer submitted by a respondent. */
export interface SubmittedAnswer {
  questionId: string;
  num?: number | null;
  text?: string | null;
  json?: number[] | null;
}

export interface SubmitPayload {
  name: string;
  departmentId: string;
  answers: SubmittedAnswer[];
}

/* ─── Dashboard / stats DTOs ─────────────────────────────────────────── */

export type ScoreLevel = "high" | "mid" | "low";

export interface ThemeScore {
  id: string;
  label: string;
  score: number | null; // /5
  count: number;
}

export interface DeptCount {
  name: string;
  count: number;
}

export interface RessentiData {
  questionLabel: string | null;
  options: string[];
  counts: number[];
  dominantIndex: number | null;
}

export interface MotivationCount {
  label: string;
  count: number;
}

export interface FreeTextBlock {
  questionId: string;
  label: string;
  answers: { name: string; dept: string; text: string }[];
}

export interface CollaboratorRow {
  id: string;
  name: string;
  dept: string;
  date: string;
  themeScores: Record<string, number | null>;
  nps: number | null;
  ressentiIndex: number | null;
  open: Record<string, string>; // questionId → free-text answer
}

export interface Recommendation {
  level: ScoreLevel;
  color: string;
  icon: string;
  title: string;
  body: string;
}

/* ─── Admin configuration DTOs ───────────────────────────────────────── */

export interface AdminDepartment {
  id: string;
  name: string;
  position: number;
  active: boolean;
}

export interface AdminTheme {
  id: string;
  label: string;
  position: number;
  active: boolean;
}

export interface AdminQuestion {
  id: string;
  code: string | null;
  section: string;
  label: string;
  type: QuestionType;
  options: string[];
  themeId: string | null;
  includedInScore: boolean;
  required: boolean;
  position: number;
  active: boolean;
}

export interface AdminSettings {
  survey_enabled: boolean;
  org_name: string;
  survey_title: string;
  survey_year: string;
  survey_intro: string;
}

export interface AdminConfig {
  departments: AdminDepartment[];
  themes: AdminTheme[];
  questions: AdminQuestion[];
  settings: AdminSettings;
}

export interface DashboardStats {
  totals: {
    responses: number;
    globalAvg: number | null;
    nps: number | null;
    promoters: number;
    detractors: number;
    passives: number;
    dominantEmoji: string | null;
    dominantLabel: string | null;
  };
  themes: ThemeScore[];
  departments: DeptCount[];
  ressenti: RessentiData;
  motivations: MotivationCount[];
  freeText: FreeTextBlock[];
  collaborators: CollaboratorRow[];
  recommendations: Recommendation[];
  org: { name: string; title: string; year: string };
}
