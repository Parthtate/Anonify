# ANONIFY — Advancing Anonymous Communication on Social Networks Through AI-Enabled Content Moderation

Anonify is an anonymous messaging platform. You share one link, anyone can write to you
without signing in, and nothing about the sender reaches you. A trained classifier screens
every note and refuses abusive ones **before** they are stored — so the recipient never has
to read them.

It addresses a real problem with anonymous inboxes: anonymity invites honesty, but it also
invites abuse. Anonify keeps the first and filters the second.

---

## 📽️ Demo

https://github.com/user-attachments/assets/f4e9b7c4-548e-46cd-bec1-ebc3a68d2370

---

## 🚀 Features

- **Anonymous by design** — senders need no account; a note is its text and a timestamp, nothing else
- **Moderation before delivery** — blocked notes are rejected at send time and never written to the database
- **Transliterated abuse handling** — a blocklist covers Hindi/Marathi slurs that an English-trained model scores as harmless
- **Pause your inbox** — one switch; your link stays alive and tells senders you are not taking notes
- **Delete one note or all of them** — with confirmation, and senders are never notified
- **Password reset** — hashed, single-use, one-hour tokens over email
- **Rate limiting** — per-IP, per-recipient and per-email caps on every public endpoint

---

## 🧠 How the moderation works

Notes are scored by **TF-IDF + logistic regression**, trained on roughly 160,000 labelled
Wikipedia comments (Jigsaw Toxic Comment Classification Challenge).

Training happens offline in **Python** (`ml/train_model.py`). The fitted weights are then
exported to a TypeScript module (`ml/export_model.py` → `src/lib/moderation-model.ts`), and
**inference runs inside the Next.js app in TypeScript** — there is no Python process, and no
third-party moderation API, at request time. A note never leaves the server to be judged.

`npm run verify:moderation` asserts the TypeScript implementation reproduces scikit-learn's
output exactly (307 fixtures, max probability drift ~1.75e-7).

Measured on held-out data: **0.966 AUC**. At the shipped threshold of 0.7 it blocks about
half of all toxic comments while wrongly blocking ~0.3% of ordinary ones — deliberately
tuned against punishing innocent messages. See [`ml/README.md`](ml/README.md) for the
retraining pipeline and the known limits.

---

## 🛠️ Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) with TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Auth | NextAuth (Auth.js) — credentials provider, JWT sessions |
| Database | MongoDB Atlas via Mongoose |
| Email | Brevo transactional API with React Email templates |
| Moderation | scikit-learn offline → TypeScript inference in-app |
| Hosting | Vercel |

---

## ⚙️ Running it locally

```bash
git clone https://github.com/Parthtate/Anonify.git
cd Anonify
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # http://localhost:3000
```

### Environment variables

| Variable | What it is |
|---|---|
| `MONGODB_URI` | MongoDB connection string, including the database name |
| `NEXTAUTH_SECRET` | Any long random string (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; the deployed URL in production |
| `BREVO_API_KEY` | Brevo **API key** (starts `xkeysib-`, not the SMTP key) |
| `BREVO_SENDER_EMAIL` | A sender address verified in Brevo |
| `E2E_EMAIL` | Inbox the test suite signs up with. Optional; falls back to `BREVO_SENDER_EMAIL` |

`NEXTAUTH_URL` must be the real origin in production — password-reset and verification
links are built from it.

Keep `E2E_EMAIL` pointed at a mailbox you can actually read. Once `BREVO_SENDER_EMAIL`
is a no-reply address on an authenticated domain, the suite signing up as the sender
would bounce on every run and cost that domain sending reputation.

### Scripts

```bash
npm run dev                 # development server
npm run build && npm start  # production build and server
npm run lint                # ESLint
npm run verify:moderation   # TypeScript model vs scikit-learn parity
npm run test:e2e            # 42 end-to-end API checks against a running server
```

`npm run test:e2e` writes to the database in `.env` and removes the accounts it creates.
Never point it at a database with real users.

> On Windows, stop the server before `npm run build` — a running `next start` holds `.next`
> open and the build can land incomplete.

---

## 📁 Project layout

```
src/
├── app/
│   ├── page.tsx              Landing page (adapts to the signed-in user)
│   ├── (app)/dashboard/      Inbox: notes, accept toggle, delete
│   ├── (auth)/               Sign in, sign up, verify, forgot/reset password
│   ├── u/[username]/         Public page where notes are written
│   └── api/                  Route handlers
├── components/               UI, shared header, compose form, message card
├── lib/
│   ├── moderate.ts           The classifier: TF-IDF + logistic regression + blocklist
│   ├── moderation-model.ts   Generated weights — do not edit by hand
│   ├── rateLimit.ts          Fixed-window limiter backed by MongoDB
│   └── dbConnect.ts          Cached Mongoose connection
├── model/                    Mongoose schemas
└── schemas/                  Zod validation shared by forms and API routes
ml/                           Training, export and verification (see ml/README.md)
tests/e2e.sh                  End-to-end API suite
emails/                       React Email templates
```

---

## 👨‍💻 Project Team

- **Siddhesh Mengade**
- **Shraddha Patil**
- **Parth Tate**
- **Pranjali Chopade**

**Project Guide**: Prof. Snehal Jagtap

Department of Computer Engineering,
Genba Sopanrao Moze College of Engineering,
Balewadi, Pune 411045

> Developed as part of our final year engineering curriculum under the guidance of
> Prof. Snehal Jagtap.
