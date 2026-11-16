import { containsSlur, isOffensive, offensiveProbability } from '@/lib/moderate.ts';

// Public, read-only demo for the landing page: scores text without touching the database.
const MAX_LENGTH = 300;

export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== 'string') {
    return Response.json({ message: 'Invalid request' }, { status: 400 });
  }

  const sample = text.slice(0, MAX_LENGTH);
  // The blocklist runs ahead of the model, so a note can be blocked on a low score.
  // Saying which one fired keeps the landing-page demo honest.
  return Response.json({
    blocked: isOffensive(sample),
    reason: containsSlur(sample) ? 'term' : 'score',
    score: Math.round(offensiveProbability(sample) * 100),
  });
}
