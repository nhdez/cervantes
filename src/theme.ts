import { createContext, useContext } from "react";

export const SERIF = '"Source Serif 4", "Source Serif Pro", Charter, Georgia, serif';
export const MONO  = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace';

export interface Theme {
  bg: string; surface: string; surfaceAlt: string; rule: string;
  ink: string; inkSoft: string; muted: string; mutedSoft: string;
  accent: string; accentSoft: string; warn: string; good: string; shadow: string;
}

export const THEMES: Record<"light" | "dark", Theme> = {
  light: {
    bg: "#EFE8D9", surface: "#F5F0E2", surfaceAlt: "#E8E0CE", rule: "#D8CFB9",
    ink: "#2A2520", inkSoft: "#4B4339", muted: "#7A6F5E", mutedSoft: "#988C77",
    accent: "oklch(0.58 0.14 45)", accentSoft: "oklch(0.92 0.04 60)",
    warn: "oklch(0.62 0.13 70)", good: "oklch(0.55 0.10 145)",
    shadow: "0 1px 0 rgba(0,0,0,0.04)",
  },
  dark: {
    bg: "#1B1814", surface: "#24201A", surfaceAlt: "#2E2922", rule: "#3A3429",
    ink: "#E8E0CE", inkSoft: "#C9BFA8", muted: "#948B7C", mutedSoft: "#6D6557",
    accent: "oklch(0.72 0.14 50)", accentSoft: "oklch(0.34 0.06 50)",
    warn: "oklch(0.74 0.12 75)", good: "oklch(0.68 0.10 145)",
    shadow: "0 1px 0 rgba(0,0,0,0.3)",
  },
};

export const ThemeContext = createContext<Theme>(THEMES.light);
export const useTheme = () => useContext(ThemeContext);
