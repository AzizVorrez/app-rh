"use client";

import { DepartmentManager } from "./settings/department-manager";
import { QuestionManager } from "./settings/question-manager";
import { SurveySettings } from "./settings/survey-settings";
import { ThemeManager } from "./settings/theme-manager";
import type { AdminConfig } from "@/lib/types";

export function SettingsTab({
  config,
  responseCount,
  reloadConfig,
  reloadAll,
}: {
  config: AdminConfig;
  responseCount: number;
  reloadConfig: () => Promise<void>;
  reloadAll: () => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <SurveySettings
        settings={config.settings}
        responseCount={responseCount}
        onChanged={reloadConfig}
        onWiped={reloadAll}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <DepartmentManager departments={config.departments} onChanged={reloadConfig} />
        <ThemeManager themes={config.themes} onChanged={reloadConfig} />
      </div>

      <QuestionManager questions={config.questions} themes={config.themes} onChanged={reloadConfig} />
    </div>
  );
}
