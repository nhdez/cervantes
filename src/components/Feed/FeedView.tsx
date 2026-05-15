import { useTheme, SERIF, MONO } from "../../theme";
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
