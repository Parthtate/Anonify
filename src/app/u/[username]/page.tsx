import { Metadata } from 'next';
import Link from 'next/link';
import { Link2Off, PauseCircle } from 'lucide-react';
import { ComposeNote } from '@/components/compose-note';
import { SiteHeader, headerOutlineClass } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

// Reads the recipient on every request so a dead or paused link says so up front,
// instead of letting someone write a note and fail on send.
export const dynamic = 'force-dynamic';

type Params = { params: { username: string } };

async function findRecipient(raw: string) {
  const username = decodeURIComponent(raw);
  await dbConnect();
  return UserModel.findOne({ username, isVerified: true }, 'username isAcceptingMessages').lean();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  const title = `Write to @${username}`;
  const description = `Send @${username} an anonymous note on Anonify. No sign-in needed, and abuse is filtered before delivery.`;
  return {
    title,
    description,
    openGraph: { title: `${title} · Anonify`, description, type: 'website' },
  };
}

export default async function SendMessagePage({ params }: Params) {
  const recipient = await findRecipient(params.username);
  const username = decodeURIComponent(params.username);

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader>
        <Button
          asChild
          variant="outline"
          size="sm"
          className={headerOutlineClass}
        >
          <Link href="/sign-up">Get your own inbox</Link>
        </Button>
      </SiteHeader>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {!recipient ? (
          <div className="mx-auto max-w-lg rounded-xl border border-dashed border-sage bg-white px-6 py-14 text-center">
            <Link2Off className="mx-auto h-7 w-7 text-stone-400" aria-hidden="true" />
            <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">
              Nobody is at this link
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
              There is no inbox for <span className="font-mono">@{username}</span>. The link may be
              mistyped, or the account was never verified.
            </p>
            <Button asChild className="mt-6 bg-clay text-white hover:bg-clay-dark">
              <Link href="/sign-up">Create this inbox</Link>
            </Button>
          </div>
        ) : !recipient.isAcceptingMessages ? (
          <div className="mx-auto max-w-lg rounded-xl border border-leaf bg-white px-6 py-14 text-center shadow-sm">
            <PauseCircle className="mx-auto h-7 w-7 text-olive" aria-hidden="true" />
            <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">
              @{recipient.username} has paused their inbox
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
              They are not taking new notes right now. Try again later — the link stays the same.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-6 border-leaf bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900"
            >
              <Link href="/">What is Anonify?</Link>
            </Button>
          </div>
        ) : (
          <ComposeNote username={recipient.username} />
        )}
      </div>
    </main>
  );
}
