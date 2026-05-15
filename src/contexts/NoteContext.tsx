import { createContext, useContext } from "react";
import type { NoteRecord } from "../types/hn";

interface NoteContextValue {
  notes: Record<number, NoteRecord>;
  saveNote: (n: Omit<NoteRecord, "updatedAt">) => void;
  deleteNote: (itemId: number) => void;
}

export const NoteContext = createContext<NoteContextValue>({
  notes: {},
  saveNote: () => {},
  deleteNote: () => {},
});

export function useNotes() { return useContext(NoteContext); }
