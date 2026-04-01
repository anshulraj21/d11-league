# D11 League -- Dream11 IPL Private League Money Manager

**Comprehensive Technical and Functional Documentation**

**Version:** 1.2
**Last Updated:** April 2026
**Live URL:** https://d11-league.vercel.app
**Repository:** https://github.com/anshulraj21/d11-league

---

# Part 1: Functional Documentation

## 1. Product Overview

### What It Does

D11 League is a companion web application for managing money in Dream11 private leagues during IPL season. It automates the tedious process of tracking entry fees, calculating prizes, and settling payments among a group of friends playing Dream11 fantasy cricket together.

### Target Users

Groups of 2--20+ friends who participate in Dream11 private leagues during IPL and need a transparent, automated way to manage the money side of their contests -- tracking who owes whom and how much after each match.

### Core Value Proposition

- **Eliminates manual accounting:** No more spreadsheets or WhatsApp calculations after each match.
- **OCR-powered result entry:** Upload a Dream11 leaderboard screenshot and the app reads it automatically.
- **One-tap UPI payments:** Settlement amounts are calculated and UPI deep links are generated for instant mobile payment.
- **Transparent audit trail:** Every result change is logged with who changed what and when.
- **Season-long standings:** Cumulative earnings leaderboard across all matches in a league.

### How It Works (High-Level)

1. Friends register with their Dream11 team names and UPI IDs.
2. One person creates a league and shares the invite code.
3. Before each IPL match, someone creates a match entry with the entry fee and prize rules.
4. Players join the match.
5. After the real Dream11 match concludes, someone uploads the Dream11 leaderboard screenshot (or enters results manually).
6. The app calculates prizes, determines who owes whom, and generates UPI payment links.
7. Players settle up via UPI and mark payments as complete.

---

## 2. User Flows

### 2.1 Registration

1. Navigate to `/register`.
2. Fill in required fields: **Your Name**, **Dream11 Team Name**, **Email**, **Password** (minimum 6 characters).
3. Optionally provide a **UPI ID** (e.g., `name@okaxis`).
4. Click **Create Account**.
5. Firebase Auth creates the account; a `users/{uid}` Firestore document is written with the profile data.
6. User is redirected to the Dashboard.

### 2.2 Login

1. Navigate to `/login`.
2. Enter **Email** and **Password**.
3. Click **Login**.
4. On success, redirect to Dashboard. On failure, display error (e.g., "Invalid email or password").

### 2.3 League Creation

1. From the Dashboard, click **Create League**.
2. Enter a **League Name** (e.g., "Bros IPL 2026").
3. Set **League Defaults** for auto-created matches: Entry Fee (default ₹30), Max Players (default 10), Number of Winners (default 3).
4. Click **Create League**.
5. A 6-character alphanumeric invite code is auto-generated (excludes ambiguous characters like `0`, `O`, `1`, `I`, `L`).
6. The creator is automatically added as the first member.
7. User is redirected to the League Detail page where they can copy the invite code to share.

### 2.3a Loading IPL 2026 Schedule

1. On the League Detail page, click **Load IPL Schedule**.
2. All 70 IPL 2026 league-stage matches are created at once using the league's default settings.
3. Matches that already exist (by name) are skipped — safe to click multiple times.
4. Matches are sorted chronologically and grouped by date, with today's matches highlighted.

### 2.4 Joining a League

1. From the Dashboard, click **Join League**, or navigate directly via a shared link `/league/join/{inviteCode}`.
2. Enter the **6-character invite code** (case-insensitive, auto-uppercased).
3. Click **Join League**.
4. The app queries Firestore for a league with that invite code.
5. If found, the user's profile is added to the league's `members` map and their UID is appended to `memberIds`.
6. If the user is already a member, they are simply redirected to the league.

### 2.5 Creating a Match

1. On the League Detail page, click **+ New Match**.
2. Fill in:
   - **Match Name** (e.g., "MI vs CSK")
   - **Date** (defaults to today)
   - **Entry Fee** in INR (e.g., 100)
   - **Max Players** (optional; minimum 2 if specified, blank for no limit)
3. Select **Number of Winners** using preset buttons (1, 2, 3, or 4) or add custom winner slots.
4. Adjust **Prize Distribution** percentages for each rank (must total exactly 100%).
5. Click **Create Match**.
6. The match is created with status `open`. The creator is automatically added as the first joined member.

### 2.6 Joining a Match

1. Navigate to the Match Detail page from the league's Matches tab.
2. If the match status is `open` and not full, click **Join Match**.
3. A Firestore transaction ensures atomicity: checks the max player limit hasn't been reached, then adds the user.
4. If the match is full, the join button is disabled with the message "Match Full (X/Y)".

### 2.7 Uploading Results (OCR + Manual)

**Timing:** Result entry buttons ("Upload Screenshot + OCR" and "Add Results Manually") only appear after the match has ended -- i.e., the effective status is `closed`, `completed`, or CricAPI reports the match as ended. While the match is still open, joined players see the message: "You've joined! Results can be added after the match ends."

**OCR Path:**
1. On the Match Detail page, click **Upload Screenshot + OCR**.
2. Click the upload area to select a Dream11 leaderboard screenshot (PNG/JPG, up to ~500KB recommended).
3. A preview of the image is displayed.
4. Click **Extract Results (OCR)**.
5. Tesseract.js processes the image client-side (may take 5--15 seconds).
6. The OCR parser extracts team names and points from the recognized text.
7. Fuzzy matching (Levenshtein distance) maps OCR team names to registered league members.
8. Results are displayed with confidence badges (exact / high / low).
9. Unmatched entries are shown separately.
10. Click **Confirm Results** to save, or **Edit Manually** to adjust.

**Manual Path:**
1. On the Match Detail page, click **Add Results Manually** (or **Edit Results** if results already exist).
2. A modal opens listing all joined players with input fields for points.
3. Enter the Dream11 points for each player.
4. Click **Save Results**.
5. Ranks are automatically assigned based on descending point order.

Both paths write an audit history entry and set the match status to `completed`.

### 2.8 Settlement and Payment

1. On the Match Detail page (status `completed` or `settled`), click **View Settlement**.
2. The Settlement page shows prize winners and amounts.
3. If settlements haven't been generated yet, click **Generate Settlements**.
4. The greedy debt minimization algorithm calculates the minimum number of payments needed.
5. Each settlement shows: payer, payee, amount, and action buttons.
6. **On mobile:** A "Pay via UPI" button opens the UPI payment app (GPay, PhonePe, etc.) with pre-filled details.
7. **On desktop:** A "Copy UPI ID" button copies the payee's UPI ID to the clipboard.
8. After payment, click **Mark Paid** to update the settlement status.

**Permission model:** Payment action buttons are scoped to relevant users only:
- **Pay via UPI / Copy UPI ID:** Only visible to the payer (`fromUserId === current user`).
- **Mark Paid:** Only visible to the receiver (`toUserId === current user`).
- Other league members can view settlement details but see no action buttons.

**Settlement vs. Settled status:** The match status only becomes `settled` when ALL settlements are marked as paid. Generating settlements alone does not change the match status.

### 2.9 Viewing Standings

1. On the League Detail page, click the **Standings** tab.
2. The standings table shows all league members ranked by cumulative earnings.
3. Columns: Rank, Player Name, Matches Played, Net Earnings (positive in green, negative in red).
4. Earnings are calculated as: (sum of prizes won) minus (sum of entry fees paid) across all completed/settled matches.

---

## 3. Feature List

| Feature | Description |
|---|---|
| **Email/Password Authentication** | Firebase Auth registration and login with Dream11 team name and UPI ID collection. |
| **Profile Management** | Edit display name, Dream11 team name, and UPI ID from the Profile page. |
| **League Creation** | Create a league with auto-generated 6-character invite code (ambiguous characters excluded). |
| **League Joining** | Join via invite code; supports direct URL links with pre-filled code. |
| **Match Creation** | Create per-match contests with configurable entry fee, max players, winner count, and prize percentages. |
| **Winner Presets** | Quick-select 1--4 winners with standard percentage splits (e.g., 60/25/15 for 3 winners). Custom splits supported. |
| **Match Joining** | Transactional join with max player enforcement using Firestore transactions. |
| **Screenshot OCR** | Client-side image recognition using Tesseract.js to extract Dream11 leaderboard data. |
| **Fuzzy Team Matching** | Levenshtein distance algorithm matches OCR-extracted team names to registered members with confidence scoring. |
| **Manual Result Entry** | Modal-based point entry for all joined players; supports adding and editing. |
| **Audit History** | Every result change logged with actor, timestamp, action type, and before/after diff. Collapsible UI. |
| **Settlement Calculation** | Greedy debt minimization algorithm computes minimum payments from pool, entry fees, and prize rules. |
| **UPI Deep Links** | Auto-generated `upi://pay` links with amount, payee, and note; opens payment apps on mobile. |
| **Clipboard Copy** | Desktop fallback for UPI: copy payee's UPI ID to clipboard. |
| **Payment Tracking** | Mark individual settlements as paid/pending with timestamp tracking. |
| **Season Standings** | Aggregate earnings leaderboard across all completed matches in a league. |
| **Real-time Updates** | All data uses Firestore `onSnapshot` listeners for live updates without page refresh. |
| **IPL Schedule Auto-Load** | One-click loads all 70 IPL 2026 league-stage matches with league defaults. Skips existing matches. |
| **League Defaults** | Configurable default entry fee (₹30), max players (10), and winners (3) set at league creation. |
| **Chronological Match View** | Matches sorted first→last by date, grouped by date with formatted headers, today's matches highlighted with amber accent + TODAY badge. |
| **Edit Match Settings** | Entry fee, max players, and number of winners editable on open matches via modal. |
| **Responsive Design** | Mobile-first UI built with Tailwind CSS, works on phones, tablets, and desktops. |
| **CricAPI Live Match Integration** | Real-time match status via CricAPI (cricketdata.org). Auto-checks today's matches on league page load. LIVE badge on match cards, live score banner (runs/wickets/overs) on match detail page. Polls every 3 min on league page, every 2 min on match detail. Auto-marks match as completed when API detects match ended. |
| **Auto-Close Past-Dated Matches** | Matches with a date before today and status `open` are automatically treated as `closed` via `getEffectiveStatus()`. Red closed badge displayed. |
| **Match Status Lifecycle** | Full lifecycle: open -> live (CricAPI) -> closed (past date) -> completed (results entered) -> settled (all payments confirmed). Match only becomes settled when ALL settlements are marked paid. |
| **Results Entry Timing** | Results entry (manual and OCR) only available after match ends. Open matches show informational message instead of result entry buttons. |
| **Settlement Permission Model** | Pay via UPI / Copy UPI ID only visible to the payer. Mark Paid only visible to the receiver. Other users see settlement info without action buttons. |
| **Dark Theme** | Dark-mode UI using custom Tailwind color tokens. |
| **Protected Routes** | All app pages require authentication; unauthenticated users are redirected to login. |

---

## 4. Screen-by-Screen Guide

### 4.1 Login Page (`/login`)

- **Purpose:** Authenticate existing users.
- **Fields:** Email (email input, required), Password (password input, required).
- **Actions:** Login button, link to Register page.
- **Error handling:** Displays "Invalid email or password" for bad credentials.

### 4.2 Register Page (`/register`)

- **Purpose:** Create a new user account.
- **Fields:**
  - Your Name (text, required)
  - Dream11 Team Name (text, required)
  - Email (email, required)
  - Password (password, required, min 6 chars)
  - UPI ID (text, optional, e.g., `name@okaxis`)
- **Actions:** Create Account button, link to Login page.
- **Validation:** Password minimum length check; Firebase Auth duplicate email detection.

### 4.3 Dashboard (`/dashboard`)

- **Purpose:** Home page showing all leagues the user belongs to.
- **Content:** List of league cards showing league name and member count.
- **Actions:** Create League button, Join League button. Click a league card to navigate to its detail page.
- **Empty state:** "No leagues yet" message with instructions.

### 4.4 Profile Page (`/profile`)

- **Purpose:** Edit user profile information.
- **Fields:** Your Name (text, required), Dream11 Team Name (text, required), UPI ID (text, optional).
- **Actions:** Save Changes button with success confirmation ("Saved!" for 2 seconds).

### 4.5 Create League Page (`/league/create`)

- **Purpose:** Create a new league with default match settings.
- **Fields:** League Name (text, required), Default Entry Fee (number, default ₹30), Default Max Players (number, default 10), Default Winners (number, default 3).
- **Info:** Defaults are used when auto-loading the IPL schedule. An invite code is auto-generated.
- **Actions:** Create League button. Redirects to league detail on success.

### 4.6 Join League Page (`/league/join/:inviteCode?`)

- **Purpose:** Join an existing league using an invite code.
- **Fields:** Invite Code (text, required, max 6 chars, displayed uppercase).
- **Pre-fill:** If an invite code is in the URL, the field is pre-populated.
- **Actions:** Join League button. Redirects to league detail on success.
- **Error handling:** "No league found with this invite code" for invalid codes.

### 4.7 League Detail Page (`/league/:leagueId`)

- **Purpose:** Central hub for a league with three tabs.
- **Header:** League name, invite code (click to copy), "Load IPL Schedule" button, "+ New Match" button.
- **League Defaults Bar:** Shows default entry fee, max players, and winners.
- **Tabs:**
  - **Matches:** Matches sorted chronologically (first→last), grouped by date with formatted headers (e.g., "Sat, 28 Mar"). Today's matches highlighted with amber border and TODAY badge. Each card shows match name, entry fee, joined count (X/Y format when max set), and status badge. **Live matches** show a LIVE badge (detected via CricAPI auto-check on page load, polling every 3 minutes). Past-dated open matches automatically display a red CLOSED badge.
  - **Members:** List of all members with display name, Dream11 team name, and UPI ID.
  - **Standings:** Season-wide earnings leaderboard with rank, player, matches played, and net earnings.

### 4.8 Create Match Page (`/league/:leagueId/match/create`)

- **Purpose:** Set up a new match contest.
- **Fields:**
  - Match Name (text, required, e.g., "MI vs CSK")
  - Date (date picker, defaults to today)
  - Entry Fee in INR (number, required, min 0)
  - Max Players (number, optional, min 2)
  - Number of Winners (1--4 preset buttons, plus custom add/remove)
  - Prize Distribution (percentage per rank, must total 100%)
- **Validation:** Total percentage must equal 100%; winner count must be less than max players; max players must be at least 2 if specified.

### 4.9 Match Detail Page (`/league/:leagueId/match/:matchId`)

- **Purpose:** View match details, join, enter results, and access settlement.
- **Content:**
  - Match info card: Entry Fee, Joined count (X/Y), Prize Pool. "Edit match settings" link on open matches.
  - Prize Distribution breakdown with amounts.
  - Joined Players list.
  - Results table (if completed): Rank, Player, Team Name, Points.
  - Screenshot display (if uploaded).
  - Change History (collapsible): Audit log of all result changes with diffs.
  - Edit Settings modal: Change entry fee, max players, and number of winners on open matches.
- **Live Score Banner:** When CricAPI detects the match is in progress, a live score banner displays runs, wickets, and overs. Polls every 2 minutes for updates.
- **Actions (based on state):**
  - `open` + not joined: **Join Match** button.
  - `open` + joined: Informational message ("Results can be added after the match ends."). Result entry buttons are hidden.
  - `closed`/`completed` + joined: **Upload Screenshot + OCR** and **Add Results Manually** buttons.
  - `completed`/`settled`: **View Settlement** button.
  - Results exist + not settled: **Edit Results** link.

### 4.10 Upload Results Page (`/league/:leagueId/match/:matchId/upload`)

- **Purpose:** Upload a Dream11 screenshot for OCR processing or enter results manually.
- **Content:**
  - Drag/click file upload area with image preview.
  - OCR processing spinner with status message.
  - OCR results review: matched entries with confidence badges, unmatched entries list.
  - Manual entry form: one row per joined player with points input.
- **Actions:** Extract Results (OCR), Enter Manually, Confirm Results, Edit Manually, Save Results.

### 4.11 Settlement Page (`/league/:leagueId/match/:matchId/settle`)

- **Purpose:** View and manage financial settlements for a match.
- **Content:**
  - Winners section: Rank, name, prize amount for each winner.
  - Payments list: Each settlement card shows payer, payee, amount, and status badge.
- **Actions per settlement (permission-scoped):**
  - Mobile: **Pay via UPI** (opens payment app) -- only visible to the payer.
  - Desktop: **Copy UPI ID** (copies to clipboard) -- only visible to the payer.
  - **Mark Paid** button -- only visible to the receiver.
  - Other users see settlement details (payer, payee, amount, status) but no action buttons.
- **Generate Settlements:** Button appears when match is completed but settlements haven't been created yet.
- **Settled status:** Match becomes `settled` only when all settlements are marked as paid.

---

# Part 2: Technical Documentation

## 1. Architecture

### Application Type

Single Page Application (SPA) with client-side routing. No server-side backend -- all logic runs in the browser, with Firebase providing authentication and database services.

### Folder Structure

```
C:\Users\anshu\FantasyLeague\
├── public/                          # Static assets
├── src/
│   ├── main.jsx                     # React entry point (renders <App />)
│   ├── App.jsx                      # Root component with BrowserRouter and all routes
│   ├── config/
│   │   └── firebase.js              # Firebase initialization (Auth + Firestore)
│   ├── contexts/
│   │   └── AuthContext.jsx           # Authentication state provider and user profile
│   ├── hooks/
│   │   ├── useLeagues.js            # Real-time listener for user's leagues
│   │   ├── useLeague.js             # Real-time listener for a single league
│   │   ├── useMatches.js            # Real-time listener for matches in a league
│   │   └── useSettlements.js        # Real-time listener for settlements in a match
│   ├── lib/
│   │   ├── ocr.js                   # Tesseract.js worker (singleton, lazy init)
│   │   ├── ocrParser.js             # OCR text parser + Levenshtein fuzzy matching
│   │   ├── settlement.js            # Prize calculation + greedy debt minimization
│   │   ├── upi.js                   # UPI deep link generator + mobile detection
│   │   ├── iplSchedule.js           # Full IPL 2026 schedule (70 matches) + getMissingMatches helper
│   │   ├── cricketApi.js            # CricAPI integration for live scores, match status, team name mapping
│   │   └── matchStatus.js           # getEffectiveStatus() + getStatusBadge() for match lifecycle
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx           # Top navigation bar with profile link and logout
│   │   │   └── ProtectedRoute.jsx   # Auth guard redirecting to /login
│   │   └── ui/
│   │       ├── Button.jsx           # Reusable button with variants and loading state
│   │       ├── Input.jsx            # Form input with label and error support
│   │       ├── Modal.jsx            # Overlay modal with backdrop and close button
│   │       ├── Badge.jsx            # Status badge with color variants
│   │       └── Spinner.jsx          # Loading spinner animation
│   └── pages/
│       ├── LoginPage.jsx            # Email/password login form
│       ├── RegisterPage.jsx         # Registration with Dream11 name and UPI ID
│       ├── DashboardPage.jsx        # League listing home page
│       ├── ProfilePage.jsx          # Edit user profile
│       ├── CreateLeaguePage.jsx     # League creation form
│       ├── JoinLeaguePage.jsx       # Join league by invite code
│       ├── LeagueDetailPage.jsx     # Tabbed league view (Matches/Members/Standings)
│       ├── CreateMatchPage.jsx      # Match creation with prize rules
│       ├── MatchDetailPage.jsx      # Match details, results, manual entry modal, history
│       ├── UploadResultsPage.jsx    # Screenshot upload, OCR, manual fallback
│       └── SettlementPage.jsx       # Settlement generation, UPI links, payment tracking
├── firestore.rules                  # Firestore security rules
├── vercel.json                      # Vercel SPA rewrite configuration
├── package.json                     # Dependencies and scripts
├── vite.config.js                   # Vite build configuration
└── CLAUDE.md                        # Project context file
```

### Data Flow Pattern

```
User Action --> React Component --> Firestore SDK (write)
                                         |
                                    Firestore DB
                                         |
               React Component <-- onSnapshot (real-time listener)
                    |
                UI Update
```

All data reads use `onSnapshot` for real-time updates. Writes use `addDoc`, `updateDoc`, `writeBatch`, or `runTransaction` depending on the operation.

---

## 2. Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.4 | UI framework |
| **React DOM** | 19.2.4 | DOM rendering |
| **React Router DOM** | 7.13.2 | Client-side routing (SPA) |
| **Firebase** | 12.11.0 | Authentication + Firestore database |
| **Tesseract.js** | 7.0.0 | Client-side OCR (image-to-text) |
| **CricAPI** | (external API) | Live cricket scores and match status from cricketdata.org (100 free calls/day) |
| **Vite** | 8.0.1 | Build tool and dev server |
| **Tailwind CSS** | 4.2.2 | Utility-first CSS framework |
| **@tailwindcss/vite** | 4.2.2 | Tailwind Vite plugin integration |
| **@vitejs/plugin-react** | 6.0.1 | React Fast Refresh for Vite |
| **ESLint** | 9.39.4 | Code linting |
| **Vercel** | (hosting) | Deployment platform with auto-deploys |

---

## 3. Database Schema

The application uses Firebase Cloud Firestore (NoSQL document database) hosted in the `asia-south1` (Mumbai) region under the project ID `d11-league`.

### Collection: `users`

**Path:** `users/{uid}`

| Field | Type | Description |
|---|---|---|
| `displayName` | string | User's display name |
| `email` | string | User's email address |
| `dream11TeamName` | string | User's team name on Dream11 (used for OCR matching) |
| `upiId` | string | UPI payment ID (e.g., `name@okaxis`); may be empty |
| `createdAt` | timestamp | Account creation time |

### Collection: `leagues`

**Path:** `leagues/{leagueId}`

| Field | Type | Description |
|---|---|---|
| `name` | string | League display name |
| `inviteCode` | string | 6-character alphanumeric invite code (uppercase, excludes 0/O/1/I/L) |
| `createdBy` | string | UID of the league creator |
| `memberIds` | array\<string\> | Array of member UIDs (used for Firestore `array-contains` queries and security rules) |
| `members` | map | Map of `{uid: {displayName, dream11TeamName, upiId}}` for quick access |
| `defaults` | map `{entryFee, maxPlayers, winners}` | Default match settings for IPL schedule auto-load (entryFee: 30, maxPlayers: 10, winners: 3) |
| `createdAt` | timestamp | League creation time |

**Design note:** `memberIds` is an array (queryable) and `members` is a map (fast lookups). Both are maintained in parallel.

### Subcollection: `matches`

**Path:** `leagues/{leagueId}/matches/{matchId}`

| Field | Type | Description |
|---|---|---|
| `matchName` | string | Match display name (e.g., "MI vs CSK") |
| `date` | string | Match date in `YYYY-MM-DD` format |
| `entryFee` | number | Entry fee per player in INR |
| `maxPlayers` | number \| null | Maximum number of players allowed; `null` for no limit |
| `prizeRules` | array\<{rank: number, percentage: number}\> | Prize distribution rules; percentages must sum to 100 |
| `joinedMembers` | array\<string\> | UIDs of players who have joined this match |
| `results` | array\<{userId, displayName, dream11TeamName, points, rank}\> | Final results sorted by rank |
| `screenshotUrl` | string | Base64-encoded screenshot image (data URL); empty string if none |
| `ocrRawText` | string | Raw text extracted by Tesseract.js OCR; empty string if manual entry |
| `status` | string | One of: `open`, `live`, `closed`, `completed`, `settled` |
| `addedBy` | string | UID of the user who created the match |
| `createdAt` | timestamp | Match creation time |

**Status lifecycle:** `open` (accepting joins) --> `live` (CricAPI detects match in progress) --> `closed` (match date has passed, via `getEffectiveStatus()`) --> `completed` (results entered) --> `settled` (all settlements marked as paid). Note: `closed` is a virtual status computed client-side by `matchStatus.js` when the stored status is `open` but the match date is in the past.

### Subcollection: `settlements`

**Path:** `leagues/{leagueId}/matches/{matchId}/settlements/{settlementId}`

| Field | Type | Description |
|---|---|---|
| `fromUserId` | string | UID of the payer |
| `fromName` | string | Display name of the payer |
| `toUserId` | string | UID of the payee |
| `toName` | string | Display name of the payee |
| `amount` | number | Payment amount in INR |
| `upiLink` | string | Full `upi://pay?...` deep link; empty if payee has no UPI ID |
| `status` | string | One of: `pending`, `paid` |
| `createdAt` | timestamp | Settlement creation time |
| `paidAt` | timestamp \| null | When the payment was marked as paid; `null` if pending |

### Subcollection: `history`

**Path:** `leagues/{leagueId}/matches/{matchId}/history/{historyId}`

| Field | Type | Description |
|---|---|---|
| `changedBy` | map `{userId, displayName}` | Who made the change |
| `timestamp` | timestamp | When the change was made |
| `action` | string | One of: `results_added`, `results_updated` |
| `previousResults` | array | Snapshot of the results array before the change |
| `newResults` | array | Snapshot of the results array after the change |

### Entity Relationship Diagram

```
users/{uid}
  |
  +-- Referenced by leagues.memberIds[] and leagues.members map
  |
leagues/{leagueId}
  |
  +-- matches/{matchId}               (subcollection)
        |
        +-- settlements/{settlementId} (subcollection)
        |
        +-- history/{historyId}        (subcollection)
```

---

## 4. Authentication

### Provider

Firebase Authentication with **Email/Password** sign-in method only. No social providers (Google, Facebook, etc.) are configured.

### Auth Flow

1. **Registration:** `createUserWithEmailAndPassword(auth, email, password)` creates the Firebase Auth account. A Firestore document is then written to `users/{uid}` with the profile data.
2. **Login:** `signInWithEmailAndPassword(auth, email, password)` authenticates and returns credentials.
3. **Session persistence:** Firebase Auth SDK handles session tokens in browser IndexedDB. Sessions persist across page reloads and browser restarts.
4. **Auth state observation:** `onAuthStateChanged` listener in `AuthContext` fires whenever the auth state changes. It also fetches the user's Firestore profile document.

### Route Protection

The `ProtectedRoute` component wraps all authenticated routes. It:
- Shows a full-screen spinner while auth state is loading.
- Redirects to `/login` if no user is authenticated.
- Renders children if authenticated.

The catch-all route `/*` redirects to `/dashboard`, which itself is protected.

### Authorized Domains

The following domains are authorized in Firebase Auth settings:
- `localhost`
- `d11-league.firebaseapp.com`
- `d11-league.web.app`
- `d11-league.vercel.app`

### Error Handling

- `auth/email-already-in-use` on registration: displays "Email already registered".
- `auth/invalid-credential` on login: displays "Invalid email or password".
- Firestore `getDoc` failures during profile fetch (e.g., offline mode) are silently caught to allow auth to complete even when Firestore is unreachable.

---

## 5. Key Algorithms

### 5.1 OCR Pipeline

**File:** `src/lib/ocr.js` and `src/lib/ocrParser.js`

The OCR pipeline processes Dream11 leaderboard screenshots entirely client-side:

**Step 1 -- Image Recognition (Tesseract.js)**

```
Image File --> Tesseract.js Worker --> Raw Text
```

- A singleton Tesseract.js worker is created lazily on first use.
- The worker is initialized with the `eng` (English) language model.
- `worker.recognize(imageSource)` returns raw OCR text.
- The worker persists across multiple recognitions to avoid reloading the language model.

**Step 2 -- Text Parsing**

The parser (`parseLeaderboardText`) splits raw OCR text into lines and attempts to match each line against three regex patterns that cover common Dream11 leaderboard formats:

- **Pattern 1:** `TeamName T2 1089.5 #1` -- team name with T-suffix variant, points, rank.
- **Pattern 2:** `TeamName 1089.5 #1` -- team name without T-suffix, points, rank.
- **Pattern 3:** `#1 TeamName 1089.5` -- rank-first format.

Commas within numbers are stripped before matching. Parsed results are sorted by points descending and assigned sequential ranks.

**Step 3 -- Fuzzy Matching**

The `matchTeamsToMembers` function maps OCR-extracted team names to registered league members using a three-tier matching strategy:

1. **Exact match:** Case-insensitive string equality.
2. **Containment match:** One name is a substring of the other (handles Dream11's truncation of long names, e.g., "Lastcom...").
3. **Levenshtein distance:** Edit distance between the OCR name and the registered name. Also compares against the name with T-suffix stripped.

**Acceptance threshold:** A match is accepted if the Levenshtein distance is less than or equal to `max(3, floor(nameLength * 0.4))` -- i.e., up to 40% of the name can differ.

**Confidence levels:**
- `exact`: distance = 0
- `high`: distance <= 2
- `low`: distance > 2 but within threshold

Each member can only be matched once (greedy, first-come assignment based on OCR result order).

### 5.2 Settlement Algorithm (Greedy Debt Minimization)

**File:** `src/lib/settlement.js`

The settlement algorithm minimizes the number of payment transactions needed after a match.

**Pipeline:**

```
Results + Entry Fee + Prize Rules
           |
           v
   Calculate Prize Pool (entryFee * playerCount)
           |
           v
   Calculate Prize Amounts (pool * percentage / 100, rounded)
           |
           v
   Calculate Net Balances (prizeWon - entryFee per player)
           |
           v
   Greedy Matching (sort creditors and debtors, match largest pairs)
           |
           v
   Settlement Transactions [{from, to, amount}]
```

**Greedy algorithm detail:**

1. Separate players into **creditors** (positive balance, owed money) and **debtors** (negative balance, owe money).
2. Sort both lists by absolute balance, descending (largest first).
3. Iterate with two pointers:
   - Take the minimum of the current creditor's remaining balance and the current debtor's remaining debt.
   - Create a settlement transaction for that amount.
   - Subtract the amount from both.
   - Advance the pointer for whichever reaches zero.
4. Continue until all debts are resolved.

This produces O(n) transactions in the worst case where n is the number of players, but in practice produces significantly fewer transactions than the naive all-to-all approach.

**Example:** With 5 players, entry fee 100, and a 60/25/15 prize split:
- Pool: 500
- 1st place wins 300 (net +200), 2nd wins 125 (net +25), 3rd wins 75 (net -25)
- 4th and 5th win 0 (net -100 each)
- Settlements: 4th pays 1st 100; 5th pays 1st 100; 3rd pays 2nd 25

### 5.3 Prize Calculation

**Winner presets** provide standard splits:

| Winners | Split |
|---|---|
| 1 winner | 100% |
| 2 winners | 70% / 30% |
| 3 winners | 60% / 25% / 15% |
| 4 winners | 50% / 25% / 15% / 10% |

For 5+ winners, the `generateEvenSplit` function distributes evenly with the remainder going to 1st place (e.g., 5 winners: 24% / 19% / 19% / 19% / 19%).

Custom percentages can be set per rank. The total must equal exactly 100%.

Prize amounts are calculated as: `Math.round(pool * percentage / 100)`.

### 5.4 Standings Calculation

**File:** `src/pages/LeagueDetailPage.jsx` (`computeStandings` function)

The standings algorithm aggregates earnings across all completed and settled matches:

1. Initialize all league members with 0 earnings and 0 matches played.
2. For each match with status `completed` or `settled` that has results:
   - Calculate the prize pool and prize amounts from the match's entry fee and prize rules.
   - For each result: earnings += (prize won or 0) minus entry fee. Increment matches played.
3. Sort all members by earnings descending.

---

## 6. API and Libraries

### Firebase SDK (`firebase` v12.11.0)

**Modules used:**
- `firebase/app` -- `initializeApp`
- `firebase/auth` -- `getAuth`, `onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`
- `firebase/firestore` -- `getFirestore`, `doc`, `getDoc`, `setDoc`, `updateDoc`, `addDoc`, `collection`, `query`, `where`, `orderBy`, `onSnapshot`, `arrayUnion`, `writeBatch`, `runTransaction`, `getDocs`

**Firebase modules NOT used:** Storage, Cloud Functions, Hosting, Analytics, Messaging, Remote Config.

### Tesseract.js (`tesseract.js` v7.0.0)

- Client-side OCR library running a WebAssembly-compiled Tesseract engine.
- Language model: `eng` (English).
- Worker pattern: singleton created on first OCR request, reused for subsequent requests.
- API used: `createWorker('eng')`, `worker.recognize(imageSource)`, `worker.terminate()`.

### React Router (`react-router-dom` v7.13.2)

- Components: `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`.
- Hooks: `useNavigate`, `useParams`.
- Route parameter support: `:leagueId`, `:matchId`, `:inviteCode?` (optional).
- SPA fallback handled by Vercel rewrites.

### Tailwind CSS (v4.2.2)

- Integrated via `@tailwindcss/vite` plugin.
- Custom color tokens used throughout (e.g., `text-primary-light`, `bg-surface-light`, `text-text-muted`, `text-accent`, `text-success`, `text-danger`).
- Dark theme by default.

---

## 7. Environment Setup

### Prerequisites

- Node.js (v18+)
- npm
- A Firebase project with Firestore and Authentication enabled
- A Vercel account (for deployment)

### Firebase Project Setup

1. Go to https://console.firebase.google.com and create a new project (or use `d11-league`).
2. Enable **Authentication** with the **Email/Password** sign-in provider.
3. Create a **Firestore Database** in the `asia-south1` (Mumbai) region.
4. In Authentication > Settings > Authorized Domains, add your Vercel domain.
5. Go to Project Settings > General > Your Apps > Web App and copy the Firebase config values.

### Environment Variables

Create a `.env` file in the project root (or set these in your Vercel project settings):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_CRICKET_API_KEY=your-cricapi-key
```

**Important:** The `VITE_` prefix is required by Vite to expose these variables to the client bundle. This is safe because Firebase client config is not secret -- security is enforced by Firestore rules. The `VITE_CRICKET_API_KEY` is a CricAPI key from cricketdata.org (free tier: 100 API calls/day). Live score features are disabled gracefully if this key is not set.

**Vercel caveat:** When setting env vars in Vercel, ensure there are no trailing newlines (use `printf` not heredoc syntax in shell).

### Local Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on http://localhost:5173
```

### Production Build

```bash
npm run build        # Creates optimized build in dist/
npm run preview      # Preview production build locally
```

### Deploy to Vercel

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Set the environment variables in Vercel project settings.
4. Vercel auto-detects the Vite framework and deploys.
5. `vercel.json` provides the SPA rewrite rule:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes are handled by the React SPA instead of returning 404s.

### Deploy Firestore Rules

Deploy the security rules from the `firestore.rules` file:

```bash
npx firebase-tools deploy --only firestore:rules
```

Or copy/paste them into the Firebase Console > Firestore > Rules tab.

---

## 8. Security

### Firestore Security Rules

The app uses role-based security rules defined in `firestore.rules`:

**Users collection:**
- Any authenticated user can **read** any user profile (needed for displaying member names).
- A user can only **write** their own profile document (`request.auth.uid == userId`).

**Leagues collection:**
- Only **members** of a league (UIDs in `memberIds` array) can **read** or **update** the league.
- Any authenticated user can **create** a league (they become the first member).

**Matches subcollection:**
- Only league members can **read** or **write** matches. Membership is verified by reading the parent league document's `memberIds` field.

**Settlements subcollection:**
- Only league members can **read** or **write** settlements (same parent league membership check).

**History subcollection:**
- Falls under the matches wildcard rule; league members have read/write access.

### Client-Side Security Notes

- Firebase client config (API key, project ID, etc.) is embedded in the client bundle. This is by design -- these are not secrets. All access control is enforced server-side by Firestore rules.
- There is no admin role or elevated privilege system. Any league member can create matches, upload results, generate settlements, and mark payments.
- Firestore transactions are used for match joining to prevent race conditions when multiple users join simultaneously near the max player limit.

### Test Mode Warning

Firestore test mode rules (if initially used) expire after 30 days. The production `firestore.rules` file must be deployed before this expiration to avoid losing all access.

---

## 9. Known Limitations

### Firebase Free Tier (Spark Plan)

- **No Firebase Storage:** The Spark plan does not support Firebase Storage. Screenshots are stored as base64-encoded data URLs directly in Firestore match documents.
- **Document size limit:** Firestore documents have a 1 MB maximum size. Base64 encoding increases image size by ~33%, so screenshots should be kept under approximately 500 KB.
- **Firestore read/write limits:** Spark plan allows 50,000 reads and 20,000 writes per day. Heavy usage with many leagues could approach these limits.
- **No Cloud Functions:** All logic runs client-side. There is no server-side validation beyond Firestore rules.

### OCR Accuracy

- Tesseract.js accuracy depends heavily on screenshot quality, resolution, and the Dream11 leaderboard layout.
- Low-resolution screenshots, unusual fonts, or overlapping elements can cause OCR failures.
- The fuzzy matching threshold (40% of name length) may produce false positives for very short team names.
- OCR processing takes 5--15 seconds on typical mobile devices.

### Data Integrity

- No server-side validation of prize percentages summing to 100% (only validated in the client UI).
- Any league member can edit results before settlement -- there is no "lock" or approval workflow.
- Settlement amounts are rounded to whole rupees (`Math.round`), which can cause minor rounding discrepancies in edge cases.

### Payment Tracking

- "Mark Paid" is an honor system -- there is no actual payment verification or integration with UPI payment status APIs.
- UPI deep links (`upi://pay?...`) only work on mobile devices with a UPI app installed. On desktop, only the Copy UPI ID fallback is available.

### General

- No password reset flow is implemented in the UI (Firebase Auth supports it but no page exists).
- No email verification flow.
- No ability to leave a league or remove members.
- No ability to delete matches, leagues, or accounts.
- No offline support or service worker.
- League invite codes are not checked for uniqueness (collision probability is negligible with the 31^6 address space).
- The standings page does not account for matches where a player joined but results were not entered for them (they are simply not counted).
- Screenshots are stored inline in Firestore documents, which is inefficient for bandwidth and storage but avoids the paid Firebase Storage requirement.
