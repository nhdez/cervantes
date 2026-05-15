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
import type { FavMeta } from "./types/hn";
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
