"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Check, Flag, Flame, PartyPopper } from "lucide-react";
import { setCheckinAction } from "@/app/actions/checkins";
import { ProgressBar } from "@/components/ui/progress-bar";

export type TodayItem = {
  key: string;
  kind: "habit" | "challenge";
  id: string;
  title: string;
  detail: string;
  done: boolean;
  streak?: string;
  href?: string;
};

export function TodayPanel({ items, date }: { items: TodayItem[]; date: string }) {
  const [optimistic, setOptimistic] = useOptimistic(items, (state, change: { key: string; done: boolean }) =>
    state.map((item) => (item.key === change.key ? { ...item, done: change.done } : item)),
  );
  const [error, setError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const done = optimistic.filter((i) => i.done).length;
  const total = optimistic.length;
  const allDone = total > 0 && done === total;

  function toggle(item: TodayItem) {
    const next = !item.done;
    setError(null);
    setJustDone(next ? item.key : null);
    startTransition(async () => {
      setOptimistic({ key: item.key, done: next });
      const result = await setCheckinAction({ kind: item.kind, id: item.id, date, done: next });
      if (!result.ok) {
        setError(result.error);
        setJustDone(null);
      }
    });
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-5xl font-bold leading-none text-navy tabular-nums">
            {done}
            <span className="text-3xl text-ink-3"> / {total}</span>
          </p>
          <p className="mt-2 text-sm text-ink-2" aria-live="polite">
            {allDone ? "Everything done for today." : total === 0 ? "Nothing scheduled today." : `${total - done} left for today`}
          </p>
        </div>
        {allDone && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-tint px-3 py-1.5 text-sm font-semibold text-gold-deep">
            <PartyPopper size={16} aria-hidden="true" /> Proof logged
          </span>
        )}
      </div>
      <ProgressBar value={total ? (done / total) * 100 : 0} label="Today's progress" tone={allDone ? "gold" : "moss"} className="mt-4" />

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-tint px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="mt-5 space-y-2.5">
        {optimistic.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-3.5 rounded-2xl border p-3 pr-4 transition-colors sm:p-3.5 ${
              item.done ? "border-moss/25 bg-moss-tint/60" : "border-line bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item)}
              aria-pressed={item.done}
              aria-label={`${item.done ? "Undo" : "Mark done:"} ${item.title}`}
              className={`grid size-12 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                item.done
                  ? "border-moss bg-moss text-white"
                  : "border-line-strong bg-white text-transparent hover:border-moss hover:text-moss/40"
              } ${justDone === item.key && item.done ? "check-pop" : ""}`}
            >
              <Check size={22} strokeWidth={3} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <p className={`truncate font-semibold ${item.done ? "text-ink-2" : "text-navy"}`}>
                {item.href ? (
                  <Link href={item.href} className="hover:underline">
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink-2">
                {item.kind === "challenge" && <Flag size={13} aria-hidden="true" className="shrink-0 text-teal" />}
                <span className="truncate">{item.detail}</span>
              </p>
            </div>
            {item.streak && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-tint px-2.5 py-1 text-xs font-bold text-gold-deep">
                <Flame size={13} aria-hidden="true" />
                {item.streak}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
