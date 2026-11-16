// Asserts the TypeScript moderation port reproduces scikit-learn's probabilities.
// Run: node ml/verify_port.mjs      (fixtures come from ml/make_fixtures.py)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { offensiveProbability, containsSlur, isOffensive, OFFENSIVE_THRESHOLD } from '../src/lib/moderate.ts';

const cases = JSON.parse(readFileSync(new URL('fixtures-moderation.json', import.meta.url), 'utf8'));
const TOLERANCE = 1e-6;

let worst = 0;
let worstCase = null;
for (const { text, prob } of cases) {
  const actual = offensiveProbability(text);
  const diff = Math.abs(actual - prob);
  if (diff > worst) {
    worst = diff;
    worstCase = { text: text.slice(0, 60), expected: prob, actual };
  }
  // A disagreement across the threshold is the failure that actually matters.
  assert.equal(
    actual >= OFFENSIVE_THRESHOLD,
    prob >= OFFENSIVE_THRESHOLD,
    `verdict mismatch (sklearn ${prob}, port ${actual}) for: ${text.slice(0, 80)}`
  );
}

assert.ok(worst < TOLERANCE, `max probability drift ${worst} exceeds ${TOLERANCE}: ${JSON.stringify(worstCase)}`);
const blocked = cases.filter((c) => c.prob >= OFFENSIVE_THRESHOLD).length;
console.log(`OK  ${cases.length} cases (${blocked} blocked), max drift ${worst.toExponential(2)}`);

// Transliterated-slur blocklist: spelling variants, stretched letters, split words, abbreviations.
for (const text of ['tu bahut chutiya hai yaar', 'Madarchod kahin ka', 'chutiyaaaa', 'madar chod', 'bsdk kya kar raha', 'tu ekdam gandu ahes', 'M.A.D.A.R.C.H.O.D']) {
  assert.ok(containsSlur(text), `blocklist missed: ${text}`);
}
// Look-alikes that must pass: food, ordinary Hinglish, names, English the model already handles.
for (const text of ['pass the chutney please', 'chhod do yaar, jaane de', 'Gandhi jayanti ki chhutti hai', 'bro that was a mandatory meeting']) {
  assert.ok(!containsSlur(text), `blocklist false positive: ${text}`);
}
assert.ok(isOffensive('tu bahut chutiya hai yaar') && !isOffensive('Hey, hope your week is going well. Keep it up!'));
console.log('OK  blocklist: 7 slur variants caught, 4 look-alikes passed');
