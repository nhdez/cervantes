import { useTheme, SERIF } from "../../theme";

export function Desktop({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", display: "flex", fontFamily: SERIF, color: t.ink, background: t.bg }}>
      {children}
    </div>
  );
}
