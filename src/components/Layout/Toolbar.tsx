import { useRef, useEffect } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import { IconButton } from "../Shared/IconButton";
import { useSettingsStore } from "../../stores/settingsStore";

interface ToolbarProps {
  title: string; subtitle?: string;
  search: string; onSearch: (v: string) => void;
  right?: React.ReactNode;
  onRefresh?: () => void;
  hasUpdates?: boolean;
}

export function Toolbar({ title, subtitle, search, onSearch, right, onRefresh, hasUpdates }: ToolbarProps) {
  const t = useTheme();
  const { dark, setDark } = useSettingsStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ height: 56, flexShrink: 0, padding: "0 18px", borderBottom: `1px solid ${t.rule}`, background: t.surface, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: t.ink, letterSpacing: -0.2, lineHeight: 1.1 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, marginTop: 3, letterSpacing: 0.3, textTransform: "uppercase" as const }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px", background: t.bg, border: `1px solid ${t.rule}`, borderRadius: 6, width: 220 }}>
        <Icon name="search" color={t.muted} size={13}/>
        <input ref={inputRef} value={search} onChange={e => onSearch(e.target.value)} placeholder="Search stories"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: SERIF, fontSize: 13, color: t.ink }}/>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: t.mutedSoft, border: `1px solid ${t.rule}`, padding: "1px 4px", borderRadius: 3 }}>⌘K</span>
      </div>
      {onRefresh && (
        <div style={{ position: "relative" }}>
          <IconButton onClick={onRefresh} tip="Refresh feed">
            <Icon name="refresh" color={hasUpdates ? t.blue : t.ink} size={14}/>
          </IconButton>
          {hasUpdates && (
            <span style={{
              position: "absolute", top: 2, right: 2,
              width: 7, height: 7, borderRadius: "50%",
              background: t.blue,
              border: `1.5px solid ${t.surface}`,
              animation: "cervantes-pulse 2s ease-in-out infinite",
            }}/>
          )}
        </div>
      )}
      {right}
      <IconButton onClick={() => setDark(!dark)} tip={dark ? "Light mode" : "Dark mode"}>
        <Icon name={dark ? "sun" : "moon"} color={t.ink} size={14}/>
      </IconButton>
    </div>
  );
}
