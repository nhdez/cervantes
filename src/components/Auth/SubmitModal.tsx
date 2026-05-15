import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTheme, SERIF, MONO, Theme } from "../../theme";

function btnPrimary(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, padding: "8px 20px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 14, fontWeight: 600, cursor: "pointer" }; }
function btnGhost(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, padding: "8px 16px", borderRadius: 6, border: `1px solid ${t.rule}`, background: "transparent", color: t.inkSoft, fontFamily: SERIF, fontSize: 14, fontWeight: 500, cursor: "pointer" }; }

interface SubmitModalProps {
  onClose: () => void;
  onSubmitted?: (id: number) => void;
}

export function SubmitModal({ onClose, onSubmitted }: SubmitModalProps) {
  const t = useTheme();
  const [mode, setMode] = useState<"url" | "text">("url");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (mode === "url" && !url.trim()) { setError("URL is required for link submissions."); return; }
    if (mode === "text" && !text.trim()) { setError("Text is required for text submissions."); return; }
    setLoading(true);
    setError(null);
    try {
      const id = await invoke<number>("hn_submit", {
        title: title.trim(),
        url: mode === "url" ? url.trim() : null,
        text: mode === "text" ? text.trim() : null,
      });
      onSubmitted?.(id);
      onClose();
    } catch (e) {
      setError(typeof e === "string" ? e : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: "7px 0", border: "none", borderBottom: `2px solid ${active ? t.accent : "transparent"}`,
    background: "transparent", color: active ? t.ink : t.muted, fontFamily: SERIF, fontSize: 13,
    fontWeight: active ? 600 : 400, cursor: "pointer",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 480, background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 12, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <h2 style={{ margin: "0 0 4px", fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: -0.3 }}>Submit to Hacker News</h2>
        <p style={{ margin: "0 0 20px", fontFamily: MONO, fontSize: 11, color: t.muted, letterSpacing: 0.3 }}>
          Submissions appear on HN under your account.
        </p>

        {/* Mode tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${t.rule}`, marginBottom: 20 }}>
          <button style={tabStyle(mode === "url")} onClick={() => setMode("url")}>Link</button>
          <button style={tabStyle(mode === "text")} onClick={() => setMode("text")}>Ask / Text</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, color: t.muted, textTransform: "uppercase", marginBottom: 5 }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder={mode === "text" ? "Ask HN: …" : "Title of the article"}
              style={{ width: "100%", height: 38, padding: "0 12px", border: `1px solid ${t.rule}`, borderRadius: 6, background: t.bg, color: t.ink, fontFamily: SERIF, fontSize: 14, outline: "none", boxSizing: "border-box" }}/>
          </div>

          {mode === "url" ? (
            <div>
              <label style={{ display: "block", fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, color: t.muted, textTransform: "uppercase", marginBottom: 5 }}>URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://…"
                style={{ width: "100%", height: 38, padding: "0 12px", border: `1px solid ${t.rule}`, borderRadius: 6, background: t.bg, color: t.ink, fontFamily: SERIF, fontSize: 14, outline: "none", boxSizing: "border-box" }}/>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, color: t.muted, textTransform: "uppercase", marginBottom: 5 }}>Text</label>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="Your question or discussion prompt…"
                rows={5}
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${t.rule}`, borderRadius: 6, background: t.bg, color: t.ink, fontFamily: SERIF, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }}/>
            </div>
          )}
        </div>

        {error && <p style={{ marginTop: 12, fontFamily: SERIF, fontSize: 13, color: t.warn }}>{error}</p>}

        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={btnGhost(t)} onClick={onClose}>Cancel</button>
          <button style={{ ...btnPrimary(t), opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={submit}>
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
