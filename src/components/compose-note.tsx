'use client';

import { useCallback, useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, EyeOff, Loader2, PauseCircle, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { messageSchema } from '@/schemas/messageSchema';
import { ApiResponse } from '@/types/ApiResponse';

const MIN_LENGTH = 10;
const MAX_LENGTH = 300;

type SendError = { title: string; detail: string };

export function ComposeNote({ username }: { username: string }) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });
  const content = form.watch('content') ?? '';
  const tooShort = content.trim().length < MIN_LENGTH;

  const [sendError, setSendError] = useState<SendError | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setIsShuffling(true);
    try {
      const { data } = await axios.post<{ suggestions: string[] }>('/api/suggest-messages');
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setIsShuffling(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsSending(true);
    setSendError(null);
    try {
      await axios.post<ApiResponse>('/api/send-message', { ...data, username });
      form.reset({ content: '' });
      form.setFocus('content');
      toast({ title: 'Sent', description: `@${username} will find it in their inbox.` });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      const code = axiosError.response?.status;
      const detail = axiosError.response?.data.message ?? 'Check your connection and try again.';
      const title =
        code === 400 && /inappropriate/i.test(detail)
          ? 'Blocked by the content filter'
          : code === 400
            ? 'Not sent'
            : code === 403
              ? `@${username} just paused their inbox`
              : code === 404
                ? 'No one is at this link'
                : 'Something went wrong';
      setSendError({ title, detail });
    } finally {
      setIsSending(false);
    }
  };

  const applySuggestion = (text: string) => {
    form.setValue('content', text, { shouldValidate: true, shouldDirty: true });
    setSendError(null);
    form.setFocus('content');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <section aria-labelledby="compose-heading">
        <p className="text-sm font-medium text-olive">Anonymous note</p>
        <h1
          id="compose-heading"
          className="mt-1 break-words font-display text-3xl font-bold text-stone-900 md:text-4xl"
        >
          Write to @{username}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-stone-600">
          No sign-in needed. Your name is never attached — @{username} sees only the words.
        </p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 rounded-xl border border-leaf bg-white p-5 shadow-sm md:p-6"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-stone-900">Your note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      maxLength={MAX_LENGTH}
                      placeholder="Something honest, kind, or curious…"
                      className="min-h-[9rem] resize-y border-leaf bg-stone-50 font-display text-lg leading-relaxed text-stone-800 placeholder:font-sans placeholder:text-base placeholder:text-stone-400 focus-visible:ring-olive"
                    />
                  </FormControl>
                  <div className="flex items-start justify-between gap-4 text-xs">
                    <FormMessage />
                    <span
                      className={cn(
                        'ml-auto shrink-0 tabular-nums',
                        tooShort && content.length > 0 ? 'text-clay-dark' : 'text-stone-500'
                      )}
                    >
                      {content.length} / {MAX_LENGTH}
                      {tooShort && content.length > 0 && ` · at least ${MIN_LENGTH}`}
                    </span>
                  </div>
                </FormItem>
              )}
            />
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-stone-500">
                Notes are filtered for abuse before delivery.
              </p>
              <Button
                type="submit"
                disabled={isSending || tooShort}
                className="min-w-[7rem] bg-clay text-white hover:bg-clay-dark"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </form>
        </Form>

        {sendError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold">{sendError.title}</p>
              <p className="mt-0.5">{sendError.detail}</p>
            </div>
          </div>
        )}
      </section>

      <aside className="space-y-6">
        <section
          aria-labelledby="ideas-heading"
          className="rounded-xl border border-leaf bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="ideas-heading" className="text-base font-semibold text-stone-900">
              Need a starting point?
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSuggestions}
              disabled={isShuffling}
              className="-mr-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <RefreshCcw
                className={cn('mr-2 h-4 w-4', isShuffling && 'animate-spin')}
                aria-hidden="true"
              />
              Shuffle
            </Button>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Tap one to use it as your note, then edit freely.
          </p>
          <ul className="mt-4 space-y-2" aria-busy={isShuffling}>
            {suggestions.length === 0
              ? [0, 1, 2].map((i) => (
                  <li key={i} className="h-11 animate-pulse rounded-lg bg-stone-100" />
                ))
              : suggestions.map((text) => (
                  <li key={text}>
                    <button
                      type="button"
                      onClick={() => applySuggestion(text)}
                      className="w-full rounded-lg border border-leaf bg-stone-50 px-3 py-2.5 text-left text-sm text-stone-800 transition-[color,background-color,border-color,transform] duration-200 hover:border-sage hover:bg-stone-100 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive motion-reduce:transition-none motion-reduce:active:scale-100"
                    >
                      {text}
                    </button>
                  </li>
                ))}
          </ul>
        </section>

        <section
          aria-labelledby="how-heading"
          className="rounded-xl border border-leaf bg-white p-5"
        >
          <h2 id="how-heading" className="text-sm font-semibold text-stone-900">
            How this works
          </h2>
          <ul className="mt-3 space-y-3 text-sm text-stone-600">
            <li className="flex gap-3">
              <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-olive" aria-hidden="true" />
              <span>Nothing identifies you — no account, no name, no email.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-olive" aria-hidden="true" />
              <span>Abusive notes are filtered out before delivery.</span>
            </li>
            <li className="flex gap-3">
              <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-olive" aria-hidden="true" />
              <span>@{username} can pause their inbox at any time.</span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
