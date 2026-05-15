import { useState } from "react";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { Icon } from "../Shared/Icon";
import { SafeHtml } from "../Shared/SafeHtml";
import { timeAgo } from "../../lib/time";
import type { HNItem } from "../../types/hn";
import { useKids } from "../../hooks/useItem";
import { useAuthStore } from "../../stores/authStore";
import { useOpenProfile } from "../../contexts/ProfileContext";
import { useNotes } from "../../contexts/NoteContext";
import { useCurrentThread } from "../../contexts/ThreadContext";

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
  const openProfile = useOpenProfile();
  const { notes, saveNote, deleteNote } = useNotes();
  const thread = useCurrentThread();
  const [noting, setNoting] = useState(false);
  const existingNote = notes[comment.id];
  const [noteText, setNoteText] = useState(existingNote?.body ?? "");
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
            <button onClick={() => comment.by && openProfile(comment.by)}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: t.ink, letterSpacing: 0 }}>
              {comment.by}
            </button>
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
                <button onClick={() => { setNoteText(existingNote?.body ?? ""); setNoting(!noting); }}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: MONO, fontSize: 10.5, textDecoration: "underline", textUnderlineOffset: 2, color: t.muted }}>
                  {existingNote ? "note ✎" : "note"}
                </button>
              </div>
              {noting && (
                <div style={{ marginTop: 10, border: `1px solid ${t.rule}`, borderRadius: 6, background: t.surface, padding: 10 }}>
                  <textarea autoFocus value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note…"
                    style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 13, lineHeight: 1.5, resize: "vertical", minHeight: 56 }}/>
                  <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      {existingNote && (
                        <button style={btnGhost(t)} onClick={() => { deleteNote(comment.id); setNoting(false); }}>
                          Delete
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={btnGhost(t)} onClick={() => setNoting(false)}>Cancel</button>
                      <button style={btnPrimary(t)} onClick={() => {
                        if (!noteText.trim()) return;
                        const excerpt = (comment.text ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
                        saveNote({ itemId: comment.id, itemType: "comment", itemTitle: excerpt, storyId: thread?.id ?? 0, storyTitle: thread?.title ?? "" , body: noteText.trim() });
                        setNoting(false);
                      }}>Save</button>
                    </div>
                  </div>
                </div>
              )}
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
                <ChildComments parentId={comment.id} ids={comment.kids!} depth={depth} votes={votes} onVote={onVote}/>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChildComments({ parentId, ids, depth, votes, onVote }: { parentId: number; ids: number[]; depth: number; votes: Record<number, number>; onVote: (id: number, delta: number) => void }) {
  const t = useTheme();
  const { data: kids, isLoading } = useKids(parentId, ids);
  if (isLoading) return <div style={{ paddingLeft: 14, marginTop: 8, fontFamily: SERIF, fontSize: 12, color: t.muted, fontStyle: "italic" }}>Loading replies…</div>;
  if (!kids) return null;
  return (
    <div style={{ marginTop: 6, paddingLeft: 14, borderLeft: `1px solid ${t.rule}`, marginLeft: -8 }}>
      {kids.map(child => <CommentNode key={child.id} comment={child} depth={depth + 1} votes={votes} onVote={onVote}/>)}
    </div>
  );
}
