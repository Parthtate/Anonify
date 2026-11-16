'use client';

import { useCallback, useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Check, Copy, ExternalLink, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { MessageCard } from '@/components/message-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Message } from '@/model/User';
import { ApiResponse } from '@/types/ApiResponse';

const BATCH_SIZE = 12;
const FALLBACK_ERROR = 'Check your connection and try again.';

export default function UserDashboard() {
  const { data: session } = useSession();
  const username = session?.user?.username;
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isAccepting, setIsAccepting] = useState<boolean | null>(null);
  const [isSavingAccept, setIsSavingAccept] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (username) setProfileUrl(`${window.location.origin}/u/${username}`);
  }, [username]);

  const showLoadError = useCallback(
    (error: unknown) => {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Could not load your notes',
        description: axiosError.response?.data.message ?? FALLBACK_ERROR,
        variant: 'destructive',
      });
    },
    [toast]
  );

  // 'initial' shows skeletons; 'visible' dims the current list; 'silent' swaps in place.
  const fetchLatest = useCallback(
    async (mode: 'initial' | 'visible' | 'silent') => {
      if (mode === 'initial') setIsLoadingMessages(true);
      if (mode === 'visible') setIsRefreshing(true);
      try {
        const { data } = await axios.get<ApiResponse>('/api/get-messages', {
          params: { limit: BATCH_SIZE },
        });
        setMessages(data.messages ?? []);
        setTotal(data.total ?? 0);
        setHasMore(Boolean(data.hasMore));
      } catch (error) {
        showLoadError(error);
      } finally {
        setIsLoadingMessages(false);
        setIsRefreshing(false);
      }
    },
    [showLoadError]
  );

  const loadMore = async () => {
    const oldest = messages[messages.length - 1];
    if (!oldest || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { data } = await axios.get<ApiResponse>('/api/get-messages', {
        params: { before: new Date(oldest.createdAt).toISOString(), limit: BATCH_SIZE },
      });
      const incoming = data.messages ?? [];
      setMessages((current) => {
        const seen = new Set(current.map((m) => m._id));
        return [...current, ...incoming.filter((m) => !seen.has(m._id))];
      });
      setTotal(data.total ?? total);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      showLoadError(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchAcceptMessages = useCallback(async () => {
    try {
      const { data } = await axios.get<ApiResponse>('/api/accept-messages');
      setIsAccepting(Boolean(data.isAcceptingMessages));
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Could not load your settings',
        description: axiosError.response?.data.message ?? FALLBACK_ERROR,
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!username) return;
    fetchLatest('initial');
    fetchAcceptMessages();
  }, [username, fetchLatest, fetchAcceptMessages]);

  const handleAcceptChange = async (next: boolean) => {
    const previous = isAccepting;
    setIsAccepting(next);
    setIsSavingAccept(true);
    try {
      await axios.post<ApiResponse>('/api/accept-messages', { acceptMessages: next });
      toast({ title: next ? 'Accepting new notes' : 'Paused. Your link now shows a notice.' });
    } catch (error) {
      setIsAccepting(previous);
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Could not update the setting',
        description: axiosError.response?.data.message ?? FALLBACK_ERROR,
        variant: 'destructive',
      });
    } finally {
      setIsSavingAccept(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Select the link and copy it manually.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const deleteAllMessages = async () => {
    setIsDeletingAll(true);
    try {
      const { data } = await axios.delete<ApiResponse>('/api/delete-messages');
      setMessages([]);
      setTotal(0);
      setHasMore(false);
      const count = data.deleted ?? total;
      toast({ title: `Deleted ${count} ${count === 1 ? 'note' : 'notes'}` });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Could not delete your notes',
        description: axiosError.response?.data.message ?? FALLBACK_ERROR,
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const remaining = messages.filter((m) => m._id !== messageId);
    setMessages(remaining);
    setTotal((current) => Math.max(0, current - 1));
    // Every visible note was deleted but older ones exist: bring the next batch forward.
    if (remaining.length === 0 && hasMore) fetchLatest('silent');
  };

  const summary = isLoadingMessages
    ? 'Loading your notes…'
    : total === 0
      ? 'No notes yet'
      : `${total} ${total === 1 ? 'note' : 'notes'} · newest first`;
  const nextBatch = Math.min(BATCH_SIZE, Math.max(0, total - messages.length));

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="h-5 text-sm font-medium text-olive">{username ? `@${username}` : ''}</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-stone-900 md:text-4xl">
              Your inbox
            </h1>
            <p className="mt-2 text-sm text-stone-600">{summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchLatest('visible')}
              disabled={isRefreshing || isLoadingMessages}
              className="border-leaf bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Refresh
            </Button>
            {total > 0 && !isLoadingMessages && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled={isDeletingAll || isRefreshing}
                    className="text-stone-600 hover:bg-red-50 hover:text-red-600 focus-visible:text-red-600"
                  >
                    {isDeletingAll ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Delete all
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {total === 1 ? 'Delete your only note?' : `Delete all ${total} notes?`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Every note in your inbox will be removed permanently. Senders are not
                      notified, and this cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep them</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAllMessages}
                      className={buttonVariants({ variant: 'destructive' })}
                    >
                      Delete all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </header>

        <section
          aria-labelledby="share-heading"
          className="mt-8 rounded-xl border border-leaf bg-white p-5 shadow-sm md:p-6"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 id="share-heading" className="text-base font-semibold text-stone-900">
                Your link
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Anyone with this link can write to you without signing in.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={profileUrl}
                  aria-label="Your public link"
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-10 min-w-0 flex-1 rounded-md border border-leaf bg-stone-50 px-3 font-mono text-sm text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={copyLink}
                    disabled={!profileUrl}
                    className="min-w-[7.5rem] bg-clay text-white hover:bg-clay-dark"
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      'border-leaf bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900',
                      !profileUrl && 'pointer-events-none opacity-50'
                    )}
                  >
                    <a href={profileUrl || '#'} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                      Preview
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-leaf bg-stone-50 p-4 md:w-72 md:shrink-0">
              <Switch
                id="accepting"
                checked={isAccepting ?? false}
                disabled={isAccepting === null || isSavingAccept}
                onCheckedChange={handleAcceptChange}
                className="mt-0.5 data-[state=checked]:bg-olive"
              />
              <div className="min-w-0">
                <Label htmlFor="accepting" className="text-sm font-semibold text-stone-900">
                  Accepting new notes
                </Label>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {isAccepting === null
                    ? 'Checking…'
                    : isAccepting
                      ? 'Your link is live.'
                      : 'Paused. Senders see a “not accepting messages” notice.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Notes" className="mt-8">
          {isLoadingMessages ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-40 animate-pulse rounded-xl border border-leaf bg-white/70" />
              ))}
            </ul>
          ) : total === 0 ? (
            <div className="rounded-xl border border-dashed border-sage bg-white px-6 py-14 text-center">
              <h2 className="font-display text-2xl text-stone-900">Nothing here yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
                Share your link with a few people. Notes land here the moment they are sent, and
                anything abusive is filtered out before you see it.
              </p>
              <Button
                onClick={copyLink}
                disabled={!profileUrl}
                className="mt-6 min-w-[9rem] bg-clay text-white hover:bg-clay-dark"
              >
                {copied ? 'Copied' : 'Copy your link'}
              </Button>
            </div>
          ) : (
            <>
              <ul
                aria-busy={isRefreshing}
                className={cn(
                  'grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3',
                  isRefreshing && 'pointer-events-none opacity-60'
                )}
              >
                {messages.map((message, index) => (
                  <li
                    key={message._id}
                    className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 motion-reduce:animate-none"
                    style={{ animationDelay: `${Math.min(index % BATCH_SIZE, 8) * 40}ms` }}
                  >
                    <MessageCard message={message} onMessageDelete={handleDeleteMessage} />
                  </li>
                ))}
              </ul>

              {(hasMore || total > BATCH_SIZE) && (
                <div className="mt-8 flex flex-col items-center gap-3 border-t border-leaf pt-6">
                  {hasMore ? (
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="min-w-[11rem] border-leaf bg-white text-stone-800 hover:bg-stone-100 hover:text-stone-900"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Loading…
                        </>
                      ) : (
                        `Load ${nextBatch} more…`
                      )}
                    </Button>
                  ) : (
                    <p className="text-sm text-stone-600">You&apos;re all caught up.</p>
                  )}
                  <p className="text-xs text-stone-500">
                    Showing <span className="tabular-nums">{messages.length}</span> of {total} notes
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
