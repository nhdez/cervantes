# Cervantes — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully working read-only Hacker News desktop client with dark/light themes, six feed types, paginated story lists, recursive comment threads, settings persistence, and a login flow — targeting Ubuntu (Linux) first.

**Architecture:** Three-pane layout (Sidebar / StoryList / Reader) rendered in React 19 + TypeScript inside a Tauri 2 WebView. All network I/O goes through either TanStack Query → HN Firebase REST API (reads) or Tauri commands → Rust reqwest (writes). Theme tokens live in a single `theme.ts` consumed via React context. Zustand holds only auth and settings state; fetched data lives exclusively in React Query cache.

**Tech Stack:** Tauri 2 · React 19 · TypeScript · Vite · pnpm · Tailwind CSS v4 · TanStack Query v5 · Zustand v5 · DOMPurify · tauri-plugin-store · tauri-plugin-http · tauri-plugin-shell · reqwest · scraper · keyring

**UI Reference:** `/ui/` folder — `Cervantes.html` opens in any browser to show the exact target design. All colours, spacing, fonts, and interactions are defined there. Translate from the JSX prototypes (vanilla globals, no modules) into the proper TypeScript component tree.

**Fonts:** Source Serif 4 + JetBrains Mono — load via `@fontsource` npm packages (no CDN).

**Note on HTML rendering:** HN item text/title fields contain HTML. The plan creates a `SafeHtml` component (`src/components/Shared/SafeHtml.tsx`) that wraps React's unsafe HTML rendering prop with a mandatory DOMPurify call. Every place that renders HN-sourced HTML MUST use `<SafeHtml>`, never call the unsafe prop directly.

**Verify command prefix:** Prepend `PATH="$HOME/.cargo/bin:$PATH"` to all cargo/tauri commands.

---

## File Map

### Frontend — new files to create
```
src/
  theme.ts
  types/hn.ts
  lib/hnApi.ts
  lib/sanitize.ts
  lib/time.ts
  stores/settingsStore.ts
  stores/authStore.ts
  hooks/useStories.ts
  hooks/useItem.ts
  hooks/useUser.ts
  components/Shared/Icon.tsx
  components/Shared/Tag.tsx
  components/Shared/IconButton.tsx
  components/Shared/SafeHtml.tsx       # isolates unsafe HTML rendering with DOMPurify
  components/Layout/Desktop.tsx
  components/Layout/Sidebar.tsx
  components/Layout/Toolbar.tsx
  components/Feed/FeedView.tsx
  components/Feed/StoryRow.tsx
  components/Thread/StoryHeader.tsx
  components/Thread/CommentTree.tsx
  components/Thread/CommentNode.tsx
  components/Thread/CommentComposer.tsx
  components/Thread/ThreadView.tsx
  components/Auth/LoginModal.tsx
  index.css
```

### Frontend — files to overwrite
```
src/App.tsx
src/App.css      → empty (Tailwind handles styling)
src/main.tsx     → add QueryClient provider
vite.config.ts   → add @tailwindcss/vite plugin
```

### Backend — new files to create
```
src-tauri/src/hn_web.rs     # login, logout, is_logged_in, vote, comment, submit
src-tauri/src/keychain.rs   # session cookie storage via keyring crate
```

### Config files to modify
```
src-tauri/Cargo.toml
src-tauri/tauri.conf.json
src-tauri/capabilities/default.json
src-tauri/src/lib.rs
```

---

## Task 1: Install dependencies and configure the project

**Files:** `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `vite.config.ts`

- [ ] **Step 1.1: Install frontend dependencies**

```bash
cd /home/nhc/dev/personal/rust/tauri/mecomic
PATH="$HOME/.cargo/bin:$PATH" pnpm add \
  zustand \
  @tanstack/react-query \
  dompurify \
  @tauri-apps/plugin-store \
  @tauri-apps/plugin-http \
  @tauri-apps/plugin-shell \
  @fontsource/source-serif-4 \
  @fontsource/jetbrains-mono

PATH="$HOME/.cargo/bin:$PATH" pnpm add -D \
  @types/dompurify \
  tailwindcss \
  @tailwindcss/vite
```

- [ ] **Step 1.2: Update Rust dependencies in `src-tauri/Cargo.toml`**

Replace the `[dependencies]` section:

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-store = "2"
tauri-plugin-http = "2"
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["cookies", "json"] }
scraper = "0.22"
keyring = "3"
tokio = { version = "1", features = ["full"] }
once_cell = "1"
```

- [ ] **Step 1.3: Configure Tailwind v4 in `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
}));
```

- [ ] **Step 1.4: Wipe `src/App.css` and create `src/index.css`**

`src/App.css` → empty file.

`src/index.css`:
```css
@import "tailwindcss";
@import "@fontsource/source-serif-4/300.css";
@import "@fontsource/source-serif-4/400.css";
@import "@fontsource/source-serif-4/500.css";
@import "@fontsource/source-serif-4/600.css";
@import "@fontsource/source-serif-4/700.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

html, body, #root { margin: 0; padding: 0; height: 100%; }
body { font-family: "Source Serif 4", Georgia, serif; -webkit-font-smoothing: antialiased; }
* { box-sizing: border-box; }
button { font: inherit; }
textarea { font: inherit; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: rgba(120,110,90,0.25); border-radius: 6px; border: 2px solid transparent; background-clip: padding-box; }
*::-webkit-scrollbar-thumb:hover { background: rgba(120,110,90,0.45); border: 2px solid transparent; background-clip: padding-box; }
*::-webkit-scrollbar-track { background: transparent; }
```

- [ ] **Step 1.5: Update `src-tauri/tauri.conf.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Cervantes",
  "version": "0.1.0",
  "identifier": "com.mecomic.dev",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Cervantes",
        "width": 1320,
        "height": 840,
        "minWidth": 900,
        "minHeight": 600,
        "decorations": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src https://hacker-news.firebaseio.com https://news.ycombinator.com https://hn.algolia.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 1.6: Update `src-tauri/capabilities/default.json`**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "http:default",
    "shell:default",
    "store:default"
  ]
}
```

- [ ] **Step 1.7: Verify Vite boots**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm dev
```

Expected: Vite starts on port 1420, no errors in console.

- [ ] **Step 1.8: Commit**

```bash
git add -A
git commit -m "feat: install deps, configure tailwind v4, update tauri config"
```

---

## Task 2: TypeScript types and HN API client

**Files:** `src/types/hn.ts`, `src/lib/hnApi.ts`, `src/lib/sanitize.ts`, `src/lib/time.ts`

- [ ] **Step 2.1: Create `src/types/hn.ts`**

```typescript
export type FeedType = "top" | "new" | "best" | "ask" | "show" | "jobs";

export interface HNItem {
  id: number;
  type: "job" | "story" | "comment" | "poll" | "pollopt";
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  deleted?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface HNUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

export const FEED_ENDPOINTS: Record<FeedType, string> = {
  top: "topstories",
  new: "newstories",
  best: "beststories",
  ask: "askstories",
  show: "showstories",
  jobs: "jobstories",
};
```

- [ ] **Step 2.2: Create `src/lib/hnApi.ts`**

```typescript
const BASE = "https://hacker-news.firebaseio.com/v0";

export async function fetchFeedIds(endpoint: string): Promise<number[]> {
  const res = await fetch(`${BASE}/${endpoint}.json`);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchItem(id: number): Promise<import("../types/hn").HNItem> {
  const res = await fetch(`${BASE}/item/${id}.json`);
  if (!res.ok) throw new Error(`Item ${id} fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchUser(username: string): Promise<import("../types/hn").HNUser> {
  const res = await fetch(`${BASE}/user/${username}.json`);
  if (!res.ok) throw new Error(`User ${username} fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchItems(ids: number[]): Promise<import("../types/hn").HNItem[]> {
  return Promise.all(ids.map(fetchItem));
}
```

- [ ] **Step 2.3: Create `src/lib/sanitize.ts`**

```typescript
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["a", "b", "i", "em", "strong", "code", "pre", "p"];
const ALLOWED_ATTR = ["href"];

export function sanitizeHtml(dirty: string | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR, FORCE_BODY: false });
}
```

- [ ] **Step 2.4: Create `src/lib/time.ts`**

```typescript
export function timeAgo(unixSeconds: number | undefined): string {
  if (!unixSeconds) return "";
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 2592000)}mo`;
}

export function domainFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url.split("/")[0]; }
}
```

- [ ] **Step 2.5: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2.6: Commit**

```bash
git add src/types/ src/lib/
git commit -m "feat: HN types, API client, sanitize and time helpers"
```

---

## Task 3: Theme system and Zustand stores

**Files:** `src/theme.ts`, `src/stores/settingsStore.ts`, `src/stores/authStore.ts`

- [ ] **Step 3.1: Create `src/theme.ts`**

```typescript
import React from "react";

export const SERIF = '"Source Serif 4", "Source Serif Pro", Charter, Georgia, serif';
export const MONO  = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace';

export interface Theme {
  bg: string; surface: string; surfaceAlt: string; rule: string;
  ink: string; inkSoft: string; muted: string; mutedSoft: string;
  accent: string; accentSoft: string; warn: string; good: string; shadow: string;
}

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    bg: "#EFE8D9", surface: "#F5F0E2", surfaceAlt: "#E8E0CE", rule: "#D8CFB9",
    ink: "#2A2520", inkSoft: "#4B4339", muted: "#7A6F5E", mutedSoft: "#988C77",
    accent: "oklch(0.58 0.14 45)", accentSoft: "oklch(0.92 0.04 60)",
    warn: "oklch(0.62 0.13 70)", good: "oklch(0.55 0.10 145)",
    shadow: "0 1px 0 rgba(0,0,0,0.04)",
  },
  dark: {
    bg: "#1B1814", surface: "#24201A", surfaceAlt: "#2E2922", rule: "#3A3429",
    ink: "#E8E0CE", inkSoft: "#C9BFA8", muted: "#948B7C", mutedSoft: "#6D6557",
    accent: "oklch(0.72 0.14 50)", accentSoft: "oklch(0.34 0.06 50)",
    warn: "oklch(0.74 0.12 75)", good: "oklch(0.68 0.10 145)",
    shadow: "0 1px 0 rgba(0,0,0,0.3)",
  },
};

export const ThemeContext = React.createContext<Theme>(THEMES.light);
export const useTheme = () => React.useContext(ThemeContext);
```

- [ ] **Step 3.2: Create `src/stores/settingsStore.ts`**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FeedType } from "../types/hn";

interface SettingsState {
  dark: boolean; accent: string; fontScale: number;
  density: "compact" | "comfy"; defaultFeed: FeedType;
  itemsPerPage: 15 | 30 | 50; openLinksIn: "browser" | "webview";
  setDark: (v: boolean) => void;
  setAccent: (v: string) => void;
  setFontScale: (v: number) => void;
  setDensity: (v: "compact" | "comfy") => void;
  setDefaultFeed: (v: FeedType) => void;
  setItemsPerPage: (v: 15 | 30 | 50) => void;
  setOpenLinksIn: (v: "browser" | "webview") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dark: false, accent: "#B85D2E", fontScale: 1, density: "comfy",
      defaultFeed: "top", itemsPerPage: 30, openLinksIn: "browser",
      setDark: (v) => set({ dark: v }),
      setAccent: (v) => set({ accent: v }),
      setFontScale: (v) => set({ fontScale: v }),
      setDensity: (v) => set({ density: v }),
      setDefaultFeed: (v) => set({ defaultFeed: v }),
      setItemsPerPage: (v) => set({ itemsPerPage: v }),
      setOpenLinksIn: (v) => set({ openLinksIn: v }),
    }),
    { name: "cervantes-settings" }
  )
);
```

- [ ] **Step 3.3: Create `src/stores/authStore.ts`**

```typescript
import { create } from "zustand";

interface AuthState {
  loggedIn: boolean; username: string | null; karma: number | null;
  setLoggedIn: (username: string, karma: number) => void;
  setLoggedOut: () => void;
  setKarma: (karma: number) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  loggedIn: false, username: null, karma: null,
  setLoggedIn: (username, karma) => set({ loggedIn: true, username, karma }),
  setLoggedOut: () => set({ loggedIn: false, username: null, karma: null }),
  setKarma: (karma) => set({ karma }),
}));
```

- [ ] **Step 3.4: Update `src/main.tsx` to add QueryClientProvider**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 3.5: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3.6: Commit**

```bash
git add src/theme.ts src/stores/ src/main.tsx
git commit -m "feat: theme tokens, settings store, auth store, QueryClient"
```

---

## Task 4: TanStack Query hooks

**Files:** `src/hooks/useStories.ts`, `src/hooks/useItem.ts`, `src/hooks/useUser.ts`

- [ ] **Step 4.1: Create `src/hooks/useStories.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchFeedIds, fetchItem } from "../lib/hnApi";
import type { FeedType } from "../types/hn";
import { FEED_ENDPOINTS } from "../types/hn";

export function useFeedIds(feed: FeedType) {
  return useQuery({
    queryKey: ["feed", feed],
    queryFn: () => fetchFeedIds(FEED_ENDPOINTS[feed]),
    staleTime: 60_000,
  });
}

export function useFeedPage(feed: FeedType, page: number, perPage: number) {
  const { data: ids } = useFeedIds(feed);
  const pageIds = (ids ?? []).slice(page * perPage, (page + 1) * perPage);
  return useQuery({
    queryKey: ["feed-page", feed, page, perPage],
    queryFn: () => Promise.all(pageIds.map(fetchItem)),
    enabled: pageIds.length > 0,
    staleTime: 60_000,
  });
}

export function useTotalPages(feed: FeedType, perPage: number): number {
  const { data: ids } = useFeedIds(feed);
  if (!ids) return 0;
  return Math.ceil(ids.length / perPage);
}
```

- [ ] **Step 4.2: Create `src/hooks/useItem.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchItem, fetchItems } from "../lib/hnApi";

export function useItem(id: number | null) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id!),
    enabled: id != null,
    staleTime: 5 * 60_000,
  });
}

export function useKids(ids: number[] | undefined) {
  return useQuery({
    queryKey: ["kids", ids],
    queryFn: () => fetchItems(ids!),
    enabled: !!ids && ids.length > 0,
    staleTime: 5 * 60_000,
  });
}
```

- [ ] **Step 4.3: Create `src/hooks/useUser.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "../lib/hnApi";

export function useUser(username: string | null) {
  return useQuery({
    queryKey: ["user", username],
    queryFn: () => fetchUser(username!),
    enabled: username != null,
    staleTime: 10 * 60_000,
  });
}
```

- [ ] **Step 4.4: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4.5: Commit**

```bash
git add src/hooks/
git commit -m "feat: TanStack Query hooks for feeds, items, users"
```

---

## Task 5: Shared UI primitives

**Files:** `src/components/Shared/Icon.tsx`, `src/components/Shared/Tag.tsx`, `src/components/Shared/IconButton.tsx`, `src/components/Shared/SafeHtml.tsx`

- [ ] **Step 5.1: Create `src/components/Shared/Icon.tsx`**

Copy the 14 icons from `ui/components-shell.jsx` Icon function exactly, typed as:

```typescript
interface IconProps { name: string; size?: number; color?: string; }

export function Icon({ name, size = 14, color = "currentColor" }: IconProps) {
  const s = size;
  const stroke = { stroke: color, strokeWidth: 1.5, fill: "none" as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "star":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5l3.8-.5L8 2.5z"/></svg>;
    case "star-fill": return <svg width={s} height={s} viewBox="0 0 16 16"><path fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" d="M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5l3.8-.5L8 2.5z"/></svg>;
    case "arrow-up":  return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 12V4M4.5 7.5L8 4l3.5 3.5"/></svg>;
    case "chat":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 4h10v7H7l-3 2.5V11H3z"/></svg>;
    case "link":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M9.5 6.5l-3 3M6.5 4.5l-2 2a2.5 2.5 0 003.5 3.5l1-1M9.5 11.5l2-2a2.5 2.5 0 00-3.5-3.5l-1 1"/></svg>;
    case "sun":       return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="8" cy="8" r="2.5"/><path {...stroke} d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>;
    case "moon":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M13 9.5A5 5 0 016.5 3a5.5 5.5 0 1 0 6.5 6.5z"/></svg>;
    case "search":    return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="7" cy="7" r="4"/><path {...stroke} d="M10 10l3 3"/></svg>;
    case "plus":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 3v10M3 8h10"/></svg>;
    case "back":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M10 3L5 8l5 5"/></svg>;
    case "tag":       return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 3h5l5 5-5 5-5-5V3z"/><circle cx="6" cy="6" r="0.8" fill={color}/></svg>;
    case "reply":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M6 4L2 7.5 6 11M2.5 7.5H10a3.5 3.5 0 013.5 3.5V13"/></svg>;
    case "more":      return <svg width={s} height={s} viewBox="0 0 16 16"><circle cx="4" cy="8" r="1" fill={color}/><circle cx="8" cy="8" r="1" fill={color}/><circle cx="12" cy="8" r="1" fill={color}/></svg>;
    case "check":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 8.5L6.5 12 13 5"/></svg>;
    default:          return null;
  }
}
```

- [ ] **Step 5.2: Create `src/components/Shared/SafeHtml.tsx`**

This is the ONLY file in the codebase that may use React's unsafe inner HTML prop. It enforces DOMPurify on every call.

```typescript
import { sanitizeHtml } from "../../lib/sanitize";

interface SafeHtmlProps {
  html: string | undefined;
  style?: React.CSSProperties;
  className?: string;
}

export function SafeHtml({ html, style, className }: SafeHtmlProps) {
  // sanitizeHtml runs DOMPurify before this reaches the DOM
  return (
    <div
      style={style}
      className={className}
      // Content is sanitized by DOMPurify in sanitizeHtml() — safe for HN HTML
      {...{ dangerouslySetInnerHTML: { __html: sanitizeHtml(html) } }}
    />
  );
}
```

- [ ] **Step 5.3: Create `src/components/Shared/Tag.tsx`**

```typescript
import { useTheme, MONO } from "../../theme";

interface TagProps { kind: "ask" | "show" | "job" | "note"; children: React.ReactNode; }

export function Tag({ kind, children }: TagProps) {
  const t = useTheme();
  const styles = {
    ask:  { bg: t.accentSoft, fg: t.accent },
    show: { bg: t.accentSoft, fg: t.accent },
    job:  { bg: "transparent", fg: t.muted, border: `1px solid ${t.rule}` },
    note: { bg: "transparent", fg: t.muted },
  } as Record<string, { bg: string; fg: string; border?: string }>;
  const c = styles[kind] || styles.note;
  return (
    <span style={{ fontFamily: MONO, fontSize: 9.5, padding: "1px 6px", borderRadius: 3, background: c.bg, color: c.fg, textTransform: "uppercase" as const, letterSpacing: 0.6, border: c.border }}>
      {children}
    </span>
  );
}
```

- [ ] **Step 5.4: Create `src/components/Shared/IconButton.tsx`**

```typescript
import { useState } from "react";
import { useTheme, SERIF } from "../../theme";

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  tip?: string;
  active?: boolean;
}

export function IconButton({ children, onClick, tip, active }: IconButtonProps) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={tip}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        height: 30, minWidth: 30, padding: "0 8px", borderRadius: 6,
        border: `1px solid ${active ? t.accent : t.rule}`,
        background: active ? t.accentSoft : (hover ? t.surfaceAlt : "transparent"),
        color: t.ink, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: SERIF, fontSize: 13,
      }}>
      {children}
    </button>
  );
}
```

- [ ] **Step 5.5: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5.6: Commit**

```bash
git add src/components/Shared/
git commit -m "feat: Icon, SafeHtml, Tag, IconButton shared components"
```

---

## Task 6: Layout shell — Desktop, Sidebar, Toolbar

**Files:** `src/components/Layout/Desktop.tsx`, `src/components/Layout/Sidebar.tsx`, `src/components/Layout/Toolbar.tsx`

- [ ] **Step 6.1: Create `src/components/Layout/Desktop.tsx`**

```typescript
import { useState, useEffect } from "react";
import { useTheme, SERIF } from "../../theme";

export function Desktop({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const isDark = t.bg === "#1B1814";
  const wall = isDark
    ? "radial-gradient(ellipse at 30% 0%, #2A2418, #110F0B 70%)"
    : "radial-gradient(ellipse at 30% 0%, #D6C8A7, #B9A883 70%)";
  const INNER_W = 1320, INNER_H = 840;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      setScale(Math.min(1, window.innerWidth / INNER_W, window.innerHeight / INNER_H));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: wall, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, color: t.ink }}>
      <div style={{ width: INNER_W, height: INNER_H, transform: `scale(${scale})`, transformOrigin: "center center", flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", background: t.bg, boxShadow: isDark ? "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px rgba(0,0,0,0.6)" : "0 0 0 1px rgba(0,0,0,0.12), 0 24px 80px rgba(0,0,0,0.30)", display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Create `src/components/Layout/Sidebar.tsx`**

Translate directly from `ui/components-shell.jsx` Sidebar function. Key points:
- `SECTIONS` and `FAVORITE_TAGS` arrays are exported constants (used by ThreadView/StoryHeader)
- User footer shows Sign-in button when not logged in, avatar+karma when logged in
- Selected item has a 2px accent left-border via absolute positioning

```typescript
import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import type { FeedType } from "../../types/hn";
import { useAuthStore } from "../../stores/authStore";

export interface FavTag { id: string; label: string; color: string; }

export const SECTIONS: { id: FeedType; label: string; hint: string }[] = [
  { id: "top",  label: "Top",     hint: "Front page" },
  { id: "new",  label: "New",     hint: "Newest" },
  { id: "best", label: "Best",    hint: "Highest-voted recently" },
  { id: "ask",  label: "Ask HN",  hint: "Questions" },
  { id: "show", label: "Show HN", hint: "Projects" },
  { id: "jobs", label: "Jobs",    hint: "Hiring" },
];

export const FAVORITE_TAGS: FavTag[] = [
  { id: "read-later", label: "Read later",  color: "warn" },
  { id: "tools",      label: "Tools",       color: "accent" },
  { id: "deep-dive",  label: "Deep dives",  color: "ink" },
  { id: "saved",      label: "Saved",       color: "muted" },
];

interface SidebarProps {
  section: FeedType; onSection: (s: FeedType) => void;
  favTag: string | null; onFavTag: (t: string | null) => void;
  favCount: number; onLoginClick: () => void;
}

export function Sidebar({ section, onSection, favTag, onFavTag, favCount, onLoginClick }: SidebarProps) {
  const t = useTheme();
  const { loggedIn, username, karma } = useAuthStore();

  return (
    <div style={{ width: 232, flexShrink: 0, height: "100%", background: t.surface, borderRight: `1px solid ${t.rule}`, display: "flex", flexDirection: "column", fontFamily: SERIF }}>
      {/* Traffic lights */}
      <div style={{ height: 44, padding: "0 16px", display: "flex", alignItems: "center", gap: 8 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((bg, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: bg, border: "0.5px solid rgba(0,0,0,0.15)" }}/>
        ))}
      </div>
      {/* Brand */}
      <div style={{ padding: "6px 18px 14px" }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: t.ink, lineHeight: 1 }}>
          Cervantes<span style={{ color: t.accent }}>.</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, color: t.mutedSoft, marginTop: 4, textTransform: "uppercase" as const }}>
          A reader for Hacker News
        </div>
      </div>
      {/* Sections */}
      <SidebarSectionHeader label="Feeds" />
      <div style={{ padding: "0 8px" }}>
        {SECTIONS.map(s => (
          <SidebarItem key={s.id} label={s.label} selected={section === s.id && !favTag}
            onClick={() => { onSection(s.id); onFavTag(null); }}/>
        ))}
      </div>
      {/* Favorites */}
      <div style={{ marginTop: 18 }}>
        <SidebarSectionHeader label="Favorites"
          right={<span style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft }}>{favCount}</span>}/>
        <div style={{ padding: "0 8px" }}>
          <SidebarItem label="All saved" iconName="star-fill" iconColor={t.accent}
            selected={favTag === "all"} onClick={() => onFavTag("all")} count={favCount}/>
          {FAVORITE_TAGS.map(tg => (
            <SidebarItem key={tg.id} label={tg.label} iconName="tag"
              iconColor={(t as Record<string, string>)[tg.color] || t.muted}
              selected={favTag === tg.id} onClick={() => onFavTag(tg.id)}/>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}/>
      {/* User footer */}
      <div style={{ borderTop: `1px solid ${t.rule}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        {loggedIn && username ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: t.accentSoft, color: t.accent, fontFamily: SERIF, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.rule}` }}>
              {username[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontFamily: SERIF, fontSize: 13, color: t.ink, fontWeight: 500 }}>{username}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.muted }}>{karma?.toLocaleString()} karma</div>
            </div>
          </>
        ) : (
          <button onClick={onLoginClick} style={{ border: `1px solid ${t.rule}`, background: "transparent", borderRadius: 6, padding: "5px 12px", fontFamily: SERIF, fontSize: 13, color: t.inkSoft, cursor: "pointer" }}>
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarSectionHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ padding: "8px 18px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, letterSpacing: 0.6, color: t.mutedSoft, textTransform: "uppercase" as const }}>
      <span>{label}</span>{right}
    </div>
  );
}

function SidebarItem({ label, count, selected, onClick, iconName, iconColor }: { label: string; count?: number; selected: boolean; onClick: () => void; iconName?: string; iconColor?: string }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer", background: selected ? t.surfaceAlt : (hover ? t.surfaceAlt : "transparent"), color: selected ? t.ink : t.inkSoft, padding: "6px 10px", borderRadius: 6, margin: "1px 0", display: "flex", alignItems: "center", gap: 8, fontFamily: SERIF, fontSize: 14, fontWeight: selected ? 600 : 400, position: "relative" }}>
      {selected && <div style={{ position: "absolute", left: -8, top: 6, bottom: 6, width: 2, background: t.accent, borderRadius: 1 }}/>}
      {iconName ? <Icon name={iconName} color={iconColor || t.muted} size={13}/> : <div style={{ width: 6, height: 6, borderRadius: 1, background: t.mutedSoft, opacity: selected ? 1 : 0.5 }}/>}
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span style={{ fontFamily: MONO, fontSize: 10, color: t.muted }}>{count}</span>}
    </button>
  );
}
```

- [ ] **Step 6.3: Create `src/components/Layout/Toolbar.tsx`**

```typescript
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import { IconButton } from "../Shared/IconButton";
import { useSettingsStore } from "../../stores/settingsStore";

interface ToolbarProps {
  title: string; subtitle?: string;
  search: string; onSearch: (v: string) => void;
  right?: React.ReactNode;
}

export function Toolbar({ title, subtitle, search, onSearch, right }: ToolbarProps) {
  const t = useTheme();
  const { dark, setDark } = useSettingsStore();
  return (
    <div style={{ height: 56, flexShrink: 0, padding: "0 18px", borderBottom: `1px solid ${t.rule}`, background: t.surface, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: t.ink, letterSpacing: -0.2, lineHeight: 1.1 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, marginTop: 3, letterSpacing: 0.3, textTransform: "uppercase" as const }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px", background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 6, width: 220 }}>
        <Icon name="search" color={t.muted} size={13}/>
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search stories"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: SERIF, fontSize: 13, color: t.ink }}/>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: t.mutedSoft, border: `1px solid ${t.rule}`, padding: "1px 4px", borderRadius: 3 }}>⌘K</span>
      </div>
      {right}
      <IconButton onClick={() => setDark(!dark)} tip={dark ? "Light mode" : "Dark mode"}>
        <Icon name={dark ? "sun" : "moon"} color={t.ink} size={14}/>
      </IconButton>
    </div>
  );
}
```

- [ ] **Step 6.4: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6.5: Commit**

```bash
git add src/components/Layout/
git commit -m "feat: Desktop, Sidebar, Toolbar layout components"
```

---

## Task 7: Feed view (story list)

**Files:** `src/components/Feed/StoryRow.tsx`, `src/components/Feed/FeedView.tsx`

- [ ] **Step 7.1: Create `src/components/Feed/StoryRow.tsx`**

Translate from `ui/components-list.jsx` StoryRow. Key differences from prototype:
- `story.time` is a Unix timestamp — use `timeAgo(story.time)` from `lib/time.ts`
- `story.url` is a full URL — use `domainFromUrl(story.url)` from `lib/time.ts`
- `story.type` detection: use `story.title?.startsWith("Ask HN")` / `"Show HN"` rather than a `type` field since the Firebase API returns type="story" for both

```typescript
import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import { Tag } from "../Shared/Tag";
import type { HNItem } from "../../types/hn";
import { domainFromUrl, timeAgo } from "../../lib/time";
import type { FavMeta } from "./FeedView";

interface StoryRowProps {
  story: HNItem; index: number; selected: boolean;
  isFav: boolean; favMeta?: FavMeta;
  onClick: () => void; onToggleFav: () => void;
}

export function StoryRow({ story, index, selected, isFav, favMeta, onClick, onToggleFav }: StoryRowProps) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const domain = domainFromUrl(story.url);
  const isAsk = story.title?.startsWith("Ask HN");
  const isShow = story.title?.startsWith("Show HN");
  const isJob = story.type === "job";

  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: "14px 18px 14px 16px", background: selected ? t.surface : (hover ? t.surfaceAlt : "transparent"), borderBottom: `1px solid ${t.rule}`, cursor: "pointer", position: "relative", borderLeft: selected ? `3px solid ${t.accent}` : "3px solid transparent" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: t.mutedSoft, width: 22, paddingTop: 3, textAlign: "right", flexShrink: 0 }}>
          {String(index).padStart(2, "0")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.35, color: t.ink, fontWeight: selected ? 600 : 500 }}>
            {story.title}
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.2 }}>
            {domain && <span style={{ color: t.inkSoft, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="link" color={t.muted} size={11}/>{domain}</span>}
            {isAsk && <Tag kind="ask">ask</Tag>}
            {isShow && <Tag kind="show">show</Tag>}
            {isJob && <Tag kind="job">hiring</Tag>}
            {(story.score ?? 0) > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="arrow-up" color={t.muted} size={11}/>{story.score}</span>}
            {(story.descendants ?? 0) > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="chat" color={t.muted} size={11}/>{story.descendants}</span>}
            <span>{timeAgo(story.time)}</span>
            {story.by && <span>· {story.by}</span>}
          </div>
          {isFav && favMeta?.note && (
            <div style={{ marginTop: 8, padding: "6px 10px", borderLeft: `2px solid ${t.accent}`, background: t.surface, fontFamily: SERIF, fontSize: 12.5, fontStyle: "italic", color: t.inkSoft, lineHeight: 1.4 }}>
              "{favMeta.note}"
            </div>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleFav(); }}
          title={isFav ? "Remove from favorites" : "Add to favorites"}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, marginTop: 1, color: isFav ? t.accent : t.mutedSoft, opacity: isFav || hover ? 1 : 0.35, transition: "opacity .15s" }}>
          <Icon name={isFav ? "star-fill" : "star"} size={15} color={isFav ? t.accent : t.muted}/>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: Create `src/components/Feed/FeedView.tsx`**

```typescript
import { useTheme, SERIF } from "../../theme";
import { StoryRow } from "./StoryRow";
import type { FeedType } from "../../types/hn";
import { useFeedPage, useTotalPages } from "../../hooks/useStories";
import { useSettingsStore } from "../../stores/settingsStore";

export interface FavMeta { note: string; tags: string[]; savedAt: string; }

interface FeedViewProps {
  feed: FeedType; selectedId: number | null; onSelect: (id: number) => void;
  favorites: Set<number>; onToggleFav: (id: number) => void;
  favoriteMeta: Record<number, FavMeta>; page: number;
  onPageChange: (p: number) => void; search: string;
}

export function FeedView({ feed, selectedId, onSelect, favorites, onToggleFav, favoriteMeta, page, onPageChange, search }: FeedViewProps) {
  const t = useTheme();
  const { itemsPerPage } = useSettingsStore();
  const { data: stories, isLoading, isError } = useFeedPage(feed, page, itemsPerPage);
  const totalPages = useTotalPages(feed, itemsPerPage);

  const filtered = (stories ?? []).filter(s => {
    if (s.dead || s.deleted) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.title ?? "").toLowerCase().includes(q) || (s.by ?? "").toLowerCase().includes(q);
  });

  if (isLoading) return <FeedShell><span style={{ fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: t.muted }}>Loading…</span></FeedShell>;
  if (isError) return <FeedShell><span style={{ fontFamily: SERIF, fontSize: 14, color: t.warn }}>Failed to load.</span></FeedShell>;

  return (
    <div style={{ width: 420, flexShrink: 0, height: "100%", borderRight: `1px solid ${t.rule}`, background: t.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && <div style={{ padding: "60px 24px", color: t.muted, fontFamily: SERIF, fontSize: 14, fontStyle: "italic", textAlign: "center" }}>Nothing here.</div>}
        {filtered.map((s, i) => (
          <StoryRow key={s.id} story={s} index={page * itemsPerPage + i + 1}
            selected={selectedId === s.id} isFav={favorites.has(s.id)}
            favMeta={favoriteMeta[s.id]}
            onClick={() => onSelect(s.id)} onToggleFav={() => onToggleFav(s.id)}/>
        ))}
      </div>
      {totalPages > 1 && (
        <div style={{ borderTop: `1px solid ${t.rule}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
            style={{ border: `1px solid ${t.rule}`, background: "transparent", borderRadius: 5, padding: "4px 12px", fontFamily: SERIF, fontSize: 13, color: t.inkSoft, cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
          <span style={{ fontFamily: MONO, fontSize: 12, color: t.muted } as React.CSSProperties}>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}
            style={{ border: `1px solid ${t.rule}`, background: "transparent", borderRadius: 5, padding: "4px 12px", fontFamily: SERIF, fontSize: 13, color: t.inkSoft, cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

function FeedShell({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ width: 420, flexShrink: 0, height: "100%", borderRight: `1px solid ${t.rule}`, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 7.3: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7.4: Commit**

```bash
git add src/components/Feed/
git commit -m "feat: FeedView and StoryRow with pagination"
```

---

## Task 8: Thread view — recursive comments

**Files:** `src/components/Thread/CommentNode.tsx`, `src/components/Thread/CommentTree.tsx`, `src/components/Thread/CommentComposer.tsx`, `src/components/Thread/StoryHeader.tsx`, `src/components/Thread/ThreadView.tsx`

Helpers used in multiple thread components (define inline or in a `threadStyles.ts` helper):

```typescript
// btnGhost and btnPrimary — copy to each component that needs them,
// or extract to src/components/Shared/buttonStyles.ts
function btnGhost(t: Theme) {
  return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 12px", borderRadius: 6, border: `1px solid ${t.rule}`, background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer" };
}
function btnPrimary(t: Theme) {
  return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 13, fontWeight: 600, cursor: "pointer" };
}
```

- [ ] **Step 8.1: Create `src/components/Thread/CommentNode.tsx`**

Translate from `ui/components-reader.jsx` CommentNode. Key points:
- Renders dead/deleted items as `[deleted]` / `[dead]` italic placeholders
- Collapse/expand via local `useState(false)` — never global
- Upvote button fires `onVote(comment.id, voted ? -1 : 1)`
- The thin vertical bar in the gutter is a button that also collapses
- Reply box expands inline on click (local `useState`)
- Children are loaded lazily via `useKids(comment.kids)` — this component fetches its own children
- HN comment text is rendered via `<SafeHtml html={comment.text}/>`

```typescript
import { useState } from "react";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { Icon } from "../Shared/Icon";
import { SafeHtml } from "../Shared/SafeHtml";
import { timeAgo } from "../../lib/time";
import type { HNItem } from "../../types/hn";
import { useKids } from "../../hooks/useItem";
import { useAuthStore } from "../../stores/authStore";

function btnGhost(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 12px", borderRadius: 6, border: `1px solid ${t.rule}`, background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer" }; }
function btnPrimary(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 13, fontWeight: 600, cursor: "pointer" }; }

interface CommentNodeProps {
  comment: HNItem; depth: number;
  votes: Record<number, number>; onVote: (id: number, delta: number) => void;
}

export function CommentNode({ comment, depth, votes, onVote }: CommentNodeProps) {
  const t = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const { loggedIn } = useAuthStore();
  const v = votes[comment.id] ?? 0;
  const voted = v > 0;
  const score = (comment.score ?? 0) + v;

  if (comment.deleted) return <div style={{ marginTop: depth === 0 ? 18 : 12 }}><span style={{ fontFamily: SERIF, fontSize: 13, color: t.mutedSoft, fontStyle: "italic" }}>[deleted]</span></div>;
  if (comment.dead) return <div style={{ marginTop: depth === 0 ? 18 : 12 }}><span style={{ fontFamily: SERIF, fontSize: 13, color: t.mutedSoft, fontStyle: "italic" }}>[dead]</span></div>;

  return (
    <div style={{ marginTop: depth === 0 ? 18 : 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Gutter: upvote + collapse bar */}
        <div style={{ width: 22, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2 }}>
          <button onClick={() => onVote(comment.id, voted ? -1 : 1)} title={voted ? "Unvote" : "Upvote"}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 1 }}>
            <Icon name="arrow-up" size={14} color={voted ? t.accent : t.muted}/>
          </button>
          <button onClick={() => setCollapsed(!collapsed)} title="Collapse thread"
            style={{ width: 1, flex: 1, background: t.rule, border: "none", cursor: "pointer", minHeight: 20, padding: 0 }}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.2 }}>
            <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: t.ink, letterSpacing: 0 }}>{comment.by}</span>
            {score > 0 && <span>{score} points</span>}
            <span>{timeAgo(comment.time)}</span>
            <button onClick={() => setCollapsed(!collapsed)}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: t.muted, fontFamily: MONO, fontSize: 10.5, padding: 0 }}>
              [{collapsed ? `+${comment.kids?.length ?? 0}` : "−"}]
            </button>
          </div>
          {!collapsed && (
            <>
              <SafeHtml html={comment.text} style={{ marginTop: 6, fontFamily: SERIF, fontSize: 15, lineHeight: 1.6, color: t.inkSoft }}/>
              <div style={{ marginTop: 6, display: "flex", gap: 14, fontFamily: MONO, fontSize: 10.5, color: t.mutedSoft }}>
                {loggedIn && (
                  <button onClick={() => setReplying(!replying)}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: t.muted, padding: 0, fontFamily: MONO, fontSize: 10.5, textDecoration: "underline", textUnderlineOffset: 2 }}>
                    reply
                  </button>
                )}
              </div>
              {replying && (
                <div style={{ marginTop: 10, border: `1px solid ${t.accent}`, borderRadius: 6, background: t.surface, padding: 10 }}>
                  <textarea autoFocus value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.by}…`}
                    style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 14, lineHeight: 1.5, resize: "vertical", minHeight: 60 }}/>
                  <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button style={btnGhost(t)} onClick={() => { setReplying(false); setReplyText(""); }}>Cancel</button>
                    <button style={btnPrimary(t)} onClick={() => setReplying(false)}>Reply</button>
                  </div>
                </div>
              )}
              {(comment.kids?.length ?? 0) > 0 && (
                <ChildComments ids={comment.kids!} depth={depth} votes={votes} onVote={onVote}/>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChildComments({ ids, depth, votes, onVote }: { ids: number[]; depth: number; votes: Record<number, number>; onVote: (id: number, delta: number) => void }) {
  const t = useTheme();
  const { data: kids, isLoading } = useKids(ids);
  if (isLoading) return <div style={{ paddingLeft: 14, marginTop: 8, fontFamily: SERIF, fontSize: 12, color: t.muted, fontStyle: "italic" }}>Loading replies…</div>;
  if (!kids) return null;
  return (
    <div style={{ marginTop: 6, paddingLeft: 14, borderLeft: `1px solid ${t.rule}`, marginLeft: -8 }}>
      {kids.map(child => <CommentNode key={child.id} comment={child} depth={depth + 1} votes={votes} onVote={onVote}/>)}
    </div>
  );
}
```

- [ ] **Step 8.2: Create `src/components/Thread/CommentTree.tsx`**

```typescript
import { useTheme } from "../../theme";
import { useItem } from "../../hooks/useItem";
import { CommentNode } from "./CommentNode";

interface CommentTreeProps {
  topLevelIds: number[] | undefined;
  votes: Record<number, number>;
  onVote: (id: number, delta: number) => void;
}

export function CommentTree({ topLevelIds, votes, onVote }: CommentTreeProps) {
  if (!topLevelIds || topLevelIds.length === 0) return null;
  return (
    <div>
      {topLevelIds.map(id => <TopLevelComment key={id} id={id} votes={votes} onVote={onVote}/>)}
    </div>
  );
}

function TopLevelComment({ id, votes, onVote }: { id: number; votes: Record<number, number>; onVote: (id: number, delta: number) => void }) {
  const t = useTheme();
  const { data: comment } = useItem(id);
  if (!comment) return <div style={{ marginTop: 18, height: 40, background: t.surfaceAlt, borderRadius: 6, opacity: 0.4 }}/>;
  return <CommentNode comment={comment} depth={0} votes={votes} onVote={onVote}/>;
}
```

- [ ] **Step 8.3: Create `src/components/Thread/CommentComposer.tsx`**

Translate from `ui/components-reader.jsx` CommentComposer. Shows sign-in prompt when not logged in; expands textarea on focus when logged in.

```typescript
import { useState } from "react";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { useAuthStore } from "../../stores/authStore";

function btnGhost(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 12px", borderRadius: 6, border: `1px solid ${t.rule}`, background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer" }; }
function btnPrimary(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 13, fontWeight: 600, cursor: "pointer" }; }

interface CommentComposerProps {
  onPost: (text: string) => void;
  onLoginRequired: () => void;
}

export function CommentComposer({ onPost, onLoginRequired }: CommentComposerProps) {
  const t = useTheme();
  const { loggedIn, username } = useAuthStore();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const filled = text.trim().length > 0;

  if (!loggedIn) {
    return (
      <div style={{ marginTop: 28, padding: "14px 16px", background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: SERIF, fontSize: 14, color: t.muted }}>Sign in to join the discussion.</span>
        <button onClick={onLoginRequired} style={btnGhost(t)}>Sign in</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ border: `1px solid ${focused ? t.accent : t.rule}`, background: t.surface, borderRadius: 8, padding: "10px 12px", transition: "border-color .15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: t.accentSoft, color: t.accent, fontFamily: SERIF, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.3 }}>
            commenting as <span style={{ color: t.inkSoft }}>{username}</span>
          </span>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Add to the conversation…"
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 15, lineHeight: 1.55, resize: "vertical", minHeight: focused || filled ? 90 : 38, transition: "min-height .15s" }}/>
        {(focused || filled) && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: `1px solid ${t.rule}` }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft }}>**bold** *italic* `code`</span>
            <div style={{ flex: 1 }}/>
            <button style={btnGhost(t)} onClick={() => setText("")}>Discard</button>
            <button style={{ ...btnPrimary(t), opacity: filled ? 1 : 0.5, cursor: filled ? "pointer" : "default" }}
              disabled={!filled} onClick={() => { onPost(text); setText(""); }}>Post comment</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.4: Create `src/components/Thread/StoryHeader.tsx`**

Translate from `ui/components-reader.jsx` StoryHeader. Key points:
- Opens URL via `open()` from `@tauri-apps/plugin-opener`
- Ask HN body rendered via `<SafeHtml html={story.text}/>`
- Favorite drawer with tag chips and editable note

```typescript
import { useState } from "react";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { Icon } from "../Shared/Icon";
import { Tag } from "../Shared/Tag";
import { SafeHtml } from "../Shared/SafeHtml";
import { domainFromUrl, timeAgo } from "../../lib/time";
import { FAVORITE_TAGS } from "../Layout/Sidebar";
import type { HNItem } from "../../types/hn";
import type { FavMeta } from "../Feed/FeedView";
import { open } from "@tauri-apps/plugin-opener";

function btnGhost(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 12px", borderRadius: 6, border: `1px solid ${t.rule}`, background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer" }; }
function btnPrimary(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 13, fontWeight: 600, cursor: "pointer" }; }

interface StoryHeaderProps {
  story: HNItem; isFav: boolean; favMeta?: FavMeta;
  onToggleFav: () => void;
  onUpdateFavNote: (id: number, note: string) => void;
  onUpdateFavTag: (id: number, tag: string) => void;
  votes: Record<number, number>; onVote: (id: number, delta: number) => void;
}

export function StoryHeader({ story, isFav, favMeta, onToggleFav, onUpdateFavNote, onUpdateFavTag, votes, onVote }: StoryHeaderProps) {
  const t = useTheme();
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState(favMeta?.note ?? "");
  const domain = domainFromUrl(story.url);
  const v = votes[story.id] ?? 0;
  const voted = v > 0;
  const total = (story.score ?? 0) + v;
  const openSource = async () => { if (story.url) await open(story.url); };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        {story.type === "job" && <Tag kind="job">Hiring</Tag>}
        {story.title?.startsWith("Ask HN") && <Tag kind="ask">Ask HN</Tag>}
        {story.title?.startsWith("Show HN") && <Tag kind="show">Show HN</Tag>}
      </div>
      <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: 30, lineHeight: 1.2, fontWeight: 600, letterSpacing: -0.5, color: t.ink }}>
        {story.title}
      </h1>
      <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 11, color: t.muted, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", letterSpacing: 0.2 }}>
        <span style={{ color: t.inkSoft }}>by {story.by}</span>
        <span>{timeAgo(story.time)}</span>
        {domain && (
          <a href="#" onClick={e => { e.preventDefault(); openSource(); }}
            style={{ color: t.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, borderBottom: `1px dashed ${t.accent}`, paddingBottom: 1 }}>
            <Icon name="link" size={11} color={t.accent}/>{domain}
          </a>
        )}
      </div>
      {/* Action bar */}
      <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 8, paddingTop: 16, borderTop: `1px solid ${t.rule}` }}>
        <button onClick={() => onVote(story.id, voted ? -1 : 1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: `1px solid ${voted ? t.accent : t.rule}`, background: voted ? t.accentSoft : "transparent", color: voted ? t.accent : t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <Icon name="arrow-up" size={13} color={voted ? t.accent : t.ink}/>{total} points
        </button>
        <button onClick={onToggleFav}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: `1px solid ${isFav ? t.accent : t.rule}`, background: isFav ? t.accentSoft : "transparent", color: isFav ? t.accent : t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          <Icon name={isFav ? "star-fill" : "star"} size={13} color={isFav ? t.accent : t.ink}/>{isFav ? "Favorited" : "Favorite"}
        </button>
        {story.url && <button style={btnGhost(t)} onClick={openSource}><Icon name="link" size={13} color={t.ink}/> Open source</button>}
        <div style={{ flex: 1 }}/>
      </div>
      {/* Favorite drawer */}
      {isFav && (
        <div style={{ marginTop: 16, padding: "14px 16px", background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: t.muted, letterSpacing: 0.5, textTransform: "uppercase" as const }}>Saved to</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FAVORITE_TAGS.map(tg => {
                const active = (favMeta?.tags ?? []).includes(tg.id);
                return (
                  <button key={tg.id} onClick={() => onUpdateFavTag(story.id, tg.id)}
                    style={{ padding: "3px 9px", borderRadius: 999, border: `1px solid ${active ? t.accent : t.rule}`, background: active ? t.accentSoft : "transparent", color: active ? t.accent : t.muted, fontFamily: SERIF, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {active && <Icon name="check" size={10} color={t.accent}/>}
                    {tg.label}
                  </button>
                );
              })}
            </div>
          </div>
          {!editingNote ? (
            <div onClick={() => { setDraftNote(favMeta?.note ?? ""); setEditingNote(true); }}
              style={{ fontFamily: SERIF, fontSize: 14, color: favMeta?.note ? t.ink : t.muted, fontStyle: favMeta?.note ? "italic" : "normal", cursor: "text", lineHeight: 1.45, minHeight: 22 }}>
              {favMeta?.note ? `"${favMeta.note}"` : "Add a note for future you…"}
            </div>
          ) : (
            <div>
              <textarea autoFocus value={draftNote} onChange={e => setDraftNote(e.target.value)}
                placeholder="Why are you saving this?"
                style={{ width: "100%", border: `1px solid ${t.rule}`, outline: "none", background: t.bg, color: t.ink, borderRadius: 6, padding: 10, fontFamily: SERIF, fontSize: 14, lineHeight: 1.5, resize: "vertical", minHeight: 60 }}/>
              <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button style={btnGhost(t)} onClick={() => setEditingNote(false)}>Cancel</button>
                <button style={btnPrimary(t)} onClick={() => { onUpdateFavNote(story.id, draftNote); setEditingNote(false); }}>Save note</button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Link preview card */}
      {domain && (
        <a href="#" onClick={e => { e.preventDefault(); openSource(); }}
          style={{ display: "block", marginTop: 18, padding: "14px 16px", border: `1px solid ${t.rule}`, borderRadius: 8, background: t.surface, textDecoration: "none", color: "inherit" }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.4, textTransform: "uppercase" as const }}>Linked source</div>
          <div style={{ marginTop: 4, fontFamily: SERIF, fontSize: 14, color: t.ink, fontWeight: 500 }}>{story.url}</div>
          <div style={{ marginTop: 4, fontFamily: SERIF, fontSize: 13, color: t.muted, fontStyle: "italic" }}>Click to open in browser ↗</div>
        </a>
      )}
      {/* Ask HN / Show HN body text */}
      {story.text && (
        <SafeHtml html={story.text} style={{ marginTop: 22, padding: "0 0 0 16px", borderLeft: `2px solid ${t.rule}`, fontFamily: SERIF, fontSize: 16, lineHeight: 1.65, color: t.inkSoft }}/>
      )}
    </div>
  );
}
```

- [ ] **Step 8.5: Create `src/components/Thread/ThreadView.tsx`**

```typescript
import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { useItem } from "../../hooks/useItem";
import { StoryHeader } from "./StoryHeader";
import { CommentTree } from "./CommentTree";
import { CommentComposer } from "./CommentComposer";
import type { FavMeta } from "../Feed/FeedView";

interface ThreadViewProps {
  storyId: number | null; isFav: boolean; favMeta?: FavMeta;
  onToggleFav: () => void;
  onUpdateFavNote: (id: number, note: string) => void;
  onUpdateFavTag: (id: number, tag: string) => void;
  votes: Record<number, number>; onVote: (id: number, delta: number) => void;
  onLoginRequired: () => void;
}

export function ThreadView({ storyId, isFav, favMeta, onToggleFav, onUpdateFavNote, onUpdateFavTag, votes, onVote, onLoginRequired }: ThreadViewProps) {
  const t = useTheme();
  const { data: story } = useItem(storyId);
  const [sort, setSort] = useState<"best" | "new" | "old">("best");

  if (!storyId || !story) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: t.bg, color: t.muted, gap: 12 }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontStyle: "italic", color: t.mutedSoft }}>Pick a story.</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: t.mutedSoft, letterSpacing: 0.5 }}>j / k to navigate · f to favorite · o to open</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, height: "100%", overflowY: "auto", background: t.bg }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 48px 80px" }}>
        <StoryHeader story={story} isFav={isFav} favMeta={favMeta}
          onToggleFav={onToggleFav} onUpdateFavNote={onUpdateFavNote}
          onUpdateFavTag={onUpdateFavTag} votes={votes} onVote={onVote}/>
        <CommentComposer onPost={() => {}} onLoginRequired={onLoginRequired}/>
        <div style={{ margin: "32px 0 16px", display: "flex", alignItems: "baseline", gap: 10, borderBottom: `1px solid ${t.rule}`, paddingBottom: 10 }}>
          <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: t.ink, letterSpacing: -0.1 }}>{story.descendants ?? 0} comments</h3>
          <span style={{ flex: 1 }}/>
          <div style={{ display: "flex", gap: 0, border: `1px solid ${t.rule}`, borderRadius: 5, overflow: "hidden" }}>
            {(["best", "new", "old"] as const).map(v => (
              <button key={v} onClick={() => setSort(v)}
                style={{ padding: "4px 10px", border: "none", cursor: "pointer", background: sort === v ? t.surfaceAlt : "transparent", color: sort === v ? t.ink : t.muted, fontFamily: SERIF, fontSize: 12, fontWeight: sort === v ? 600 : 400 }}>
                {v === "best" ? "Best" : v === "new" ? "Newest" : "Oldest"}
              </button>
            ))}
          </div>
        </div>
        <CommentTree topLevelIds={story.kids} votes={votes} onVote={onVote}/>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.6: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8.7: Commit**

```bash
git add src/components/Thread/
git commit -m "feat: ThreadView, StoryHeader, CommentTree, CommentNode, CommentComposer"
```

---

## Task 9: Login modal

**Files:** `src/components/Auth/LoginModal.tsx`

- [ ] **Step 9.1: Create `src/components/Auth/LoginModal.tsx`**

```typescript
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { useAuthStore } from "../../stores/authStore";
import { fetchUser } from "../../lib/hnApi";

function btnPrimary(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, padding: "8px 20px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" as const }; }

export function LoginModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { setLoggedIn } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await invoke("hn_login", { username: username.trim(), password });
      const user = await fetchUser(username.trim());
      setLoggedIn(username.trim(), user.karma);
      onClose();
    } catch (e) {
      setError(typeof e === "string" ? e : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 360, background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 12, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <h2 style={{ margin: "0 0 6px", fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: -0.3 }}>Sign in to HN</h2>
        <p style={{ margin: "0 0 24px", fontFamily: MONO, fontSize: 11, color: t.muted, letterSpacing: 0.3 }}>
          Your password is sent to news.ycombinator.com and never stored on disk.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
            style={{ height: 38, padding: "0 12px", border: `1px solid ${t.rule}`, borderRadius: 6, background: t.bg, color: t.ink, fontFamily: SERIF, fontSize: 14, outline: "none" }}/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" onKeyDown={e => e.key === "Enter" && submit()}
            style={{ height: 38, padding: "0 12px", border: `1px solid ${t.rule}`, borderRadius: 6, background: t.bg, color: t.ink, fontFamily: SERIF, fontSize: 14, outline: "none" }}/>
        </div>
        {error && <p style={{ marginTop: 12, fontFamily: SERIF, fontSize: 13, color: t.warn }}>{error}</p>}
        <button style={{ ...btnPrimary(t), marginTop: 20, opacity: loading ? 0.7 : 1 }}
          disabled={loading} onClick={submit}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 9.3: Commit**

```bash
git add src/components/Auth/
git commit -m "feat: LoginModal with Tauri invoke and auth store"
```

---

## Task 10: Wire App.tsx

**Files:** `src/App.tsx`

- [ ] **Step 10.1: Rewrite `src/App.tsx`**

```typescript
import { useState, useEffect, useMemo } from "react";
import { ThemeContext, THEMES, SERIF } from "./theme";
import { useSettingsStore } from "./stores/settingsStore";
import { Desktop } from "./components/Layout/Desktop";
import { Sidebar, SECTIONS } from "./components/Layout/Sidebar";
import { Toolbar } from "./components/Layout/Toolbar";
import { FeedView } from "./components/Feed/FeedView";
import { ThreadView } from "./components/Thread/ThreadView";
import { LoginModal } from "./components/Auth/LoginModal";
import type { FeedType } from "./types/hn";
import type { FavMeta } from "./components/Feed/FeedView";
import { Icon } from "./components/Shared/Icon";

export default function App() {
  const { dark, accent, defaultFeed } = useSettingsStore();
  const baseTheme = THEMES[dark ? "dark" : "light"];
  const theme = useMemo(() => ({ ...baseTheme, accent: accent || baseTheme.accent }), [baseTheme, accent]);

  const [section, setSection] = useState<FeedType>(defaultFeed);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [favTag, setFavTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favMeta, setFavMeta] = useState<Record<number, FavMeta>>({});
  const [votes, setVotes] = useState<Record<number, number>>({});

  const toggleFav = (id: number) => {
    const wasFav = favorites.has(id);
    setFavorites(prev => { const n = new Set(prev); wasFav ? n.delete(id) : n.add(id); return n; });
    setFavMeta(prev => {
      if (wasFav) { const c = { ...prev }; delete c[id]; return c; }
      return { ...prev, [id]: prev[id] ?? { note: "", tags: ["saved"], savedAt: "just now" } };
    });
  };

  const updateFavNote = (id: number, note: string) =>
    setFavMeta(p => ({ ...p, [id]: { ...(p[id] ?? { tags: ["saved"], savedAt: "just now" }), note } }));

  const updateFavTag = (id: number, tag: string) =>
    setFavMeta(p => {
      const cur = p[id] ?? { note: "", tags: [], savedAt: "just now" };
      const has = cur.tags.includes(tag);
      return { ...p, [id]: { ...cur, tags: has ? cur.tags.filter(x => x !== tag) : [...cur.tags, tag] } };
    });

  const vote = (id: number, delta: number) =>
    setVotes(p => ({ ...p, [id]: (p[id] ?? 0) + delta }));

  useEffect(() => { setPage(0); setSelectedId(null); }, [section]);

  const sectionInfo = SECTIONS.find(s => s.id === section);
  const title = favTag === "all" ? "All saved" : favTag ?? sectionInfo?.label ?? "Top";
  const subtitle = favTag ? `${favorites.size} saved stories` : (sectionInfo?.hint ?? "");

  return (
    <ThemeContext.Provider value={theme}>
      <Desktop>
        <Sidebar section={section} onSection={setSection}
          favTag={favTag} onFavTag={setFavTag}
          favCount={favorites.size} onLoginClick={() => setShowLogin(true)}/>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
          <Toolbar title={title} subtitle={subtitle} search={search} onSearch={setSearch}
            right={
              <button style={{ height: 30, minWidth: 30, padding: "0 10px", borderRadius: 6, border: `1px solid ${theme.rule}`, background: "transparent", color: theme.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: SERIF, fontSize: 13 }}>
                <Icon name="plus" color={theme.ink} size={13}/>Submit
              </button>
            }/>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <FeedView feed={section} selectedId={selectedId} onSelect={setSelectedId}
              favorites={favorites} onToggleFav={toggleFav}
              favoriteMeta={favMeta} page={page} onPageChange={setPage} search={search}/>
            <ThreadView storyId={selectedId}
              isFav={selectedId ? favorites.has(selectedId) : false}
              favMeta={selectedId ? favMeta[selectedId] : undefined}
              onToggleFav={() => selectedId && toggleFav(selectedId)}
              onUpdateFavNote={updateFavNote} onUpdateFavTag={updateFavTag}
              votes={votes} onVote={vote} onLoginRequired={() => setShowLogin(true)}/>
          </div>
        </div>
      </Desktop>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)}/>}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 10.2: Type-check**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 10.3: Smoke test in browser**

```bash
PATH="$HOME/.cargo/bin:$PATH" pnpm dev
```

Open `http://localhost:1420`. Verify:
- Three-pane layout renders with warm background
- Sidebar has 6 feed sections + favorites
- Switching feed tabs loads different stories
- Clicking a story loads its thread with comments
- Dark/light toggle changes theme
- Login modal opens from Sign in button

- [ ] **Step 10.4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire App.tsx — three-pane layout, dark/light, feeds, threads"
```

---

## Task 11: Rust backend

**Files:** `src-tauri/src/keychain.rs`, `src-tauri/src/hn_web.rs`, `src-tauri/src/lib.rs`

- [ ] **Step 11.1: Create `src-tauri/src/keychain.rs`**

```rust
use keyring::Entry;

const SERVICE: &str = "com.mecomic.dev";
const SESSION_KEY: &str = "hn_session";
const USERNAME_KEY: &str = "hn_username";

pub fn save_session(cookie: &str) -> Result<(), String> {
    Entry::new(SERVICE, SESSION_KEY)
        .map_err(|e| e.to_string())?
        .set_password(cookie)
        .map_err(|e| e.to_string())
}

pub fn load_session() -> Option<String> {
    Entry::new(SERVICE, SESSION_KEY).ok()?.get_password().ok()
}

pub fn clear_session() {
    if let Ok(e) = Entry::new(SERVICE, SESSION_KEY) {
        let _ = e.delete_credential();
    }
}

pub fn save_username(username: &str) -> Result<(), String> {
    Entry::new(SERVICE, USERNAME_KEY)
        .map_err(|e| e.to_string())?
        .set_password(username)
        .map_err(|e| e.to_string())
}

pub fn load_username() -> Option<String> {
    Entry::new(SERVICE, USERNAME_KEY).ok()?.get_password().ok()
}

pub fn clear_username() {
    if let Ok(e) = Entry::new(SERVICE, USERNAME_KEY) {
        let _ = e.delete_credential();
    }
}
```

- [ ] **Step 11.2: Create `src-tauri/src/hn_web.rs`**

All HN web scraping and form POSTs live here. Keep isolated so HN markup changes are easy to fix.

```rust
use once_cell::sync::Lazy;
use reqwest::{Client, header};
use scraper::{Html, Selector};
use std::sync::Mutex;
use crate::keychain;

static CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .cookie_store(true)
        .user_agent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36")
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .expect("HTTP client build failed")
});

static SESSION: Lazy<Mutex<Option<String>>> = Lazy::new(|| {
    Mutex::new(keychain::load_session())
});

fn get_session() -> Option<String> {
    SESSION.lock().unwrap().clone()
}

fn set_session(cookie: String) {
    *SESSION.lock().unwrap() = Some(cookie.clone());
    let _ = keychain::save_session(&cookie);
}

fn clear_session_state() {
    *SESSION.lock().unwrap() = None;
    keychain::clear_session();
    keychain::clear_username();
}

fn cookie_header(session: &str) -> String {
    format!("user={}", session)
}

#[tauri::command]
pub async fn hn_login(username: String, password: String) -> Result<(), String> {
    let resp = CLIENT
        .post("https://news.ycombinator.com/login")
        .form(&[("acct", username.as_str()), ("pw", password.as_str()), ("goto", "news")])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let cookie_val = resp.cookies()
        .find(|c| c.name() == "user")
        .map(|c| c.value().to_string());

    match cookie_val {
        Some(val) => {
            set_session(val);
            let _ = keychain::save_username(&username);
            Ok(())
        }
        None => Err("Login failed — bad credentials or HN is unavailable.".to_string()),
    }
}

#[tauri::command]
pub async fn hn_logout() -> Result<(), String> {
    clear_session_state();
    Ok(())
}

#[tauri::command]
pub async fn hn_is_logged_in() -> bool {
    get_session().is_some()
}

#[tauri::command]
pub async fn hn_get_username() -> Option<String> {
    keychain::load_username()
}

#[tauri::command]
pub async fn hn_vote(item_id: u64, direction: String) -> Result<(), String> {
    let session = get_session().ok_or("Not logged in")?;
    let item_url = format!("https://news.ycombinator.com/item?id={}", item_id);
    let html = CLIENT.get(&item_url)
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())?;

    let doc = Html::parse_document(&html);
    let sel_str = format!("a#up_{}", item_id);
    let sel = Selector::parse(&sel_str).map_err(|e| e.to_string())?;
    let href = doc.select(&sel).next()
        .and_then(|el| el.value().attr("href"))
        .ok_or("Vote link not found — item may not be votable")?
        .to_string();

    CLIENT.get(format!("https://news.ycombinator.com{}", href))
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn hn_comment(parent_id: u64, text: String) -> Result<(), String> {
    let session = get_session().ok_or("Not logged in")?;
    let item_url = format!("https://news.ycombinator.com/item?id={}", parent_id);
    let html = CLIENT.get(&item_url)
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())?;

    let doc = Html::parse_document(&html);
    let hmac = doc.select(&Selector::parse("input[name='hmac']").unwrap()).next()
        .and_then(|el| el.value().attr("value"))
        .ok_or("hmac token not found")?.to_string();
    let goto = doc.select(&Selector::parse("input[name='goto']").unwrap()).next()
        .and_then(|el| el.value().attr("value"))
        .unwrap_or("news").to_string();

    let resp = CLIENT.post("https://news.ycombinator.com/comment")
        .header(header::COOKIE, cookie_header(&session))
        .form(&[
            ("parent", parent_id.to_string()),
            ("goto", goto),
            ("text", text),
            ("hmac", hmac),
        ])
        .send().await.map_err(|e| e.to_string())?;

    if resp.status().is_success() || resp.status().is_redirection() {
        Ok(())
    } else {
        Err(format!("Comment failed: HTTP {}", resp.status()))
    }
}

#[tauri::command]
pub async fn hn_submit(title: String, url: Option<String>, text: Option<String>) -> Result<u64, String> {
    let session = get_session().ok_or("Not logged in")?;
    let submit_html = CLIENT.get("https://news.ycombinator.com/submit")
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())?;

    let doc = Html::parse_document(&submit_html);
    let fnid = doc.select(&Selector::parse("input[name='fnid']").unwrap()).next()
        .and_then(|el| el.value().attr("value"))
        .ok_or("fnid not found")?.to_string();
    let fnop = doc.select(&Selector::parse("input[name='fnop']").unwrap()).next()
        .and_then(|el| el.value().attr("value"))
        .unwrap_or("submit-page").to_string();

    let resp = CLIENT.post("https://news.ycombinator.com/r")
        .header(header::COOKIE, cookie_header(&session))
        .form(&[
            ("fnid", fnid),
            ("fnop", fnop),
            ("title", title),
            ("url", url.unwrap_or_default()),
            ("text", text.unwrap_or_default()),
        ])
        .send().await.map_err(|e| e.to_string())?;

    if let Some(loc) = resp.headers().get("location") {
        let loc_str = loc.to_str().unwrap_or("");
        if let Some(id_str) = loc_str.strip_prefix("/item?id=") {
            return id_str.parse::<u64>().map_err(|e| e.to_string());
        }
    }
    Err("Submission may have succeeded but item ID could not be extracted.".to_string())
}
```

- [ ] **Step 11.3: Update `src-tauri/src/lib.rs`**

```rust
mod hn_web;
mod keychain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            hn_web::hn_login,
            hn_web::hn_logout,
            hn_web::hn_is_logged_in,
            hn_web::hn_get_username,
            hn_web::hn_vote,
            hn_web::hn_comment,
            hn_web::hn_submit,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
```

- [ ] **Step 11.4: Check Rust compiles**

```bash
cd /home/nhc/dev/personal/rust/tauri/mecomic/src-tauri
PATH="$HOME/.cargo/bin:$PATH" cargo check 2>&1
```

Expected: warnings OK, zero `error:` lines. First run downloads crates — allow a few minutes.

- [ ] **Step 11.5: Commit**

```bash
git add src-tauri/src/
git commit -m "feat: Rust backend — keychain, hn_web commands (login/logout/vote/comment/submit)"
```

---

## Task 12: Full smoke test and startup auth restore

**Files:** `src/App.tsx` (small addition)

- [ ] **Step 12.1: Add startup auth restore to `src/App.tsx`**

Inside the `App` component, after the state declarations, add:

```typescript
// Restore auth state from keychain on startup
useEffect(() => {
  invoke<boolean>("hn_is_logged_in").then(async (isLoggedIn) => {
    if (!isLoggedIn) return;
    const storedUsername = await invoke<string | null>("hn_get_username");
    if (!storedUsername) return;
    const user = await fetchUser(storedUsername).catch(() => null);
    if (user) setLoggedIn(storedUsername, user.karma);
  }).catch(() => {});
}, []);
```

Import `invoke` from `@tauri-apps/api/core` and `fetchUser` from `./lib/hnApi`, and `useAuthStore` destructured for `setLoggedIn`.

- [ ] **Step 12.2: Run full Tauri dev build**

```bash
cd /home/nhc/dev/personal/rust/tauri/mecomic
PATH="$HOME/.cargo/bin:$PATH" pnpm tauri dev 2>&1
```

Expected:
- Vite starts, Rust compiles (several minutes first time)
- Tauri window opens at 1320×840
- Top Stories loads from HN API
- Clicking story shows thread with recursive comments
- Dark/light toggle works immediately
- Sign in opens modal; signing in with HN credentials updates sidebar footer

- [ ] **Step 12.3: Verify Phase 1 DoD**

Check each item from `CLAUDE.md`:
- [ ] App launches on Ubuntu without errors
- [ ] All 6 feed types load and paginate correctly  
- [ ] Thread view renders full comment tree, collapse/expand works
- [ ] HTML in comments/titles sanitised via DOMPurify (check via SafeHtml component)
- [ ] Settings persist across restarts (Zustand persist to localStorage)
- [ ] Dark/light/system theme toggle works
- [ ] Links open in system browser (via `@tauri-apps/plugin-opener`)
- [ ] `pnpm exec tsc --noEmit` passes clean
- [ ] No `console.error` in normal operation

- [ ] **Step 12.4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 complete — Cervantes HN client, read-only with login"
```

---

## Known Gaps / Phase 2

Intentionally deferred:
- **Upvote wire-through** — `hn_vote` Rust command exists but frontend doesn't call it yet; votes are optimistic local-only
- **Comment submission wire-through** — `hn_comment` exists but `CommentComposer.onPost` is a no-op
- **Settings panel UI** — stores and Rust backend exist; `SettingsView.tsx` component not built
- **Keyboard shortcuts** — `j/k` story nav, `o` open, `f` favorite, `/` search focus
- **Favorites persistence** — in-memory; needs `tauri-plugin-store` wiring
- **Search** — Algolia `https://hn.algolia.com/api/v1/` integration
- **User profile view**
- **Story submission UI** — `hn_submit` Rust command exists; Submit button in toolbar is inert

---

## Self-Review

**Spec coverage:**
- ✅ 6 feed types (top/new/best/ask/show/jobs) — `FEED_ENDPOINTS` + `useFeedPage`
- ✅ Paginate 30 at a time — `useTotalPages` + pagination controls in `FeedView`
- ✅ Story row: rank, title, domain, score, author, age, comment count — `StoryRow`
- ✅ Thread: recursive comments, collapse/expand, HTML sanitised — `CommentNode` + `SafeHtml`
- ✅ dead/deleted items — explicit placeholders in `CommentNode`
- ✅ Login flow (HN web POST → cookie → keychain) — `hn_login` + `LoginModal`
- ✅ Session persisted across restarts — `keychain.rs` + startup restore in `App.tsx`
- ✅ Dark/light theme with warm-paper palette — `THEMES` + `ThemeContext`
- ✅ Links open in system browser — `open()` from `@tauri-apps/plugin-opener`
- ✅ Settings (dark, accent, density, fontScale, itemsPerPage) persisted — Zustand `persist`
- ❌ User profile view — deferred to Phase 2
- ❌ Settings panel UI component — deferred to Phase 2
- ❌ j/k keyboard navigation — deferred to Phase 2

**Placeholder scan:** All steps contain actual code or exact commands. No "TBD" or "fill in later".

**Type consistency:**
- `FavMeta` — defined in `FeedView.tsx`, imported in `StoryRow.tsx`, `StoryHeader.tsx`, `ThreadView.tsx` ✅
- `FAVORITE_TAGS` — exported from `Sidebar.tsx`, imported in `StoryHeader.tsx` ✅
- `SECTIONS` — exported from `Sidebar.tsx`, used in `App.tsx` ✅
- `useItem` — defined in `hooks/useItem.ts`, used in `CommentTree.tsx` and `ThreadView.tsx` ✅
- `useKids` — defined in `hooks/useItem.ts`, used in `CommentNode.tsx` ✅
- `Theme` interface — defined in `theme.ts`, used for `btnGhost`/`btnPrimary` helpers ✅
- `sanitizeHtml` — defined in `lib/sanitize.ts`, called only from `SafeHtml.tsx` ✅
