'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Native <details> can't animate open — closed content isn't rendered — so this is a
 *  minimal accordion using the 0fr→1fr grid trick, which transitions in every modern browser. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ul className="divide-y divide-leaf border-y border-leaf">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <li key={item.q}>
            <h3>
              <button
                type="button"
                id={`faq-btn-${i}`}
                aria-expanded={open}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-start justify-between gap-4 py-4 text-left font-semibold text-stone-900 transition-colors hover:text-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive motion-reduce:transition-none"
              >
                {item.q}
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 shrink-0 text-xl leading-none text-olive transition-transform duration-300 ease-out motion-reduce:transition-none',
                    open && 'rotate-45'
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-btn-${i}`}
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden" aria-hidden={!open}>
                <p
                  className={cn(
                    'pb-5 pr-8 text-sm leading-relaxed text-stone-600 transition-opacity duration-300 motion-reduce:transition-none',
                    open ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const SAMPLES = [
  {
    label: 'Say something nice',
    text: "You probably don't know this, but you made my first week here so much easier.",
  },
  { label: 'Try an insult', text: 'shut up already, you idiot' },
  { label: 'Try Hinglish', text: 'abe gandu, kaam kar le thoda' },
];

type Verdict = { blocked: boolean; reason: 'term' | 'score'; score: number };

export function FilterDemo() {
  const [text, setText] = useState(SAMPLES[0].text);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Put the caret in the demo on arrival so it visibly invites editing. Restricted to
  // large screens with a real pointer: on touch this would open the keyboard and scroll
  // the hero out of view, and preventScroll stops the page jumping even on desktop.
  useEffect(() => {
    const safeToFocus = window.matchMedia(
      '(min-width: 1024px) and (hover: hover) and (pointer: fine)'
    ).matches;
    if (!safeToFocus) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  useEffect(() => {
    const sample = text.trim();
    if (!sample) {
      setVerdict(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsScoring(true);
      try {
        const { data } = await axios.post<Verdict>(
          '/api/moderation-demo',
          { text: sample },
          { signal: controller.signal }
        );
        setVerdict(data);
      } catch {
        // An aborted or failed probe simply leaves the previous verdict in place.
      } finally {
        setIsScoring(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  return (
    <div className="rounded-2xl border border-leaf bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => setText(sample.text)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive motion-reduce:transition-none motion-reduce:active:scale-100',
              text === sample.text
                ? 'border-olive bg-olive text-white'
                : 'border-leaf bg-stone-50 text-stone-700 hover:border-sage hover:bg-stone-100'
            )}
          >
            {sample.label}
          </button>
        ))}
      </div>

      <label htmlFor="demo" className="mt-4 block text-sm font-semibold text-stone-900">
        Write a note
      </label>
      <textarea
        id="demo"
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={300}
        className="mt-2 w-full resize-none rounded-lg border border-leaf bg-stone-50 p-3 font-display text-lg leading-relaxed text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive"
      />

      <div className="mt-4 flex items-center justify-between gap-4" aria-live="polite">
        {verdict ? (
          <>
            <p
              className={cn(
                'flex items-center gap-2 text-sm font-semibold',
                verdict.blocked ? 'text-red-700' : 'text-olive'
              )}
            >
              {verdict.blocked ? (
                <ShieldX className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              )}
              {verdict.blocked ? 'Blocked before delivery' : 'Delivered'}
            </p>
            <p className="flex items-center gap-2 text-xs text-stone-500">
              {isScoring && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
              {verdict.reason === 'term' ? (
                'matched a blocked term'
              ) : (
                <>
                  <span className="tabular-nums">{verdict.score}%</span> likely offensive
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-stone-500">Type something to see the verdict.</p>
        )}
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100"
        role="img"
        aria-label={
          verdict
            ? verdict.reason === 'term'
              ? 'Blocked by the term list'
              : `${verdict.score} percent likely offensive`
            : 'No score yet'
        }
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 motion-reduce:transition-none',
            verdict?.blocked ? 'bg-red-500' : 'bg-sage'
          )}
          style={{ width: `${verdict?.reason === 'term' ? 100 : (verdict?.score ?? 0)}%` }}
        />
      </div>
    </div>
  );
}
