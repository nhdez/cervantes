import { createContext, useContext } from "react";

export const ProfileContext = createContext<(username: string) => void>(() => {});
export function useOpenProfile() { return useContext(ProfileContext); }
