import { useTheme, MONO } from "../../theme";

interface TagProps { kind: "ask" | "show" | "job" | "note"; children: React.ReactNode; }

export function Tag({ kind, children }: TagProps) {
  const t = useTheme();
  const styles = {
    ask:  { bg: t.accentSoft, fg: t.accent },
    show: { bg: t.accentSoft, fg: t.accent },
    job:  { bg: "transparent", fg: t.muted, border: `1px solid ${t.rule}` },
    note: { bg: "transparent", fg: t.muted },
  } as Record<string, { bg: string; fg: string; border?: string }>;
  const c = styles[kind] || styles.note;
  return (
    <span style={{ fontFamily: MONO, fontSize: 9.5, padding: "1px 6px", borderRadius: 3, background: c.bg, color: c.fg, textTransform: "uppercase" as const, letterSpacing: 0.6, border: c.border }}>
      {children}
    </span>
  );
}
