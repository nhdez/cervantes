import { sanitizeHtml } from "../../lib/sanitize";
import { useWordRules } from "../../contexts/WordRulesContext";
import { useTheme } from "../../theme";
import type { WordRule } from "../../types/hn";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyRulesToHtml(html: string, rules: WordRule[], accent: string, accentSoft: string): string {
  if (!rules.length) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";
    if (!text.trim()) continue;

    type Seg = { content: string; highlight: boolean };
    let segments: Seg[] = [{ content: text, highlight: false }];
    let modified = false;

    for (const rule of rules) {
      if (!rule.find.trim()) continue;
      const re = new RegExp(escapeRegex(rule.find), "gi");
      const next: Seg[] = [];
      for (const seg of segments) {
        if (seg.highlight) { next.push(seg); continue; }
        const parts = seg.content.split(re);
        if (parts.length === 1) { next.push(seg); continue; }
        modified = true;
        parts.forEach((part, i) => {
          if (part) next.push({ content: part, highlight: false });
          if (i < parts.length - 1) next.push({ content: rule.replace, highlight: true });
        });
      }
      segments = next;
    }

    if (modified) {
      const fragment = doc.createDocumentFragment();
      for (const seg of segments) {
        if (seg.highlight) {
          const mark = doc.createElement("mark");
          mark.style.background = accentSoft;
          mark.style.color = accent;
          mark.style.borderRadius = "2px";
          mark.style.padding = "0 2px";
          mark.style.fontWeight = "600";
          mark.style.fontStyle = "normal";
          mark.textContent = seg.content;
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(doc.createTextNode(seg.content));
        }
      }
      textNode.parentNode?.replaceChild(fragment, textNode);
    }
  }

  return doc.body.innerHTML;
}

interface SafeHtmlProps {
  html: string | undefined;
  style?: React.CSSProperties;
  className?: string;
}

export function SafeHtml({ html, style, className }: SafeHtmlProps) {
  const { rules } = useWordRules();
  const t = useTheme();
  // sanitizeHtml runs DOMPurify first; word-rule marks are then injected into already-clean HTML
  const processed = applyRulesToHtml(sanitizeHtml(html), rules, t.accent, t.accentSoft);
  return (
    <div
      style={style}
      className={className}
      {...{ dangerouslySetInnerHTML: { __html: processed } }}
    />
  );
}
