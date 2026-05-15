import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeContext, THEMES, SERIF } from "./theme";
import { useSettingsStore } from "./stores/settingsStore";
import { useAuthStore } from "./stores/authStore";
import { Desktop } from "./components/Layout/Desktop";
import { Sidebar, SECTIONS } from "./components/Layout/Sidebar";
import { Toolbar } from "./components/Layout/Toolbar";
import { FeedView } from "./components/Feed/FeedView";
import { ThreadView } from "./components/Thread/ThreadView";
import { LoginModal } from "./components/Auth/LoginModal";
import { SubmitModal } from "./components/Auth/SubmitModal";
import type { FeedType, HNItem, FavMeta } from "./types/hn";
import { Icon } from "./components/Shared/Icon";
import { invoke } from "@tauri-apps/api/core";
import { fetchUser, fetchItem } from "./lib/hnApi";
import { dbLoadFavorites, dbSaveFavorite, dbRemoveFavorite, dbUpdateNote, dbUpdateTags } from "./lib/db";

export default function App() {
  const { dark, accent, defaultFeed } = useSettingsStore();
  const baseTheme = THEMES[dark ? "dark" : "light"];
  const theme = useMemo(() => ({ ...baseTheme, accent: accent || baseTheme.accent }), [baseTheme, accent]);
  const queryClient = useQueryClient();

  const [section, setSection] = useState<FeedType>(defaultFeed);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [favTag, setFavTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favMeta, setFavMeta] = useState<Record<number, FavMeta>>({});
  const [favItems, setFavItems] = useState<Record<number, HNItem>>({});
  const [votes, setVotes] = useState<Record<number, number>>({});

  const { loggedIn, username, setLoggedIn } = useAuthStore();

  // Load persisted favorites from SQLite on startup
  useEffect(() => {
    dbLoadFavorites().then(({ ids, meta, items }) => {
      setFavorites(ids);
      setFavMeta(meta);
      setFavItems(items);
    }).catch(() => {});
  }, []);

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

  // Sync HN favorites whenever user becomes logged in (startup restore or new login)
  useEffect(() => {
    if (!loggedIn || !username) return;
    invoke<number[]>("hn_fetch_favorites", { username })
      .then(async (hnIds) => {
        const newIds = hnIds.filter(id => !favorites.has(id));
        if (newIds.length === 0) return;
        const results = await Promise.allSettled(newIds.map(id => fetchItem(id)));
        const toAdd: Array<{ id: number; item: HNItem }> = [];
        results.forEach((r, i) => {
          if (r.status === "fulfilled") toAdd.push({ id: newIds[i], item: r.value });
        });
        if (toAdd.length === 0) return;
        setFavorites(prev => new Set([...prev, ...toAdd.map(x => x.id)]));
        setFavMeta(prev => {
          const next = { ...prev };
          for (const { id } of toAdd) {
            if (!next[id]) next[id] = { note: "", tags: ["saved"], savedAt: new Date().toISOString() };
          }
          return next;
        });
        setFavItems(prev => {
          const next = { ...prev };
          for (const { id, item } of toAdd) next[id] = item;
          return next;
        });
        for (const { id, item } of toAdd) {
          await dbSaveFavorite(id, item).catch(() => {});
        }
      })
      .catch(() => {});
  }, [loggedIn, username]);

  const toggleFav = (id: number) => {
    const wasFav = favorites.has(id);
    setFavorites(prev => { const n = new Set(prev); wasFav ? n.delete(id) : n.add(id); return n; });
    setFavMeta(prev => {
      if (wasFav) { const c = { ...prev }; delete c[id]; return c; }
      return { ...prev, [id]: prev[id] ?? { note: "", tags: ["saved"], savedAt: new Date().toISOString() } };
    });
    if (wasFav) {
      dbRemoveFavorite(id).catch(() => {});
      setFavItems(prev => { const c = { ...prev }; delete c[id]; return c; });
    } else {
      const cached = queryClient.getQueryData<HNItem>(["item", id]);
      if (cached) {
        dbSaveFavorite(id, cached).catch(() => {});
        setFavItems(prev => ({ ...prev, [id]: cached }));
      } else {
        fetchItem(id).then(item => {
          dbSaveFavorite(id, item).catch(() => {});
          setFavItems(prev => ({ ...prev, [id]: item }));
        }).catch(() => {});
      }
    }
  };

  const updateFavNote = (id: number, note: string) => {
    setFavMeta(p => ({ ...p, [id]: { ...(p[id] ?? { tags: ["saved"], savedAt: new Date().toISOString() }), note } }));
    dbUpdateNote(id, note).catch(() => {});
  };

  const updateFavTag = (id: number, tag: string) => {
    setFavMeta(p => {
      const cur = p[id] ?? { note: "", tags: [], savedAt: new Date().toISOString() };
      const has = cur.tags.includes(tag);
      const next = { ...cur, tags: has ? cur.tags.filter(x => x !== tag) : [...cur.tags, tag] };
      dbUpdateTags(id, next.tags).catch(() => {});
      return { ...p, [id]: next };
    });
  };

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
            right={loggedIn ? (
              <button onClick={() => setShowSubmit(true)} style={{ height: 30, minWidth: 30, padding: "0 10px", borderRadius: 6, border: `1px solid ${theme.rule}`, background: "transparent", color: theme.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: SERIF, fontSize: 13 }}>
                <Icon name="plus" color={theme.ink} size={13}/>Submit
              </button>
            ) : undefined}/>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <FeedView feed={section} selectedId={selectedId} onSelect={setSelectedId}
              favorites={favorites} onToggleFav={toggleFav}
              favoriteMeta={favMeta} page={page} onPageChange={setPage} search={search}
              favTag={favTag} favItems={favItems}/>
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
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)}/>}
    </ThemeContext.Provider>
  );
}
