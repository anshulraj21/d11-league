# D11 League — Dream11 IPL Private League Money Manager

## Project Overview
A companion web app for Dream11 private leagues (IPL 2026, 10+ friends). Users register with their Dream11 team name. After each match, someone uploads a screenshot or enters results manually. The system calculates prizes and generates UPI settlement links.

**Live URL:** https://d11-league.vercel.app
**GitHub:** https://github.com/anshulraj21/d11-league
**Firebase Project:** d11-league (Spark/free plan, Firestore in asia-south1 Mumbai)

## Tech Stack
- **Frontend:** React 19 (Vite 8) + Tailwind CSS v4 + React Router v7
- **Backend:** Firebase Auth (email/password) + Firestore (NoSQL)
- **OCR:** Tesseract.js (free, client-side, in-browser)
- **Live Cricket Data:** CricAPI (cricketdata.org) — 100 free calls/day, auto-detects live/ended matches
- **Payments:** UPI deep links (`upi://pay?...`) — opens GPay/PhonePe on mobile, copy UPI ID on desktop
- **Hosting:** Vercel (free tier, auto-deploys from GitHub)
- **Storage:** Screenshots stored as base64 in Firestore docs (Firebase Storage requires paid Blaze plan)

## Architecture
```
src/
├── config/firebase.js          — Firebase init (Auth + Firestore only, no Storage)
├── contexts/AuthContext.jsx     — Auth state + user profile, error-tolerant getDoc
├── hooks/                       — useAuth, useLeagues, useLeague, useMatches, useSettlements
├── lib/
│   ├── ocr.js                  — Tesseract.js worker (singleton, lazy init)
│   ├── ocrParser.js            — Parse Dream11 leaderboard text, fuzzy match team names (Levenshtein)
│   ├── settlement.js           — Prize calc + greedy debt minimization algorithm
│   ├── upi.js                  — UPI link generator + mobile/desktop detection
│   ├── iplSchedule.js          — Full IPL 2026 schedule (70 matches) + helper functions
│   ├── matchStatus.js          — Effective status logic (auto-close past matches) + badge helpers
│   └── cricketApi.js           — CricAPI integration (live scores, match status, team mapping)
├── components/
│   ├── layout/                 — Navbar, ProtectedRoute
│   └── ui/                     — Button, Input, Modal, Badge, Spinner
└── pages/                      — All route pages
```

## Key Firestore Schema
- `users/{uid}` — displayName, email, dream11TeamName, upiId
- `leagues/{id}` — name, memberIds[], members map, inviteCode, createdBy, defaults: {entryFee, maxPlayers, winners}
- `leagues/{id}/matches/{id}` — matchName, date, entryFee, maxPlayers, prizeRules[], joinedMembers[], results[], status, screenshotUrl
- `leagues/{id}/matches/{id}/settlements/{id}` — from/to user, amount, upiLink, status (pending/paid)
- `leagues/{id}/matches/{id}/history/{id}` — changedBy, timestamp, action, previousResults, newResults

## Key Features
1. **Auth:** Email/password registration with Dream11 team name + UPI ID
2. **Leagues:** Create with auto-generated 6-char invite code, join via code. League-level defaults (entry fee ₹30, max players 10, winners 3).
3. **IPL Schedule Auto-Load:** One-click loads all 70 IPL 2026 matches with league defaults. Skips already-existing matches (safe to re-click).
4. **Matches:** Per-match entry fees, configurable max players (min 2), selectable number of winners (1-4+ with smart presets). Editable settings on open matches.
5. **Match List:** Sorted chronologically (first→last), grouped by date with formatted headers, today's matches highlighted with amber accent + TODAY badge.
6. **Match Status Lifecycle:** open → live (CricAPI) → closed (past date) → completed (results entered) → settled (all payments confirmed). Past-dated open matches auto-show as "closed".
7. **Live Match Integration:** CricAPI auto-checks today's matches on league page load, shows LIVE badge, live scores, auto-marks completed when match ends. Polls every 3 min.
8. **Results:** Screenshot upload + Tesseract.js OCR with fuzzy matching, OR direct manual entry via modal. Results entry only available after match ends. Edit results anytime before settlement.
9. **Audit History:** Every result change logged with who/when/what. Collapsible diff view showing old → new points.
10. **Settlement:** Greedy algorithm minimizes payment count. UPI deep links for one-tap payment on mobile. Pay button only for payer, Mark Paid only for receiver. Match becomes "settled" only when ALL payments confirmed.
11. **Standings:** Season-wide earnings leaderboard aggregated across all completed matches.

## Environment Variables (Vercel + .env)
```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
VITE_CRICKET_API_KEY
```
Note: VITE_ prefix makes these public — that's fine for Firebase client config. Security is enforced by Firestore rules.

## Firebase Auth Domains
Authorized: localhost, d11-league.firebaseapp.com, d11-league.web.app, d11-league.vercel.app

## Known Issues / Workarounds
- Firebase Storage requires Blaze (paid) plan — screenshots stored as base64 in Firestore instead (max ~500KB per screenshot, within 1MB doc limit)
- Vercel env vars must be set WITHOUT trailing newlines (use `printf` not `<<<` in bash)
- `vercel.json` has SPA rewrite rule: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- Firestore test mode rules expire after 30 days — deploy proper rules from `firestore.rules` before then
- Link+Button pattern doesn't propagate clicks — use `onClick + useNavigate` instead of `<Link><Button>`

## Development
```bash
npm run dev        # Start dev server (Vite, port 5173)
npm run build      # Production build
vercel --prod      # Deploy to Vercel
```

## Session History (March-April 2026)
- **Session 1:** Discussed requirements (Dream11 companion vs standalone), decided on companion app with Firebase + React. Built entire app from scratch: auth, leagues, matches, OCR, settlement, UPI links. Set up Firebase project (d11-league), deployed to Vercel.
- **Session 2:** Fixed Vercel env var newline bug causing Firestore 503 errors. Ran full E2E test with 2 users (Sachin + Rohit) on live site — registration, league creation, invite join, match creation, manual result entry, settlement generation, UPI payment, mark paid. Added 4 enhancements: max players field, winner count selector with presets, manual result entry modal, audit history with diffs. Added IPL 2026 schedule auto-loader (70 matches) with league-level defaults. Added match list chronological sort with date grouping and today highlight. Added edit match settings modal (entry fee, max players, winners) on open matches. Generated comprehensive technical + functional documentation (docs/DOCUMENTATION.md).
- **Session 3:** Added CricAPI live match integration (auto-check on league page load, LIVE badge, auto-complete on match end, 3-min polling). Added auto-close for past-dated matches. Results entry restricted to after match ends. Settlement UPI pay button only for payer, Mark Paid only for receiver. Fixed settlement status bug (now only 'settled' when all payments confirmed). Fixed liveMatchIds prop crash on league page.
