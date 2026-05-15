# CLAUDE.md — Working Instructions for Cervantes

This file tells you (Claude Code) how to work on this project. Read it before touching anything.

---

## What This Is

A Tauri 2 desktop app for Hacker News. React + TypeScript frontend, Rust backend. Primary target: Ubuntu (Linux). See `SPEC.md` for full product requirements.

---

## Project Bootstrap (if starting from scratch)

```bash
# Prerequisites: Rust toolchain, Node 20+, Tauri CLI v2
cargo install tauri-cli --version "^2"

# Scaffold
npm create tauri-app@latest cervantes -- --template react-ts
cd cervantes
npm install

# Extra frontend deps
npm install zustand @tanstack/react-query tailwindcss @tailwindcss/typography
npx tailwindcss init -p

# Tauri plugins
npm install @tauri-apps/plugin-store @tauri-apps/plugin-http @tauri-apps/plugin-shell
cargo add tauri-plugin-store tauri-plugin-http tauri-plugin-shell
```

---

## Commands

```bash
# Dev
npm run tauri dev

# Build (release)
npm run tauri build

# Frontend only (no Tauri shell, for UI iteration)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npx eslint src/

# Tests (if added)
npm test
```

---

## Project Structure

```
cervantes/
├── SPEC.md
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── index.html
├── src/                        # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Feed/
│   │   ├── Thread/
│   │   ├── Compose/
│   │   ├── Auth/
│   │   └── Layout/
│   ├── stores/
│   ├── hooks/
│   └── lib/
└── src-tauri/                  # Rust backend
    ├── src/
    │   ├── main.rs
    │   ├── lib.rs
    │   ├── hn_web.rs
    │   └── keychain.rs
    ├── Cargo.toml
    └── tauri.conf.json
```

---

## Key Decisions & Conventions

### Frontend

- **React Query for all HN API fetches.** Use `useQuery` with appropriate `staleTime`. Feed ID lists: 60s stale. Individual items: 5 minutes. User profiles: 10 minutes.
- **Zustand for auth and settings state only.** Don't put fetched data in Zustand — that's React Query's job.
- **No CSS-in-JS.** Tailwind only. Utility classes inline.
- **Component files are named `PascalCase.tsx`.** One component per file.
- **No `any` in TypeScript.** Use proper types. The HN item type is defined in `src/lib/hnApi.ts`.
- **HTML in HN content** must be sanitised before render. Use `DOMPurify`. Allow tags: `a, b, i, em, strong, code, pre, p`. Strip everything else.
- **Recursive comment trees**: the `Comment` component renders itself recursively. Collapse state is local (`useState`), not global.

### Backend (Rust)

- **All HN write actions go through Tauri commands** (`#[tauri::command]`). The frontend never makes direct HTTP requests to `news.ycombinator.com` — that all happens in Rust.
- **Session cookie persistence**: store the `user` cookie value in the OS keychain using `keyring` crate. Load it on startup, clear it on logout.
- **CSRF token extraction**: before every write action (vote, comment, submit), fetch the relevant HN page in Rust, parse the HTML to extract `fnid`/`hmac`/`auth` tokens using `scraper` crate, then POST. Do not cache these tokens — they're single-use.
- **Error handling in Rust**: return `Result<T, String>` from all commands. Map errors to human-readable strings. The frontend displays these to the user.

### Tauri Config (`tauri.conf.json`)

- `allowlist.http.scope` must include `https://hacker-news.firebaseio.com/**` and `https://news.ycombinator.com/**`.
- `security.csp` must permit those same origins.
- Shell plugin: only allow opening URLs in the system browser — no arbitrary shell execution.

---

## HN Write Flow (important — read this)

HN has no public write API. Writes go through the web UI. The pattern is:

1. **Login**: POST to `https://news.ycombinator.com/login` with `acct` + `pw` + `goto=news`. On success, HN sets a `user` cookie. Capture and persist it.

2. **Before any write action**: fetch the page that contains the action form (e.g. the item page for a comment, the vote link for upvoting). Parse the HTML with `scraper` to extract the hidden token fields.

3. **Perform the action**: POST the form data including the token. Include the `Cookie: user=...` header.

4. **Check the response**: HN returns a redirect on success, an error page on failure. Parse accordingly.

This is brittle by nature. Keep all of this logic in `src-tauri/src/hn_web.rs` so it's easy to find and fix when HN changes their markup.

---

## Tauri Commands to Implement

```rust
// Authentication
#[tauri::command] async fn hn_login(username: String, password: String) -> Result<(), String>
#[tauri::command] async fn hn_logout() -> Result<(), String>
#[tauri::command] async fn hn_is_logged_in() -> bool

// Write actions
#[tauri::command] async fn hn_vote(item_id: u64, direction: String) -> Result<(), String>
#[tauri::command] async fn hn_comment(parent_id: u64, text: String) -> Result<(), String>
#[tauri::command] async fn hn_submit(title: String, url: Option<String>, text: Option<String>) -> Result<u64, String>
```

All write commands must check for an active session and return a descriptive error if not logged in.

---

## What to Build First (suggested order)

1. Tauri scaffold + basic React layout (sidebar, topbar, main area)
2. HN API client (`src/lib/hnApi.ts`) + TypeScript types
3. Feed view (Top Stories) with pagination
4. Thread view with recursive comments
5. Settings (theme, prefs) persisted via tauri-plugin-store
6. Login flow (Rust command + frontend modal)
7. Upvoting
8. Comment/reply compose
9. Story submission
10. Search (Algolia)
11. Keyboard shortcuts
12. Bookmarks

---

## Things to Watch Out For

- **HN item IDs are fetched as arrays of up to 500.** Don't fetch all 500 item details upfront — fetch the first page (30 IDs), then prefetch the next page in the background.
- **Comment trees can be very deep.** Don't eagerly load the entire tree. Fetch top-level kids, then load nested kids on expand.
- **HN text fields contain HTML.** Always sanitise before `dangerouslySetInnerHTML`. Never skip this.
- **The `deleted` and `dead` fields.** Items can be deleted or killed. Show a placeholder ("deleted" / "dead") rather than crashing or showing blank.
- **Login state on startup.** Check the keychain for a stored session cookie. Validate it by fetching the user profile — if it returns the user, session is valid. If 403/redirect, clear and ask to log in again.
- **Tauri on Linux** may need additional system deps for the webkit2gtk webview. Document this in the README.

---

## Crates to Add (Rust)

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-store = "2"
tauri-plugin-http = "2"
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["cookies", "json"] }
scraper = "0.19"
keyring = "2"
tokio = { version = "1", features = ["full"] }
```

---

## Definition of Done (Phase 1)

- [ ] App launches on Ubuntu without errors
- [ ] All 6 feed types load and paginate correctly
- [ ] Thread view renders full comment tree, collapse/expand works
- [ ] HTML in comments/titles is sanitised and rendered correctly
- [ ] Settings persist across app restarts
- [ ] Dark/light/system theme works
- [ ] Links open in system browser
- [ ] No TypeScript errors (`tsc --noEmit` passes clean)
- [ ] No `console.error` in normal operation
