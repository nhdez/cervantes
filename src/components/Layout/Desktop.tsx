import { useState, useEffect } from "react";
import { useTheme, SERIF } from "../../theme";

export function Desktop({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const isDark = t.bg === "#1B1814";
  const wall = isDark
    ? "radial-gradient(ellipse at 30% 0%, #2A2418, #110F0B 70%)"
    : "radial-gradient(ellipse at 30% 0%, #D6C8A7, #B9A883 70%)";
  const INNER_W = 1320, INNER_H = 840;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      setScale(Math.min(1, window.innerWidth / INNER_W, window.innerHeight / INNER_H));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: wall, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, color: t.ink }}>
      <div style={{ width: INNER_W, height: INNER_H, transform: `scale(${scale})`, transformOrigin: "center center", flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", background: t.bg, boxShadow: isDark ? "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px rgba(0,0,0,0.6)" : "0 0 0 1px rgba(0,0,0,0.12), 0 24px 80px rgba(0,0,0,0.30)", display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
