"""Generate the fixture that pins the TypeScript port to scikit-learn's output.

Run after export_model.py:  python ml/make_fixtures.py
Then check the port with:   node ml/verify_port.mjs
"""
import json
import os

import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MAX_LEN = 300
N_PER_CLASS = 150

vectorizer = joblib.load(os.path.join(BASE_DIR, 'vectorizer.pkl'))
model = joblib.load(os.path.join(BASE_DIR, 'offensive_language_model.pkl'))

data = pd.read_csv(os.path.join(BASE_DIR, 'labeled_data.csv'))
# class 2 is "neither" in this dataset; 0/1 are hate speech and offensive language.
clean = data[data['class'] == 2]['tweet'].head(N_PER_CLASS)
flagged = data[data['class'] != 2]['tweet'].head(N_PER_CLASS)

texts = [str(t)[:MAX_LEN] for t in pd.concat([clean, flagged])]
# Edge cases the corpus will not cover.
texts += ['', '   ', 'a', 'ok', '???', 'ZZZQQQ unseen token', 'hate hate hate hate']

probs = model.predict_proba(vectorizer.transform(texts))[:, 1]

cases = [{'text': t, 'prob': round(float(p), 12)} for t, p in zip(texts, probs)]
out = os.path.join(BASE_DIR, 'fixtures-moderation.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump(cases, f, ensure_ascii=False, indent=1)

print(f'wrote {len(cases)} cases to {out}')
