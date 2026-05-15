// Cervantes — HN reader components
// Themes, window chrome, sidebar, story rows, comment tree, composer
const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Theme tokens
// ─────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:        "#EFE8D9",   // warm paper
    surface:   "#F5F0E2",   // panel
    surfaceAlt:"#E8E0CE",   // hover / list active
    rule:      "#D8CFB9",   // hairlines
    ink:       "#2A2520",   // primary text
    inkSoft:   "#4B4339",   // secondary
    muted:     "#7A6F5E",   // metadata
    mutedSoft: "#988C77",   // very quiet
    accent:    "oklch(0.58 0.14 45)",
    accentSoft:"oklch(0.92 0.04 60)",
    warn:      "oklch(0.62 0.13 70)",
    good:      "oklch(0.55 0.10 145)",
    shadow:    "0 1px 0 rgba(0,0,0,0.04)",
  },
  dark: {
    bg:        "#1B1814",
    surface:   "#24201A",
    surfaceAlt:"#2E2922",
    rule:      "#3A3429",
    ink:       "#E8E0CE",
    inkSoft:   "#C9BFA8",
    muted:     "#948B7C",
    mutedSoft: "#6D6557",
    accent:    "oklch(0.72 0.14 50)",
    accentSoft:"oklch(0.34 0.06 50)",
    warn:      "oklch(0.74 0.12 75)",
    good:      "oklch(0.68 0.10 145)",
    shadow:    "0 1px 0 rgba(0,0,0,0.3)",
  },
};

const SERIF = '"Source Serif 4", "Source Serif Pro", Charter, "Iowan Old Style", Georgia, serif';
const MONO  = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace';

// ─────────────────────────────────────────────────────────────
// Traffic lights — themed
// ─────────────────────────────────────────────────────────────
function TrafficLights({ t }) {
  const dot = (bg) => (
    <div style={{
      width: 12, height: 12, borderRadius: "50%", background: bg,
      border: "0.5px solid rgba(0,0,0,0.15)",
    }} />
  );
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {dot("#ff5f57")}{dot("#febc2e")}{dot("#28c840")}
    </div>
  );
}

// Small inline icons (stroked, minimal — no detailed SVG)
function Icon({ name, size = 14, color = "currentColor" }) {
  const s = size;
  const stroke = { stroke: color, strokeWidth: 1.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "star":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5l3.8-.5L8 2.5z"/></svg>;
    case "star-fill":return <svg width={s} height={s} viewBox="0 0 16 16"><path fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" d="M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2 4.6 13l.7-3.8L2.5 6.5l3.8-.5L8 2.5z"/></svg>;
    case "arrow-up": return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 12V4M4.5 7.5L8 4l3.5 3.5"/></svg>;
    case "chat":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 4h10v7H7l-3 2.5V11H3z"/></svg>;
    case "link":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M9.5 6.5l-3 3M6.5 4.5l-2 2a2.5 2.5 0 003.5 3.5l1-1M9.5 11.5l2-2a2.5 2.5 0 00-3.5-3.5l-1 1"/></svg>;
    case "sun":      return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="8" cy="8" r="2.5"/><path {...stroke} d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>;
    case "moon":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M13 9.5A5 5 0 016.5 3a5.5 5.5 0 1 0 6.5 6.5z"/></svg>;
    case "search":   return <svg width={s} height={s} viewBox="0 0 16 16"><circle {...stroke} cx="7" cy="7" r="4"/><path {...stroke} d="M10 10l3 3"/></svg>;
    case "plus":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M8 3v10M3 8h10"/></svg>;
    case "back":     return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M10 3L5 8l5 5"/></svg>;
    case "tag":      return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 3h5l5 5-5 5-5-5V3z"/><circle cx="6" cy="6" r="0.8" fill={color}/></svg>;
    case "reply":    return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M6 4L2 7.5 6 11M2.5 7.5H10a3.5 3.5 0 013.5 3.5V13"/></svg>;
    case "more":     return <svg width={s} height={s} viewBox="0 0 16 16"><circle cx="4" cy="8" r="1" fill={color}/><circle cx="8" cy="8" r="1" fill={color}/><circle cx="12" cy="8" r="1" fill={color}/></svg>;
    case "check":    return <svg width={s} height={s} viewBox="0 0 16 16"><path {...stroke} d="M3 8.5L6.5 12 13 5"/></svg>;
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({ t, section, onSection, favTag, onFavTag, favCount }) {
  return (
    <div style={{
      width: 232, flexShrink: 0, height: "100%",
      background: t.surface,
      borderRight: `1px solid ${t.rule}`,
      display: "flex", flexDirection: "column",
      fontFamily: SERIF,
    }}>
      {/* window controls row */}
      <div style={{
        height: 44, padding: "0 16px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <TrafficLights t={t}/>
      </div>

      {/* Brand */}
      <div style={{ padding: "6px 18px 14px" }}>
        <div style={{
          fontFamily: SERIF, fontSize: 22, fontWeight: 600, letterSpacing: -0.3,
          color: t.ink, lineHeight: 1,
        }}>
          Cervantes
          <span style={{ color: t.accent }}>.</span>
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: 0.5,
          color: t.mutedSoft, marginTop: 4, textTransform: "uppercase",
        }}>A reader for Hacker News</div>
      </div>

      {/* Sections */}
      <SidebarSectionHeader t={t} label="Feeds" />
      <div style={{ padding: "0 8px" }}>
        {SECTIONS.map(s => (
          <SidebarItem
            key={s.id} t={t}
            label={s.label}
            count={s.count}
            selected={section === s.id && !favTag}
            onClick={() => { onSection(s.id); onFavTag(null); }}
          />
        ))}
      </div>

      {/* Favorites */}
      <div style={{ marginTop: 18 }}>
        <SidebarSectionHeader t={t} label="Favorites" right={
          <span style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft }}>{favCount}</span>
        }/>
        <div style={{ padding: "0 8px" }}>
          <SidebarItem t={t} label="All saved" iconName="star-fill" iconColor={t.accent}
            selected={favTag === "all"} onClick={() => onFavTag("all")} count={favCount}/>
          {FAVORITE_TAGS.map(tg => (
            <SidebarItem
              key={tg.id} t={t}
              label={tg.label}
              iconName="tag"
              iconColor={t[tg.color] || t.muted}
              selected={favTag === tg.id}
              onClick={() => onFavTag(tg.id)}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Footer — user */}
      <div style={{
        borderTop: `1px solid ${t.rule}`, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: t.accentSoft, color: t.accent,
          fontFamily: SERIF, fontWeight: 600, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${t.rule}`,
        }}>P</div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: SERIF, fontSize: 13, color: t.ink, fontWeight: 500 }}>polaris_data</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: t.muted }}>2,431 karma</div>
        </div>
      </div>
    </div>
  );
}

function SidebarSectionHeader({ t, label, right }) {
  return (
    <div style={{
      padding: "8px 18px 4px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: MONO, fontSize: 10, letterSpacing: 0.6,
      color: t.mutedSoft, textTransform: "uppercase",
    }}>
      <span>{label}</span>{right}
    </div>
  );
}

function SidebarItem({ t, label, count, selected, onClick, iconName, iconColor }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        background: selected ? t.surfaceAlt : (hover ? t.surfaceAlt : "transparent"),
        color: selected ? t.ink : t.inkSoft,
        padding: "6px 10px", borderRadius: 6, margin: "1px 0",
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: SERIF, fontSize: 14,
        fontWeight: selected ? 600 : 400,
        position: "relative",
      }}>
      {selected && (
        <div style={{
          position: "absolute", left: -8, top: 6, bottom: 6, width: 2,
          background: t.accent, borderRadius: 1,
        }}/>
      )}
      {iconName ? (
        <Icon name={iconName} color={iconColor || t.muted} size={13}/>
      ) : (
        <div style={{ width: 6, height: 6, borderRadius: 1, background: t.mutedSoft, opacity: selected ? 1 : 0.5 }}/>
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && (
        <span style={{
          fontFamily: MONO, fontSize: 10, color: t.muted,
        }}>{count}</span>
      )}
    </button>
  );
}

Object.assign(window, { THEMES, SERIF, MONO, TrafficLights, Icon, Sidebar });
