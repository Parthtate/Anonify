import { intercept, terms, idf, coef } from './moderation-model.ts';

// Mirrors scikit-learn's TfidfVectorizer(norm='l2', sublinear_tf=False, ngram_range=(1,1))
// followed by LogisticRegression.predict_proba. Weights come from ml/export_model.py.
const index = new Map(terms.map((term, i) => [term, i]));

// scikit-learn's default token_pattern, (?u)\b\w\w+\b — runs of 2+ unicode word chars.
const TOKEN = /[\p{L}\p{N}_]{2,}/gu;

// Held-out Jigsaw: 0.8 caught 43% of toxic comments, 0.7 catches 49% at 0.30% false positives.
export const OFFENSIVE_THRESHOLD = 0.7;

export function offensiveProbability(text: string): number {
  const counts = new Map<number, number>();
  for (const [token] of text.toLowerCase().matchAll(TOKEN)) {
    const i = index.get(token);
    if (i !== undefined) counts.set(i, (counts.get(i) ?? 0) + 1);
  }

  let sumSquares = 0;
  for (const [i, count] of counts) {
    const weight = count * idf[i];
    sumSquares += weight * weight;
  }

  // No in-vocabulary token leaves the feature vector all zeros, same as sklearn.
  let z = intercept;
  if (sumSquares > 0) {
    const norm = Math.sqrt(sumSquares);
    for (const [i, count] of counts) {
      z += ((count * idf[i]) / norm) * coef[i];
    }
  }
  return 1 / (1 + Math.exp(-z));
}

// The model was trained on English Wikipedia comments and scores transliterated
// Hindi/Marathi abuse as harmless, so the common slurs are blocked outright.
// Written in natural spelling; normalised (repeated letters collapsed) at load.
const SLURS = [
  'chutiya', 'chutiye', 'chutia', 'chutya', 'chutiyapa',
  'madarchod', 'maderchod', 'madharchod', 'madarchot', 'mkc',
  'bhenchod', 'behenchod', 'bhainchod', 'bahenchod', 'bhenchot', 'bkl',
  'bhosdike', 'bhosadike', 'bhosdiwale', 'bhosdiwala', 'bhosda', 'bhosdi', 'bsdk',
  'gandu', 'gaandu', 'gandoo',
  'lavde', 'lavda', 'lavdya', 'laude', 'lode', 'lodu', 'lodey',
  'randi', 'randwa', 'randibaaz', 'chinal',
  'bhadwa', 'bhadwe', 'bhadve',
  'jhaat', 'jhant', 'jhatu',
  'hijra', 'hijde',
  'zavadya', 'zhavadya', 'jhavadya', 'zavlya', 'aaighalya', 'fodrichya', 'fodricha',
  'bhikarchot', 'chutmarichya',
  'maakichut', 'behenkilodi', 'bhenkelode', 'maachuda',
].map(collapseRepeats);

function collapseRepeats(s: string): string {
  return s.replace(/(.)\1+/gu, '$1');
}

export function containsSlur(text: string): boolean {
  const normalised = collapseRepeats(text.toLowerCase());
  const tokens = new Set(Array.from(normalised.matchAll(TOKEN), (m) => m[0]));
  // Letters only, so "madar chod" and "m.a.d.a.r.c.h.o.d" still read as one word.
  const squashed = normalised.replace(/[^\p{L}\p{N}]/gu, '');
  // ponytail: substring match on the squashed text can straddle word boundaries;
  // restricted to 7+ letter slurs so it stays rare. Tokenise properly if it bites.
  return SLURS.some(
    (slur) => tokens.has(slur) || (slur.length >= 7 && squashed.includes(slur))
  );
}

export function isOffensive(text: string): boolean {
  return containsSlur(text) || offensiveProbability(text) >= OFFENSIVE_THRESHOLD;
}
