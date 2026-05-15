# Cervantes

A native Hacker News client for Linux (and macOS/Windows), built with [Tauri 2](https://tauri.app), React 19, and TypeScript.

<img width="1338" height="858" alt="image" src="https://github.com/user-attachments/assets/fa567791-50e9-4738-aab9-b256786302f6" />

## Features

- **All six HN feeds** — Top, New, Best, Ask, Show, Jobs with pagination
- **Full thread view** — recursive comment trees, collapse/expand, upvoting
- **Algolia search** — live Stories and Comments tabs powered by the HN Algolia API, embedded in the app
- **Favorites** — save stories, tag them (Read Later, Interesting, etc.), add private notes, sync from your HN account
- **Notes** — attach a note to any story or comment; browse all notes in the Notes tab
- **Profiles** — click any username to open their profile, follow users, read their activity in the Following feed
- **Feed freshness** — background poller tracks position changes every 5 minutes; trending ▲/▼ indicators on every row
- **Keyboard shortcut** — `Ctrl/Cmd+K` to focus search from anywhere
- **Dark and light themes** — toggle in one click
- **Links open in your system browser**

## Requirements

- Ubuntu 22.04+ (or any distro with `webkit2gtk-4.1`)
- Node 20+ and pnpm
- Rust toolchain (stable)
- Tauri CLI v2: `cargo install tauri-cli --version "^2"`

```bash
# Ubuntu system deps (if not already present)
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

## Getting started

```bash
git clone https://github.com/nhdez/cervantes
cd cervantes
pnpm install
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
# Output: src-tauri/target/release/bundle/{deb,rpm,appimage}/
```

Pre-built `.deb` and `.AppImage` packages for Linux x86_64 are attached to each [release](https://github.com/nhdez/cervantes/releases).

## Project layout

```
src/                    React + TypeScript frontend
  components/
    Feed/               Story list, Algolia search view
    Thread/             Story header, comment tree
    Layout/             Sidebar, toolbar, desktop shell
    Auth/               Login and submit modals
    Notes/              Notes list view
    Profile/            User profile modal
  hooks/                React Query hooks, feed poller, Algolia search
  lib/                  HN Firebase API, Algolia helpers, SQLite helpers
  stores/               Zustand (auth + settings)
  contexts/             Profile, Note, Thread React contexts
  types/                Shared TypeScript types
src-tauri/              Rust backend
  src/
    lib.rs              Tauri commands, plugin setup, SQLite migrations
    hn_web.rs           HN web scraping (login, vote, comment, submit, favorites)
    keychain.rs         OS keychain session persistence
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri 2 |
| Frontend | React 19, TypeScript, Vite |
| State | Zustand (auth/settings), TanStack Query v5 (server data) |
| Persistence | tauri-plugin-sql (SQLite) |
| HTTP | tauri-plugin-http (frontend), reqwest (Rust backend) |
| HN reads | Firebase REST API + Algolia HN search |
| HN writes | Web scraping via reqwest + scraper |
| Keychain | keyring crate |
| HTML sanitisation | DOMPurify |

## License

MIT — see [LICENSE](LICENSE).
