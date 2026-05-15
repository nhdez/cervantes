import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import { useWordRules } from "../../contexts/WordRulesContext";

export function WordRulesView() {
  const t = useTheme();
  const { rules, saveRule, deleteRule } = useWordRules();
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");

  const handleAdd = async () => {
    const f = find.trim();
    if (!f) return;
    await saveRule(f, replace.trim());
    setFind("");
    setReplace("");
  };

  const inputStyle = {
    flex: 1, border: `1px solid ${t.rule}`, borderRadius: 6, padding: "7px 10px",
    fontFamily: SERIF, fontSize: 13, color: t.ink, background: t.bg, outline: "none",
  };

  return (
    <div style={{ width: 420, flexShrink: 0, borderRight: `1px solid ${t.rule}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${t.rule}`, background: t.surface, flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft, letterSpacing: 0.6, textTransform: "uppercase" as const, marginBottom: 2 }}>Filters</div>
        <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: t.ink }}>Word replacements</div>
        <div style={{ fontFamily: SERIF, fontSize: 12.5, color: t.muted, marginTop: 3, lineHeight: 1.4 }}>
          Words found in stories and comments will be replaced and highlighted.
        </div>
      </div>

      {/* Add form */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.rule}`, background: t.surface, flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: t.mutedSoft, letterSpacing: 0.5, textTransform: "uppercase" as const, marginBottom: 8 }}>New rule</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={find} onChange={e => setFind(e.target.value)}
            placeholder="Find…"
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={inputStyle}
          />
          <Icon name="arrow-right" size={12} color={t.muted}/>
          <input
            value={replace} onChange={e => setReplace(e.target.value)}
            placeholder="Replace with…"
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={inputStyle}
          />
          <button
            onClick={handleAdd}
            disabled={!find.trim()}
            style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${t.accent}`, background: find.trim() ? t.accent : t.surface, color: find.trim() ? "#FBF6E9" : t.muted, fontFamily: SERIF, fontSize: 13, fontWeight: 600, cursor: find.trim() ? "pointer" : "default", flexShrink: 0 }}>
            Add
          </button>
        </div>
      </div>

      {/* Rules list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {rules.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center" as const, fontFamily: SERIF, fontSize: 14, color: t.muted, fontStyle: "italic" }}>
            No rules yet
          </div>
        )}
        {rules.map(rule => (
          <div key={rule.id}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${t.rule}` }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 12, color: t.ink, background: t.surface, border: `1px solid ${t.rule}`, borderRadius: 4, padding: "2px 8px", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {rule.find}
              </span>
              <Icon name="arrow-right" size={11} color={t.muted}/>
              <span style={{ fontFamily: MONO, fontSize: 12, color: t.accent, background: t.accentSoft, border: `1px solid ${t.accent}`, borderRadius: 4, padding: "2px 8px", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {rule.replace || <em style={{ color: t.muted }}>(deleted)</em>}
              </span>
            </div>
            <button
              onClick={() => deleteRule(rule.id)}
              title="Remove rule"
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: t.muted, display: "flex", alignItems: "center" }}>
              <Icon name="x" size={13} color={t.muted}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
