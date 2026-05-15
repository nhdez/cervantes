import { useState } from "react";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { Icon } from "../Shared/Icon";
import { Tag } from "../Shared/Tag";
import { SafeHtml } from "../Shared/SafeHtml";
import { domainFromUrl, timeAgo } from "../../lib/time";
import { FAVORITE_TAGS } from "../Layout/Sidebar";
import type { HNItem, FavMeta } from "../../types/hn";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useOpenProfile } from "../../contexts/ProfileContext";

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
  const openProfile = useOpenProfile();
  const domain = domainFromUrl(story.url);
  const v = votes[story.id] ?? 0;
  const voted = v > 0;
  const total = (story.score ?? 0) + v;
  const openSource = async () => { if (story.url) await openUrl(story.url); };

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
        <button onClick={() => story.by && openProfile(story.by)}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: MONO, fontSize: 11, color: t.inkSoft, letterSpacing: 0.2 }}>
          by {story.by}
        </button>
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
