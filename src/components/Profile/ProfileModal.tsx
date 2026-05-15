import { useQuery } from "@tanstack/react-query";
import { useTheme, SERIF, MONO } from "../../theme";
import { useUser } from "../../hooks/useUser";
import { fetchUserStories } from "../../lib/hnApi";
import { SafeHtml } from "../Shared/SafeHtml";
import { Icon } from "../Shared/Icon";
import { timeAgo, domainFromUrl } from "../../lib/time";

interface ProfileModalProps {
  username: string;
  onClose: () => void;
  following: Set<string>;
  onToggleFollow: (username: string) => void;
  onSelectStory: (id: number) => void;
}

export function ProfileModal({ username, onClose, following, onToggleFollow, onSelectStory }: ProfileModalProps) {
  const t = useTheme();
  const isFollowing = following.has(username);

  const { data: user, isPending: userLoading } = useUser(username);

  const { data: stories, isPending: storiesLoading } = useQuery({
    queryKey: ["user-stories", username],
    queryFn: () => fetchUserStories(username, 10),
    staleTime: 5 * 60_000,
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 520, maxHeight: "82vh", background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 14, boxShadow: "0 28px 80px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "26px 28px 20px", borderBottom: `1px solid ${t.rule}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Avatar */}
            <div style={{ width: 54, height: 54, borderRadius: 12, background: t.accentSoft, border: `1px solid ${t.rule}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: t.accent, flexShrink: 0, letterSpacing: -0.5 }}>
              {username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: t.ink, letterSpacing: -0.3 }}>{username}</h2>
                <button
                  onClick={() => onToggleFollow(username)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, border: `1px solid ${isFollowing ? t.accent : t.rule}`, background: isFollowing ? t.accentSoft : "transparent", color: isFollowing ? t.accent : t.inkSoft, fontFamily: SERIF, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Icon name={isFollowing ? "check" : "users"} size={11} color={isFollowing ? t.accent : t.inkSoft}/>
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
              {!userLoading && user && (
                <div style={{ marginTop: 7, display: "flex", gap: 14, fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.2, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="arrow-up" size={10} color={t.muted}/>{user.karma.toLocaleString()} karma
                  </span>
                  <span>joined {timeAgo(user.created)}</span>
                  {user.submitted && (
                    <span>{user.submitted.length.toLocaleString()} submissions</span>
                  )}
                </div>
              )}
              {userLoading && (
                <div style={{ marginTop: 7, fontFamily: MONO, fontSize: 10.5, color: t.muted }}>Loading…</div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: t.muted, padding: 4, flexShrink: 0 }}
            >
              <Icon name="x" size={16} color={t.muted}/>
            </button>
          </div>

          {user?.about && (
            <SafeHtml
              html={user.about}
              style={{ marginTop: 14, fontFamily: SERIF, fontSize: 14, lineHeight: 1.6, color: t.inkSoft, paddingLeft: 70 }}
            />
          )}
        </div>

        {/* Recent stories */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
          <div style={{ padding: "14px 28px 8px", fontFamily: MONO, fontSize: 10, letterSpacing: 0.6, color: t.mutedSoft, textTransform: "uppercase" }}>
            Recent stories
          </div>

          {storiesLoading && (
            <div style={{ padding: "12px 28px", fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: t.muted }}>Loading…</div>
          )}

          {!storiesLoading && (!stories || stories.length === 0) && (
            <div style={{ padding: "12px 28px", fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: t.muted }}>No recent stories.</div>
          )}

          {stories?.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { onSelectStory(s.id); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "11px 28px", borderBottom: i < stories.length - 1 ? `1px solid ${t.rule}` : "none" }}
            >
              <div style={{ fontFamily: SERIF, fontSize: 14, color: t.ink, fontWeight: 500, lineHeight: 1.35 }}>{s.title}</div>
              <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 10.5, color: t.muted, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Icon name="arrow-up" size={10} color={t.muted}/>{s.score ?? 0}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <Icon name="chat" size={10} color={t.muted}/>{s.descendants ?? 0}
                </span>
                <span>{timeAgo(s.time)}</span>
                {s.url && <span>{domainFromUrl(s.url)}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
