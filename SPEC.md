# Cervantes — Hacker News Desktop Client

> A fast, native Hacker News reader and writer for the desktop, built with Tauri.

---

## Overview

Cervantes is a desktop application for reading and participating in Hacker News. It wraps the official Firebase-based HN API for reading and the HN web interface (via scraping/form submission) for authenticated write actions (comments, upvotes, submissions). The app targets Ubuntu (Linux) as the primary platform but leverages Tauri's cross-platform capabilities so Windows and macOS builds should work without major modification.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Shell / native | Tauri 2.x (Rust backend) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State management | Zustand |
| Data fetching | TanStack Query (React Query) |
| HN Read API | `https://hacker-news.firebaseio.com/v0/` |
| HN Write API | HN web scraping via Tauri HTTP plugin (`https://news.ycombinator.com`) |
| Local persistence | `tauri-plugin-store` (JSON store, no SQLite unless needed) |
| Auth credential storage | OS keychain via `tauri-plugin-stronghold` or `keyring` crate |

---

## Features

### MVP (Phase 1)

#### Feed Views
- **Top Stories** — `/v0/topstories` (up to 500 items, paginate 30 at a time)
- **New Stories** — `/v0/newstories`
- **Best Stories** — `/v0/beststories`
- **Ask HN** — `/v0/askstories`
- **Show HN** — `/v0/showstories`
- **Jobs** — `/v0/jobstories`

Each feed item displays:
- Rank, title, domain, score, author, age, comment count
- Clicking title → opens URL in system browser (or optional in-app webview)
- Clicking comment count → opens thread view

#### Thread View
- Recursive comment tree rendered natively
- Collapse/expand individual comment threads
- HTML in comment bodies rendered safely (strip dangerous tags, keep `<i>`, `<b>`, `<a>`, `<code>`, `<pre>`, `<p>`)
- "Load more" for deep threads (lazy load kids on demand)
- Display: author, age, score (where available), reply button (auth required)

#### User Profiles
- View any user: karma, account age, about text, recent submissions

#### Settings
- Theme: Light / Dark / System
- Default feed on launch
- Items per page (15 / 30 / 50)
- Open links in: System browser / In-app webview
- Font size

---

### Phase 2 — Authenticated Features

#### Login
- Username + password stored securely in OS keychain (never in plaintext on disk)
- Session cookie managed by Tauri HTTP plugin, persisted across restarts
- Login state shown in sidebar (username + karma)
- Logout clears session and keychain entry

#### Voting
- Upvote stories and comments (one-click, from feed or thread)
- Unvote supported where HN allows it
- Optimistic UI update, revert on failure

#### Commenting
- Reply to any comment or story from within the thread view
- Compose area with plain-text input (HN doesn't support Markdown, but supports some HTML)
- Character limit indicator (HN soft limit ~2000 chars before it starts complaining)
- Submit via Tauri HTTP POST to `https://news.ycombinator.com/comment`

#### Submitting Stories
- Submit URL or Ask HN / Show HN text post
- Form: title, URL (optional), text body (optional)
- POST to `https://news.ycombinator.com/submit`

---

### Phase 3 — Quality of Life

- **Search** — delegate to `https://hn.algolia.com/api/v1/` (Algolia HN Search API, free, no auth required)
- **Read Later / Bookmarks** — local store only
- **Keyboard navigation** — `j/k` to navigate items, `o` to open, `c` to open comments, `r` to reply
- **Notifications** — poll for replies to your comments (check `user.submitted` items for new kids)
- **Auto-refresh** — configurable polling interval for feeds (off by default)

---

## API Reference

### Read (Firebase REST — no auth)

```
Base: https://hacker-news.firebaseio.com/v0/

GET /topstories.json        → [id, id, ...]  (up to 500)
GET /newstories.json        → [id, id, ...]
GET /beststories.json       → [id, id, ...]
GET /askstories.json        → [id, id, ...]  (up to 200)
GET /showstories.json       → [id, id, ...]
GET /jobstories.json        → [id, id, ...]
GET /item/{id}.json         → Item object
GET /user/{username}.json   → User object
GET /maxitem.json           → int
GET /updates.json           → { items: [...], profiles: [...] }
```

### Item Object

```typescript
interface HNItem {
  id: number
  type: 'job' | 'story' | 'comment' | 'poll' | 'pollopt'
  by?: string
  time?: number          // Unix timestamp
  text?: string          // HTML
  dead?: boolean
  deleted?: boolean
  parent?: number
  poll?: number
  kids?: number[]        // ranked comment IDs
  url?: string
  score?: number
  title?: string         // HTML
  parts?: number[]       // poll options
  descendants?: number   // total comment count
}
```

### Write (HN Web — requires session cookie)

HN doesn't have a public write API. All write actions go through form POSTs to `news.ycombinator.com`. The session is established by POSTing credentials to `/login` and persisting the `user` cookie.

```
POST /login               body: acct={username}&pw={password}&goto=news
POST /vote                body: id={item_id}&how=up&auth={auth_token}&goto={returnpath}
POST /comment             body: parent={parent_id}&goto={goto}&text={comment_text}&hmac={hmac}
POST /submit              body: title={title}&url={url}&text={text}&fnid={fnid}
```

> **Note:** HN uses CSRF-like tokens (`fnid`, `hmac`, `auth`) that must be scraped from the page HTML before each write action. The Rust backend must fetch the relevant page, extract the token, then perform the POST.

---

## Architecture

```
src/
├── main.tsx                  # React entry
├── App.tsx                   # Router + layout
├── components/
│   ├── Feed/
│   │   ├── FeedView.tsx      # List of story items
│   │   └── StoryItem.tsx     # Single row in feed
│   ├── Thread/
│   │   ├── ThreadView.tsx    # Full comment tree
│   │   └── Comment.tsx       # Recursive comment component
│   ├── Compose/
│   │   └── ReplyBox.tsx      # Comment compose
│   ├── Auth/
│   │   └── LoginModal.tsx
│   └── Layout/
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── stores/
│   ├── authStore.ts          # Zustand: session, username, karma
│   └── settingsStore.ts      # Zustand: theme, prefs
├── hooks/
│   ├── useStories.ts         # TanStack Query wrappers
│   ├── useItem.ts
│   └── useUser.ts
└── lib/
    ├── hnApi.ts              # Firebase API client
    └── hnWeb.ts              # Write actions (via Tauri invoke)

src-tauri/
├── src/
│   ├── main.rs
│   ├── hn_web.rs             # Rust: login, vote, comment, submit
│   └── keychain.rs           # Credential storage
├── Cargo.toml
└── tauri.conf.json
```

---

## Non-Goals (explicitly out of scope)

- No real-time push updates (Firebase websocket SDK) — polling is fine for v1
- No offline mode / full local cache
- No flagging or marking items as dead
- No mod tools

---

## Constraints & Notes

- HN rate limits are not documented but be respectful: don't hammer the API. Cache feed ID lists for at least 60 seconds.
- HN web scraping is fragile. If login/vote/comment breaks, it's likely an HN HTML change. Keep the Rust scraping code isolated and easy to update.
- The app should work without an account — auth is optional and additive.
- Tauri's `allowlist` / CSP must permit requests to `hacker-news.firebaseio.com` and `news.ycombinator.com` only.
