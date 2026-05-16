# Changelog

All notable changes to Cervantes are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.1] — 2026-05-16

### Added
- **Word replacements** — a new Filters panel (sidebar) lets you define any number of find → replace rules. Matched words are replaced and highlighted in the theme accent colour across story titles, comment text, and story body text. Rules persist across restarts (SQLite).

---

## [0.1.0] — 2026-05-15

Initial release.

### Added
- All six HN feeds (Top, New, Best, Ask HN, Show HN, Jobs) with pagination
- Full thread view with recursive comment trees, collapse/expand, and upvoting
- Algolia-powered search embedded in the app — Stories and Comments tabs, no redirect to hn.algolia.com
- Favorites — save stories, tag them (Read Later, Tools, Deep Dives, Saved), add private notes, auto-sync from your HN account on login
- Notes — attach a note to any story or comment; browse and search all notes in the Notes tab
- User profiles — click any username to open their profile, follow users, read their recent activity in the Following feed
- Feed freshness — background poller tracks front-page position changes every 5 minutes; ▲/▼ trending indicators per story row; refresh button highlights when new content is detected
- Dark and light themes with a single toggle; accent colour carries across both
- `Ctrl/Cmd+K` to focus search from anywhere
- HN account login with session persisted in the OS keychain
- Story submission (requires login)
- All external links open in the system browser
- Linux packages: `.deb`, `.AppImage`, `.rpm`
