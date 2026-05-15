// Cervantes — list + reader + comments
const { useState: useState2, useEffect: useEffect2, useMemo: useMemo2, useRef: useRef2 } = React;

// ─────────────────────────────────────────────────────────────
// Toolbar (top of list / reader)
// ─────────────────────────────────────────────────────────────
function Toolbar({ t, title, subtitle, dark, onToggleDark, search, onSearch, right }) {
  return (
    <div style={{
      height: 56, flexShrink: 0, padding: "0 18px",
      borderBottom: `1px solid ${t.rule}`,
      background: t.surface,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: t.ink,
          letterSpacing: -0.2, lineHeight: 1.1,
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontFamily: MONO, fontSize: 10.5, color: t.muted, marginTop: 3,
            letterSpacing: 0.3, textTransform: "uppercase",
          }}>{subtitle}</div>
        )}
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        height: 30, padding: "0 10px",
        background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 6,
        width: 220,
      }}>
        <Icon name="search" color={t.muted} size={13}/>
        <input
          value={search} onChange={e => onSearch(e.target.value)}
          placeholder="Search stories"
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: SERIF, fontSize: 13, color: t.ink,
          }}/>
        <span style={{
          fontFamily: MONO, fontSize: 9.5, color: t.mutedSoft,
          border: `1px solid ${t.rule}`, padding: "1px 4px", borderRadius: 3,
        }}>⌘K</span>
      </div>

      {right}

      <IconButton t={t} onClick={onToggleDark} tip={dark ? "Light mode" : "Dark mode"}>
        <Icon name={dark ? "sun" : "moon"} color={t.ink} size={14}/>
      </IconButton>
    </div>
  );
}

function IconButton({ t, children, onClick, tip, active }) {
  const [hover, setHover] = useState2(false);
  return (
    <button
      onClick={onClick} title={tip}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        height: 30, minWidth: 30, padding: "0 8px", borderRadius: 6,
        border: `1px solid ${active ? t.accent : t.rule}`,
        background: active ? t.accentSoft : (hover ? t.surfaceAlt : "transparent"),
        color: t.ink, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: SERIF, fontSize: 13,
      }}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Story list
// ─────────────────────────────────────────────────────────────
function StoryList({ t, stories, selectedId, onSelect, favorites, onToggleFav, favoriteMeta }) {
  return (
    <div style={{
      width: 420, flexShrink: 0, height: "100%",
      borderRight: `1px solid ${t.rule}`,
      background: t.bg,
      overflowY: "auto",
    }}>
      {stories.length === 0 && (
        <div style={{
          padding: "60px 24px", color: t.muted,
          fontFamily: SERIF, fontSize: 14, fontStyle: "italic", textAlign: "center",
        }}>
          Nothing here yet. Star a story to keep it.
        </div>
      )}
      {stories.map((s, i) => (
        <StoryRow
          key={s.id} t={t} story={s} index={i + 1}
          selected={selectedId === s.id}
          isFav={favorites.has(s.id)}
          favMeta={favoriteMeta[s.id]}
          onClick={() => onSelect(s.id)}
          onToggleFav={() => onToggleFav(s.id)}
        />
      ))}
    </div>
  );
}

function StoryRow({ t, story, index, selected, isFav, favMeta, onClick, onToggleFav }) {
  const [hover, setHover] = useState2(false);
  const domain = story.url ? story.url.split("/")[0] : null;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: "14px 18px 14px 16px",
        background: selected ? t.surface : (hover ? t.surfaceAlt : "transparent"),
        borderBottom: `1px solid ${t.rule}`,
        cursor: "pointer", position: "relative",
        borderLeft: selected ? `3px solid ${t.accent}` : "3px solid transparent",
      }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          fontFamily: MONO, fontSize: 11, color: t.mutedSoft,
          width: 22, paddingTop: 3, textAlign: "right", flexShrink: 0,
        }}>{String(index).padStart(2, "0")}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.35, color: t.ink,
            fontWeight: selected ? 600 : 500, textWrap: "pretty",
          }}>{story.title}</div>

          {/* row meta */}
          <div style={{
            marginTop: 6, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            fontFamily: MONO, fontSize: 10.5, color: t.muted, letterSpacing: 0.2,
          }}>
            {domain && (
              <span style={{ color: t.inkSoft, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="link" color={t.muted} size={11}/>{domain}
              </span>
            )}
            {story.type === "ask" && <Tag t={t} kind="ask">ask</Tag>}
            {story.type === "show" && <Tag t={t} kind="show">show</Tag>}
            {story.type === "job" && <Tag t={t} kind="job">hiring</Tag>}
            {story.points > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon name="arrow-up" color={t.muted} size={11}/>{story.points}
              </span>
            )}
            {story.descendants > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Icon name="chat" color={t.muted} size={11}/>{story.descendants}
              </span>
            )}
            <span>{story.time}</span>
            <span>· {story.by}</span>
          </div>

          {/* favorite note preview */}
          {isFav && favMeta?.note && (
            <div style={{
              marginTop: 8, padding: "6px 10px",
              borderLeft: `2px solid ${t.accent}`,
              background: t.surface,
              fontFamily: SERIF, fontSize: 12.5, fontStyle: "italic",
              color: t.inkSoft, lineHeight: 1.4,
            }}>
              “{favMeta.note}”
            </div>
          )}
        </div>

        {/* fav star */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(); }}
          title={isFav ? "Remove from favorites" : "Add to favorites"}
          style={{
            border: "none", background: "transparent", cursor: "pointer",
            padding: 2, marginTop: 1, color: isFav ? t.accent : t.mutedSoft,
            opacity: isFav || hover ? 1 : 0.35, transition: "opacity .15s",
          }}>
          <Icon name={isFav ? "star-fill" : "star"} size={15} color={isFav ? t.accent : t.muted}/>
        </button>
      </div>
    </div>
  );
}

function Tag({ t, kind, children }) {
  const map = {
    ask:  { bg: t.accentSoft, fg: t.accent },
    show: { bg: t.accentSoft, fg: t.accent },
    job:  { bg: "transparent", fg: t.muted },
    note: { bg: "transparent", fg: t.muted },
  };
  const c = map[kind] || map.note;
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9.5, padding: "1px 6px",
      borderRadius: 3, background: c.bg, color: c.fg,
      textTransform: "uppercase", letterSpacing: 0.6,
      border: kind === "job" ? `1px solid ${t.rule}` : "none",
    }}>{children}</span>
  );
}

Object.assign(window, { Toolbar, IconButton, StoryList, StoryRow, Tag });
