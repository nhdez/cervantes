import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import type { FeedType } from "../../types/hn";
import { useAuthStore } from "../../stores/authStore";

export interface FavTag { id: string; label: string; color: string; }

export const SECTIONS: { id: FeedType; label: string; hint: string }[] = [
  { id: "top",  label: "Top",     hint: "Front page" },
  { id: "new",  label: "New",     hint: "Newest" },
  { id: "best", label: "Best",    hint: "Highest-voted recently" },
  { id: "ask",  label: "Ask HN",  hint: "Questions" },
  { id: "show", label: "Show HN", hint: "Projects" },
  { id: "jobs", label: "Jobs",    hint: "Hiring" },
];

export const FAVORITE_TAGS: FavTag[] = [
  { id: "read-later", label: "Read later",  color: "warn" },
  { id: "tools",      label: "Tools",       color: "accent" },
  { id: "deep-dive",  label: "Deep dives",  color: "ink" },
  { id: "saved",      label: "Saved",       color: "muted" },
];

interface SidebarProps {
  section: FeedType; onSection: (s: FeedType) => void;
  favTag: string | null; onFavTag: (t: string | null) => void;
  favCount: number; onLoginClick: () => void;
  showFollowing: boolean; onShowFollowing: () => void;
  followingCount: number;
}

export function Sidebar({ section, onSection, favTag, onFavTag, favCount, onLoginClick, showFollowing, onShowFollowing, followingCount }: SidebarProps) {
  const t = useTheme();
  const { loggedIn, username, karma } = useAuthStore();

  return (
    <div style={{ width: 232, flexShrink: 0, height: "100%", background: t.surface, borderRight: `1px solid ${t.rule}`, display: "flex", flexDirection: "column", fontFamily: SERIF }}>
      {/* Brand */}
      <div style={{ padding: "18px 18px 14px" }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: t.ink, lineHeight: 1 }}>
          Cervantes<span style={{ color: t.accent }}>.</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, color: t.mutedSoft, marginTop: 4, textTransform: "uppercase" as const }}>
          A reader for Hacker News
        </div>
      </div>
      {/* Sections */}
      <SidebarSectionHeader label="Feeds" />
      <div style={{ padding: "0 8px" }}>
        {SECTIONS.map(s => (
          <SidebarItem key={s.id} label={s.label} selected={section === s.id && !favTag && !showFollowing}
            onClick={() => { onSection(s.id); onFavTag(null); }}/>
        ))}
      </div>
      {/* Favorites */}
      <div style={{ marginTop: 18 }}>
        <SidebarSectionHeader label="Favorites"
          right={<span style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft }}>{favCount}</span>}/>
        <div style={{ padding: "0 8px" }}>
          <SidebarItem label="All saved" iconName="star-fill" iconColor={t.accent}
            selected={favTag === "all" && !showFollowing} onClick={() => onFavTag("all")} count={favCount}/>
          {FAVORITE_TAGS.map(tg => (
            <SidebarItem key={tg.id} label={tg.label} iconName="tag"
              iconColor={(t as unknown as Record<string, string>)[tg.color] || t.muted}
              selected={favTag === tg.id && !showFollowing} onClick={() => onFavTag(tg.id)}/>
          ))}
        </div>
      </div>
      {/* Following */}
      <div style={{ marginTop: 18 }}>
        <SidebarSectionHeader label="Social"/>
        <div style={{ padding: "0 8px" }}>
          <SidebarItem label="Following" iconName="users" iconColor={t.accent}
            selected={showFollowing} onClick={onShowFollowing} count={followingCount}/>
        </div>
      </div>
      <div style={{ flex: 1 }}/>
      {/* User footer */}
      <div style={{ borderTop: `1px solid ${t.rule}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        {loggedIn && username ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: t.accentSoft, color: t.accent, fontFamily: SERIF, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.rule}` }}>
              {username[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontFamily: SERIF, fontSize: 13, color: t.ink, fontWeight: 500 }}>{username}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.muted }}>{karma?.toLocaleString()} karma</div>
            </div>
          </>
        ) : (
          <button onClick={onLoginClick} style={{ border: `1px solid ${t.rule}`, background: "transparent", borderRadius: 6, padding: "5px 12px", fontFamily: SERIF, fontSize: 13, color: t.inkSoft, cursor: "pointer" }}>
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarSectionHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ padding: "8px 18px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, letterSpacing: 0.6, color: t.mutedSoft, textTransform: "uppercase" as const }}>
      <span>{label}</span>{right}
    </div>
  );
}

function SidebarItem({ label, count, selected, onClick, iconName, iconColor }: { label: string; count?: number; selected: boolean; onClick: () => void; iconName?: string; iconColor?: string }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer", background: selected ? t.surfaceAlt : (hover ? t.surfaceAlt : "transparent"), color: selected ? t.ink : t.inkSoft, padding: "6px 10px", borderRadius: 6, margin: "1px 0", display: "flex", alignItems: "center", gap: 8, fontFamily: SERIF, fontSize: 14, fontWeight: selected ? 600 : 400, position: "relative" }}>
      {selected && <div style={{ position: "absolute", left: -8, top: 6, bottom: 6, width: 2, background: t.accent, borderRadius: 1 }}/>}
      {iconName ? <Icon name={iconName} color={iconColor || t.muted} size={13}/> : <div style={{ width: 6, height: 6, borderRadius: 1, background: t.mutedSoft, opacity: selected ? 1 : 0.5 }}/>}
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span style={{ fontFamily: MONO, fontSize: 10, color: t.muted }}>{count}</span>}
    </button>
  );
}
