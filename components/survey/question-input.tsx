"use client";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/primitives";
import type { PublicQuestion } from "@/lib/types";

export type AnswerValue = number | number[] | string | null;

const INACTIVE = "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50";

export function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  switch (question.type) {
    case "emoji":
      return <EmojiInput question={question} value={value as number | null} onChange={onChange} />;
    case "scale5":
      return <ScaleInput value={value as number | null} onChange={onChange} />;
    case "yesno":
      return <YesNoInput question={question} value={value as number | null} onChange={onChange} />;
    case "nps":
      return <NpsInput value={value as number | null} onChange={onChange} />;
    case "multi":
      return <MultiInput question={question} value={(value as number[]) ?? []} onChange={onChange} />;
    case "open":
      return (
        <Textarea
          autoFocus
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Votre réponse libre…"
          className="min-h-[120px]"
        />
      );
    default:
      return null;
  }
}

function EmojiInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {question.options.map((o, i) => {
        const [emoji, ...rest] = o.split(" ");
        const active = value === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "ring-focus flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-3.5 transition-all duration-150",
              active ? "border-brand-500 bg-brand-50 shadow-sm" : INACTIVE,
            )}
          >
            <span className={cn("text-2xl transition-transform sm:text-[28px]", active && "scale-110")}>{emoji}</span>
            <span className={cn("text-center text-[10px] font-medium leading-tight", active ? "text-brand-700" : "text-slate-400")}>
              {rest.join(" ")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ScaleInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span>1 · Pas du tout d'accord</span>
        <span>Tout à fait d'accord · 5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "ring-focus h-12 flex-1 rounded-xl border text-base font-bold transition-all duration-150",
                active ? "border-brand-600 bg-brand-600 text-white shadow-brand-sm" : INACTIVE,
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YesNoInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {question.options.map((o, i) => {
        const active = value === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "ring-focus h-11 rounded-xl border px-3 text-[13px] font-semibold transition-all duration-150",
              active ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm" : INACTIVE,
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function NpsInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span>0 · Pas du tout</span>
        <span>Sans hésiter · 10</span>
      </div>
      <div className="grid grid-cols-11 gap-1.5">
        {Array.from({ length: 11 }, (_, v) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "ring-focus flex h-10 items-center justify-center rounded-lg border text-[13px] font-bold transition-all duration-150",
                active ? "border-brand-600 bg-brand-600 text-white shadow-brand-sm" : INACTIVE,
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion;
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const toggle = (i: number) => {
    if (value.includes(i)) onChange(value.filter((x) => x !== i));
    else onChange([...value, i]);
  };
  return (
    <div>
      <p className="mb-3 text-[11px] font-medium text-slate-400">Sélectionnez tout ce qui s'applique</p>
      <div className="grid grid-cols-2 gap-2">
        {question.options.map((o, i) => {
          const active = value.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={cn(
                "ring-focus flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition-all duration-150",
                active ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm" : INACTIVE,
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[10px] text-white",
                  active ? "border-brand-600 bg-brand-600" : "border-slate-300",
                )}
              >
                {active && "✓"}
              </span>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
