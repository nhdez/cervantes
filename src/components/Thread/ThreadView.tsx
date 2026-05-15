import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { useItem } from "../../hooks/useItem";
import { StoryHeader } from "./StoryHeader";
import { CommentTree } from "./CommentTree";
import { CommentComposer } from "./CommentComposer";
import type { FavMeta } from "../../types/hn";

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
