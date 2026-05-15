import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import { useAlgoliaSearch } from "../../hooks/useAlgoliaSearch";
import { domainFromUrl, timeAgo } from "../../lib/time";
import { useOpenProfile } from "../../contexts/ProfileContext";
import type { AlgoliaStoryResult, AlgoliaCommentResult } from "../../lib/hnApi";

interface AlgoliaSearchViewProps {
  query: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  favorites: Set<number>;
  onToggleFav: (id: number) => void;
}

type Tab = "stories" | "comments";

export function AlgoliaSearchView({ query, selectedId, onSelect, favorites, onToggleFav }: AlgoliaSearchViewProps) {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>("stories");
  const { stories, comments, isLoading } = useAlgoliaSearch(query);

  const tabBtn = (id: Tab, label: string, count: number) => {
    const active = tab === id;
    return (
      <button onClick={() => setTab(id)}
        style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${active ? t.accent : t.rule}`, background: active ? t.accentSoft : "transparent", color: active ? t.accent : t.muted, fontFamily: MONO, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
        {label}
        <span style={{ background: active ? t.accent : t.rule, color: active ? "#FBF6E9" : t.muted, borderRadius: 9, padding: "1px 6px", fontSize: 10 }}>{count}</span>
      </button>
    );
  };

  return (
    <div style={{ width: 420, flexShrink: 0, borderRight: `1px solid ${t.rule}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${t.rule}`, background: t.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon name="search" color={t.accent} size={13}/>
          <span style={{ fontFamily: MONO, fontSize: 11, color: t.muted, letterSpacing: 0.3, textTransform: "uppercase" as const }}>Algolia search</span>
          {isLoading && <span style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft }}>…</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {tabBtn("stories", "Stories", stories.length)}
          {tabBtn("comments", "Comments", comments.length)}
        </div>
      </div>
      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "stories"
          ? stories.map(s => <StoryHitRow key={s.id} hit={s} selected={selectedId === s.id} isFav={favorites.has(s.id)} onSelect={() => onSelect(s.id)} onToggleFav={() => onToggleFav(s.id)}/>)
          : comments.map(c => <CommentHitRow key={c.id} hit={c} selected={selectedId === c.storyId} onSelect={() => onSelect(c.storyId)}/>)
        }
        {!isLoading && tab === "stories" && stories.length === 0 && <Empty/>}
        {!isLoading && tab === "comments" && comments.length === 0 && <Empty/>}
      </div>
    </div>
  );
}

function Empty() {
  const t = useTheme();
  return (
    <div style={{ padding: "40px 20px", textAlign: "center" as const, fontFamily: SERIF, fontSize: 14, color: t.muted, fontStyle: "italic" }}>
      No results
    </div>
  );
}

function StoryHitRow({ hit, selected, isFav, onSelect, onToggleFav }: { hit: AlgoliaStoryResult; selected: boolean; isFav: boolean; onSelect: () => void; onToggleFav: () => void }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const openProfile = useOpenProfile();
  const domain = domainFromUrl(hit.url);

  return (
    <div onClick={onSelect} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: "13px 16px 13px 14px", background: selected ? t.surface : (hover ? t.surfaceAlt : "transparent"), borderBottom: `1px solid ${t.rule}`, cursor: "pointer", borderLeft: selected ? `3px solid ${t.accent}` : "3px solid transparent" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 15, lineHeight: 1.35, color: t.ink, fontWeight: selected ? 600 : 500 }}>{hit.title}</div>
          <div style={{ marginTop: 5, display: "flex", gap: 10, flexWrap: "wrap" as const, fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.2 }}>
            {domain && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="link" color={t.muted} size={11}/>{domain}</span>}
            {hit.score > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="arrow-up" color={t.muted} size={11}/>{hit.score}</span>}
            {hit.descendants > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="chat" color={t.muted} size={11}/>{hit.descendants}</span>}
            <span>{timeAgo(hit.time)}</span>
            <button onClick={e => { e.stopPropagation(); openProfile(hit.by); }}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: MONO, fontSize: 10.5, color: t.muted, textDecoration: "underline", textUnderlineOffset: 2 }}>
              {hit.by}
            </button>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleFav(); }}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, color: isFav ? t.accent : t.mutedSoft, opacity: isFav || hover ? 1 : 0.35, transition: "opacity .15s" }}>
          <Icon name={isFav ? "star-fill" : "star"} size={14} color={isFav ? t.accent : t.muted}/>
        </button>
      </div>
    </div>
  );
}

function CommentHitRow({ hit, selected, onSelect }: { hit: AlgoliaCommentResult; selected: boolean; onSelect: () => void }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const openProfile = useOpenProfile();
  const excerpt = hit.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);

  return (
    <div onClick={onSelect} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: "13px 16px", background: selected ? t.surface : (hover ? t.surfaceAlt : "transparent"), borderBottom: `1px solid ${t.rule}`, cursor: "pointer", borderLeft: selected ? `3px solid ${t.accent}` : "3px solid transparent" }}>
      <div style={{ fontFamily: SERIF, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.5, marginBottom: 6 }}>
        {excerpt}{excerpt.length === 180 ? "…" : ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.2 }}>
        <button onClick={e => { e.stopPropagation(); openProfile(hit.by); }}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: MONO, fontSize: 10.5, color: t.muted, textDecoration: "underline", textUnderlineOffset: 2 }}>
          {hit.by}
        </button>
        <span>{timeAgo(hit.time)}</span>
        {hit.storyTitle && (
          <span style={{ color: t.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 200 }}>
            <Icon name="chat" color={t.accent} size={10}/> {hit.storyTitle}
          </span>
        )}
      </div>
    </div>
  );
}
