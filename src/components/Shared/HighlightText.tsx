import { useTheme } from "../../theme";
import { useWordRules } from "../../contexts/WordRulesContext";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface HighlightTextProps { text: string | undefined }

export function HighlightText({ text }: HighlightTextProps) {
  const { rules } = useWordRules();
  const t = useTheme();

  if (!text) return null;
  if (!rules.length) return <>{text}</>;

  type Seg = { content: string; highlight: boolean };
  let segments: Seg[] = [{ content: text, highlight: false }];

  for (const rule of rules) {
    if (!rule.find.trim()) continue;
    const re = new RegExp(escapeRegex(rule.find), "gi");
    const next: Seg[] = [];
    for (const seg of segments) {
      if (seg.highlight) { next.push(seg); continue; }
      const parts = seg.content.split(re);
      if (parts.length === 1) { next.push(seg); continue; }
      parts.forEach((part, i) => {
        if (part) next.push({ content: part, highlight: false });
        if (i < parts.length - 1) next.push({ content: rule.replace, highlight: true });
      });
    }
    segments = next;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight
          ? <mark key={i} style={{ background: t.accentSoft, color: t.accent, borderRadius: 2, padding: "0 2px", fontWeight: 600, fontStyle: "normal" }}>{seg.content}</mark>
          : <span key={i}>{seg.content}</span>
      )}
    </>
  );
}
