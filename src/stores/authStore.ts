import { create } from "zustand";

interface AuthState {
  loggedIn: boolean; username: string | null; karma: number | null;
  setLoggedIn: (username: string, karma: number) => void;
  setLoggedOut: () => void;
  setKarma: (karma: number) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  loggedIn: false, username: null, karma: null,
  setLoggedIn: (username, karma) => set({ loggedIn: true, username, karma }),
  setLoggedOut: () => set({ loggedIn: false, username: null, karma: null }),
  setKarma: (karma) => set({ karma }),
}));
