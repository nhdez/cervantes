import { useState } from "react";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { useAuthStore } from "../../stores/authStore";

function btnGhost(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 12px", borderRadius: 6, border: `1px solid ${t.rule}`, background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 13, fontWeight: 500, cursor: "pointer" }; }
function btnPrimary(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 13, fontWeight: 600, cursor: "pointer" }; }

interface CommentComposerProps {
  onPost: (text: string) => void;
  onLoginRequired: () => void;
}

export function CommentComposer({ onPost, onLoginRequired }: CommentComposerProps) {
  const t = useTheme();
  const { loggedIn, username } = useAuthStore();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const filled = text.trim().length > 0;

  if (!loggedIn) {
    return (
      <div style={{ marginTop: 28, padding: "14px 16px", background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: SERIF, fontSize: 14, color: t.muted }}>Sign in to join the discussion.</span>
        <button onClick={onLoginRequired} style={btnGhost(t)}>Sign in</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ border: `1px solid ${focused ? t.accent : t.rule}`, background: t.surface, borderRadius: 8, padding: "10px 12px", transition: "border-color .15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: t.accentSoft, color: t.accent, fontFamily: SERIF, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.3 }}>
            commenting as <span style={{ color: t.inkSoft }}>{username}</span>
          </span>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Add to the conversation…"
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: t.ink, fontFamily: SERIF, fontSize: 15, lineHeight: 1.55, resize: "vertical", minHeight: focused || filled ? 90 : 38, transition: "min-height .15s" }}/>
        {(focused || filled) && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: `1px solid ${t.rule}` }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft }}>**bold** *italic* `code`</span>
            <div style={{ flex: 1 }}/>
            <button style={btnGhost(t)} onClick={() => setText("")}>Discard</button>
            <button style={{ ...btnPrimary(t), opacity: filled ? 1 : 0.5, cursor: filled ? "pointer" : "default" }}
              disabled={!filled} onClick={() => { onPost(text); setText(""); }}>Post comment</button>
          </div>
        )}
      </div>
    </div>
  );
}
