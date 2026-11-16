# Moderation model

The classifier that screens every note. Trained offline in Python, then exported so
inference runs inside the Next.js app in TypeScript — no Python at request time.

## Files

| File | Tracked | What it is |
|---|---|---|
| `train_model.py` | yes | Trains TF-IDF + logistic regression on the Jigsaw dataset |
| `export_model.py` | yes | Exports the fitted weights to `src/lib/moderation-model.ts` |
| `make_fixtures.py` | yes | Generates `fixtures-moderation.json` from the real model |
| `verify_port.mjs` | yes | Asserts the TypeScript port matches scikit-learn exactly |
| `predict.py` | yes | The original Python CLI predictor, kept for reference — the app no longer calls it |
| `vectorizer.pkl`, `offensive_language_model.pkl` | yes | The fitted model (small) |
| `labeled_data.csv` | yes | Davidson tweet dataset, used for fixtures and evaluation |
| `train.csv` | **no** | 65 MB — download it (see below) |

## Getting the training data

`train.csv` is not committed, because a 65 MB file in git is paid for by every clone,
forever. Download it from the Jigsaw Toxic Comment Classification Challenge:

<https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge/data>

Put `train.csv` in this folder. Everything resolves relative to the scripts, so no
paths need editing.

## Retraining end to end

```bash
pip install pandas scikit-learn joblib
python ml/train_model.py      # fits the model, writes the two .pkl files
python ml/export_model.py     # regenerates src/lib/moderation-model.ts
python ml/make_fixtures.py    # regenerates the parity fixtures
npm run verify:moderation     # fails if the TS port drifts from scikit-learn
```

The last step is the important one: it checks every fixture through the TypeScript
implementation the app actually uses, and fails on any disagreement about whether a
message is blocked.

## How it works

Each note is lowercased and split into words, TF-IDF weighted over a 10,000-word
vocabulary, and scored by a logistic regression trained on ~160,000 labelled
Wikipedia comments. Scores at or above `OFFENSIVE_THRESHOLD` (0.7) are blocked.

`src/lib/moderate.ts` also carries a hard blocklist of transliterated Hindi and
Marathi slurs. The English-trained model scores those as harmless, so the list runs
first — that is why a blocked note can show a low probability.

## Known limits

- Catches roughly half of all toxic comments at the shipped threshold, with ~0.3% of
  ordinary notes wrongly blocked. Tuned to avoid punishing innocent messages.
- Only the `toxic` label was used for training, so it is weak on comments labelled
  purely as insult, obscene or threat (~7% caught).
- Blind to deliberate obfuscation (`st*pid`, `f u c k`), sarcasm, and politely
  phrased threats.
- Using all six Jigsaw labels plus `labeled_data.csv`, and adding character n-grams,
  are the obvious next improvements.
