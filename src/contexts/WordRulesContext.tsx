import { createContext, useContext } from "react";
import type { WordRule } from "../types/hn";

interface WordRulesContextValue {
  rules: WordRule[];
  saveRule: (find: string, replace: string) => Promise<void>;
  deleteRule: (id: number) => void;
}

export const WordRulesContext = createContext<WordRulesContextValue>({
  rules: [],
  saveRule: async () => {},
  deleteRule: () => {},
});

export function useWordRules() {
  return useContext(WordRulesContext);
}
