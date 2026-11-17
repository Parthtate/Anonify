import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import {
  Ban,
  Github,
  Link2,
  PauseCircle,
  Send,
  ShieldCheck,
  Trash2,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { SiteHeader, headerGhostClass, headerPrimaryClass } from '@/components/site-header';
import { FaqList, FilterDemo } from '@/components/landing-interactive';

const REPO = 'https://github.com/Parthtate/Anonify';

const CREED = ['Anonymity.', 'Honesty.', 'Freedom.'];

// Illustrative, not testimonials — the section says so.
const SAMPLE_NOTES = [
  { text: "You're the reason I started running again. Thank you.", tilt: '-rotate-2' },
  { text: 'Your laugh is unreasonably loud and I love it.', tilt: 'rotate-1' },
  { text: "I've had a crush on you since first year. That's all. Bye.", tilt: '-rotate-1' },
  { text: 'You explain things better than our professor does.', tilt: 'rotate-2' },
  { text: 'Tell your mum her samosas genuinely changed my life.', tilt: '-rotate-1' },
];

const STEPS = [
  {
    icon: Link2,
    title: 'Claim your link',
    body: 'Pick a username and you get anonify/u/yourname. Takes a minute, and a verification code by email.',
  },
  {
    icon: Send,
    title: 'Share it anywhere',
    body: 'Instagram bio, WhatsApp status, group chat. Anyone who opens it can write to you without an account.',
  },
  {
    icon: ShieldCheck,
    title: 'Read what arrives',
    body: 'Notes land in your inbox newest first. Anything the filter flags as abusive never gets that far.',
  },
];

const FEATURES = [
  {
    icon: UserX,
    title: 'Senders stay unknown',
    body: 'No account, no name, no email, no IP shown to you. A note is the words and the time it arrived — nothing else.',
  },
  {
    icon: Ban,
    title: 'Filtered before delivery',
    body: 'Every note is scored the moment it is sent. Blocked ones are refused outright, never stored, never shown to you.',
  },
  {
    icon: PauseCircle,
    title: 'Pause whenever',
    body: 'One switch closes your inbox. Your link stays alive and politely tells people you are not taking notes right now.',
  },
  {
    icon: Trash2,
    title: 'Your inbox, your rules',
    body: 'Delete a single note, or clear the whole inbox in one confirmed action. Senders are never told.',
  },
];

const FAQS = [
  {
    q: 'Is it genuinely anonymous?',
    a: 'Yes, to you. Senders need no account and nothing about their identity is attached to a note or shown in your inbox. Like any web app, the hosting platform keeps its own request logs, so treat it as anonymous between people — not as a tool for anything that matters legally.',
  },
  {
    q: 'What happens to a blocked note?',
    a: 'It is rejected at the moment of sending. The person writing it sees that it was blocked, and it is never written to the database — so there is nothing for you to read, report, or delete.',
  },
  {
    q: 'Does the filter catch everything?',
    a: 'No, and we would rather say so. It is strong on plain English insults and on common transliterated Hindi and Marathi abuse. It is weaker on sarcasm, threats phrased politely, and deliberate misspellings like "st*pid". You can always pause your inbox or delete anything that gets through.',
  },
  {
    q: 'Is it free?',
    a: 'Completely. No ads, no payment, no premium tier. It is a final-year engineering project, and the code is public.',
  },
];

// Resolved against metadataBase, so it follows the deployed origin rather than
// pinning a host here. Stops the www redirect and the vercel.app alias from being
// read as three sites with the same content.
export const metadata: Metadata = { alternates: { canonical: '/' } };

// Tells Google this is one product with a name, not a generic page, which is what
// earns a branded result rather than a plain blue link.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Anonify',
  url: process.env.NEXTAUTH_URL,
  applicationCategory: 'SocialNetworkingApplication',
  operatingSystem: 'Any',
  description:
    'Share one link and let anyone write to you anonymously. A trained filter blocks abusive notes before they reach your inbox.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  isAccessibleForFree: true,
  sameAs: [REPO],
};

export default async function Home() {
  // Reads the session so the page greets a signed-in visitor instead of selling to them.
  const session = await getServerSession(authOptions);
  const username = session?.user?.username;

  return (
    <div className="min-h-screen bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <SiteHeader>
        <Button asChild variant="ghost" size="sm" className={headerGhostClass}>
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            <Github className="h-4 w-4 sm:mr-2" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">GitHub</span>
          </a>
        </Button>
        {username ? (
          <Button asChild size="sm" className={headerPrimaryClass}>
            <Link href="/dashboard">Go to your inbox</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className={headerGhostClass}>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm" className={headerPrimaryClass}>
              <Link href="/sign-up">Create inbox</Link>
            </Button>
          </>
        )}
      </SiteHeader>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 md:px-6 md:pb-20 md:pt-16">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
            <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 motion-reduce:animate-none">
              <ul className="flex flex-wrap gap-2.5">
                {CREED.map((word, i) => (
                  <li
                    key={word}
                    className={cn(
                      'rounded-xl border-2 px-3.5 py-1.5 font-display text-lg font-bold shadow-sm transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:rotate-0 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 md:text-xl',
                      i === 0 && 'border-olive bg-olive text-paper -rotate-2',
                      i === 1 && 'border-clay bg-clay text-white rotate-1',
                      i === 2 && 'border-moss bg-sage text-olive -rotate-1'
                    )}
                  >
                    {word}
                  </li>
                ))}
              </ul>

              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] text-stone-900 md:text-6xl">
                Find out what people
                <br className="hidden sm:block" /> really think.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 md:text-lg">
                Share one link. Anyone can write to you without signing in, and nothing about them
                reaches you. The cruel stuff never arrives — a trained filter catches it at the
                door.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="h-12 bg-clay px-7 text-base text-white hover:bg-clay-dark"
                >
                  <Link href={username ? '/dashboard' : '/sign-up'}>
                    {username ? 'Go to your inbox' : 'Create your inbox'}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="h-12 px-4 text-base text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                >
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-stone-500">
                {username ? (
                  <>
                    Signed in as{' '}
                    <span className="font-medium text-olive">@{username}</span> — your link is{' '}
                    <span className="font-mono text-stone-600">/u/{username}</span>
                  </>
                ) : (
                  'Free forever · No card · Takes about a minute'
                )}
              </p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both delay-150 duration-700 motion-reduce:animate-none lg:pt-4">
              <p className="font-display text-xl font-bold text-stone-900">
                Go on — try to sneak something past it
              </p>
              <p className="mb-3 mt-1 text-sm text-stone-600">
                This is the real filter that guards every inbox, running live.
              </p>
              <FilterDemo />
            </div>
          </div>
        </section>

        {/* Note wall */}
        <section aria-labelledby="wall" className="bg-olive">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
            <h2 id="wall" className="font-display text-3xl font-bold text-paper md:text-4xl">
              This is what lands in your inbox
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/75">
              Examples, not real notes — but this is the shape of it. Short, unsigned, and
              occasionally the nicest thing you&apos;ll read all week.
            </p>
            <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_NOTES.map((note) => (
                <li
                  key={note.text}
                  className={cn(
                    'rounded-xl border border-leaf bg-white p-5 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:rotate-0 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0',
                    note.tilt
                  )}
                >
                  <p className="font-display text-lg leading-relaxed text-stone-800">
                    {note.text}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-stone-500">Anonymous</p>
                </li>
              ))}
              <li className="rotate-1 rounded-xl border border-dashed border-sage/60 bg-olive p-5 transition-transform duration-200 hover:rotate-0 motion-reduce:transition-none">
                <p className="font-display text-lg leading-relaxed text-paper/30 line-through decoration-sage/70">
                  you are so stupid, nobody likes you
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sage">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Blocked — never delivered
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="border-y border-leaf bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
            <h2
              id="how"
              className="scroll-mt-20 font-display text-3xl font-bold text-stone-900 md:text-4xl"
            >
              Three steps, then you wait
            </h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-leaf bg-stone-50 p-5 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive text-sm font-semibold text-white tabular-nums">
                      {i + 1}
                    </span>
                    <step.icon className="h-5 w-5 text-moss" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-stone-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features" className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <h2 id="features" className="font-display text-3xl font-bold text-stone-900">
            Anonymity you can hand to anyone
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600">
            Open inboxes usually come with a cost: one cruel note can ruin the fun. Anonify keeps
            the honesty and removes the part nobody wants.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-leaf bg-white p-5 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-sage hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <feature.icon className="h-5 w-5 text-olive" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="border-y border-leaf bg-white">
          <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-16">
            <h2
              id="faq"
              className="scroll-mt-20 font-display text-3xl font-bold text-stone-900 md:text-4xl"
            >
              Questions people ask
            </h2>
            <div className="mt-8">
              <FaqList items={FAQS} />
            </div>
          </div>
        </section>

        {/* Closing CTA — back to the base tint, so the footer reads as its own block */}
        <section className="bg-stone-50">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6">
            <p className="font-display text-2xl text-olive md:text-3xl">
              Anonymity. Honesty. Freedom.
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-stone-900 md:text-4xl">
              So — what would people say to you?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-stone-600">
              {username
                ? 'Your link is ready. Share it and find out.'
                : 'One minute to set up. Then share your link and find out.'}
            </p>
            <Button
              asChild
              className="mt-7 h-12 bg-clay px-7 text-base text-white hover:bg-clay-dark"
            >
              <Link href={username ? '/dashboard' : '/sign-up'}>
                {username ? 'Go to your inbox' : 'Create your inbox'}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-moss bg-sage">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <span className="flex items-center gap-2">
                {/* Footer is sage, so the black mark reads as-is — no inversion. */}
                <Logo className="h-6 w-6" />
                <span className="font-display text-lg font-bold tracking-wide text-olive">
                  ANONIFY
                </span>
              </span>
              <p className="mt-3 font-display text-base text-olive">
                Anonymity. Honesty. Freedom.
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-700">
                Anonymous messaging with AI-assisted moderation. Every note is screened before it
                reaches an inbox. Free and open source.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-olive">Explore</h2>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                <li>
                  <a href="#how" className="underline-offset-4 hover:text-stone-900 hover:underline">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#wall" className="underline-offset-4 hover:text-stone-900 hover:underline">
                    What people send
                  </a>
                </li>
                <li>
                  <a href="#faq" className="underline-offset-4 hover:text-stone-900 hover:underline">
                    Questions
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-olive">
                {username ? 'Your account' : 'Get started'}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                {username ? (
                  <>
                    <li>
                      <Link
                        href="/dashboard"
                        className="underline-offset-4 hover:text-stone-900 hover:underline"
                      >
                        Your inbox
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={`/u/${username}`}
                        className="underline-offset-4 hover:text-stone-900 hover:underline"
                      >
                        Your public link
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        href="/sign-up"
                        className="underline-offset-4 hover:text-stone-900 hover:underline"
                      >
                        Create an inbox
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/sign-in"
                        className="underline-offset-4 hover:text-stone-900 hover:underline"
                      >
                        Sign in
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <a
                    href={REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-stone-900 hover:underline"
                  >
                    <Github className="h-3.5 w-3.5" aria-hidden="true" />
                    Source on GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-moss/50 pt-6 text-xs text-stone-700">
            <p>Be kind. Someone reads these.</p>
            <p>Built as a final-year engineering project.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
