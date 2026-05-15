import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTheme, SERIF, MONO, Theme } from "../../theme";
import { useAuthStore } from "../../stores/authStore";
import { fetchUser } from "../../lib/hnApi";

function btnPrimary(t: Theme) { return { display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, padding: "8px 20px", borderRadius: 6, border: `1px solid ${t.accent}`, background: t.accent, color: "#FBF6E9", fontFamily: SERIF, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" as const }; }

export function LoginModal({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { setLoggedIn } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await invoke("hn_login", { username: username.trim(), password });
      const user = await fetchUser(username.trim());
      setLoggedIn(username.trim(), user.karma);
      onClose();
    } catch (e) {
      setError(typeof e === "string" ? e : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 360, background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 12, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <h2 style={{ margin: "0 0 6px", fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: -0.3 }}>Sign in to HN</h2>
        <p style={{ margin: "0 0 24px", fontFamily: MONO, fontSize: 11, color: t.muted, letterSpacing: 0.3 }}>
          Your password is sent to news.ycombinator.com and never stored on disk.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
            style={{ height: 38, padding: "0 12px", border: `1px solid ${t.rule}`, borderRadius: 6, background: t.bg, color: t.ink, fontFamily: SERIF, fontSize: 14, outline: "none" }}/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" onKeyDown={e => e.key === "Enter" && submit()}
            style={{ height: 38, padding: "0 12px", border: `1px solid ${t.rule}`, borderRadius: 6, background: t.bg, color: t.ink, fontFamily: SERIF, fontSize: 14, outline: "none" }}/>
        </div>
        {error && <p style={{ marginTop: 12, fontFamily: SERIF, fontSize: 13, color: t.warn }}>{error}</p>}
        <button style={{ ...btnPrimary(t), marginTop: 20, opacity: loading ? 0.7 : 1 }}
          disabled={loading} onClick={submit}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
