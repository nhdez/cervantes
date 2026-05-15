import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FeedType } from "../types/hn";

interface SettingsState {
  dark: boolean; accent: string; fontScale: number;
  density: "compact" | "comfy"; defaultFeed: FeedType;
  itemsPerPage: 15 | 30 | 50; openLinksIn: "browser" | "webview";
  setDark: (v: boolean) => void;
  setAccent: (v: string) => void;
  setFontScale: (v: number) => void;
  setDensity: (v: "compact" | "comfy") => void;
  setDefaultFeed: (v: FeedType) => void;
  setItemsPerPage: (v: 15 | 30 | 50) => void;
  setOpenLinksIn: (v: "browser" | "webview") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dark: false, accent: "#B85D2E", fontScale: 1, density: "comfy",
      defaultFeed: "top", itemsPerPage: 30, openLinksIn: "browser",
      setDark: (v) => set({ dark: v }),
      setAccent: (v) => set({ accent: v }),
      setFontScale: (v) => set({ fontScale: v }),
      setDensity: (v) => set({ density: v }),
      setDefaultFeed: (v) => set({ defaultFeed: v }),
      setItemsPerPage: (v) => set({ itemsPerPage: v }),
      setOpenLinksIn: (v) => set({ openLinksIn: v }),
    }),
    { name: "cervantes-settings" }
  )
);
