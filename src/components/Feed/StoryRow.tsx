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
