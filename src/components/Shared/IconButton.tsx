import { useState } from "react";
import { useTheme, SERIF } from "../../theme";

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  tip?: string;
  active?: boolean;
}

export function IconButton({ children, onClick, tip, active }: IconButtonProps) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={tip}
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
