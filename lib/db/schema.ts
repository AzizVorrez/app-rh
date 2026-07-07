import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Question types supported by the dynamic survey engine.
 *  - emoji : single choice rendered as emoji cards (e.g. mood). value = option index
 *  - scale5: 1..5 agreement scale. value = 1..5 (can contribute to a theme score)
 *  - yesno : single choice from an ordered list (best → worst). value = option index
 *  - nps   : 0..10 recommendation scale. value = 0..10
 *  - multi : multiple choice. value = array of selected option indices
 *  - open  : free text. value = text
 */
export const questionTypeEnum = pgEnum("question_type", [
  "emoji",
  "scale5",
  "yesno",
  "nps",
  "multi",
  "open",
]);

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const themes = pgTable("themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull(),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Stable code from the original survey (q0..q26). Optional for custom questions.
    code: text("code"),
    // Display group tag shown above the question (e.g. "Environnement").
    section: text("section").notNull().default(""),
    label: text("label").notNull(),
    type: questionTypeEnum("type").notNull(),
    // Option labels for emoji / yesno / multi questions.
    options: jsonb("options").$type<string[]>().notNull().default([]),
    // Scored scale5 questions reference a theme; theme score = avg of its questions.
    themeId: uuid("theme_id").references(() => themes.id, { onDelete: "set null" }),
    includedInScore: boolean("included_in_score").notNull().default(false),
    required: boolean("required").notNull().default(false),
    position: integer("position").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    themeIdx: index("questions_theme_idx").on(t.themeId),
    positionIdx: index("questions_position_idx").on(t.position),
  }),
);

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    respondentName: text("respondent_name").notNull(),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    // Snapshot of the department name at submission time (survives dept deletion).
    departmentName: text("department_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdIdx: index("responses_created_idx").on(t.createdAt),
  }),
);

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").references(() => questions.id, {
      onDelete: "set null",
    }),
    questionCode: text("question_code"),
    questionType: questionTypeEnum("question_type").notNull(),
    valueNum: integer("value_num"),
    valueText: text("value_text"),
    valueJson: jsonb("value_json").$type<number[]>(),
  },
  (t) => ({
    responseIdx: index("answers_response_idx").on(t.responseId),
    questionIdx: index("answers_question_idx").on(t.questionId),
  }),
);

/** Simple key/value store for app settings (survey title, admin password hash...). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Psychotechnic recruitment test results (Programme Jeune Talent). */
export const testResults = pgTable(
  "test_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    candidateName: text("candidate_name").notNull(),
    candidateEmail: text("candidate_email").notNull(),
    domain: text("domain").notNull(),
    block1: integer("block1").notNull(),
    block2: integer("block2").notNull(),
    block3: integer("block3").notNull(),
    total: integer("total").notNull(),
    maxScore: integer("max_score").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdIdx: index("test_results_created_idx").on(t.createdAt),
    emailIdx: uniqueIndex("test_results_email_idx").on(t.candidateEmail),
  }),
);

export type TestResultRow = typeof testResults.$inferSelect;

export type Department = typeof departments.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type ResponseRow = typeof responses.$inferSelect;
export type AnswerRow = typeof answers.$inferSelect;
export type SettingRow = typeof settings.$inferSelect;
