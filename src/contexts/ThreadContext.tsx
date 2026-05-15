import { createContext, useContext } from "react";

export interface ThreadInfo { id: number; title: string; }

export const ThreadContext = createContext<ThreadInfo | null>(null);
export function useCurrentThread() { return useContext(ThreadContext); }
