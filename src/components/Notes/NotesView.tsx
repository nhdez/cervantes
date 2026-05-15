import { useState } from "react";
import { useTheme, SERIF, MONO } from "../../theme";
import { Icon } from "../Shared/Icon";
import { useNotes } from "../../contexts/NoteContext";
import type { NoteRecord } from "../../types/hn";

interface NotesViewProps {
  selectedId: number | null;
  onSelect: (storyId: number) => void;
  search: string;
}

export function NotesView({ selectedId, onSelect, search }: NotesViewProps) {
  const t = useTheme();
  const { notes, saveNote, deleteNote } = useNotes();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const q = search.toLowerCase();
  const sorted = Object.values(notes)
    .filter(n => {
      if (!search) return true;
      return n.body.toLowerCase().includes(q)
        || n.storyTitle.toLowerCase().includes(q)
        || n.itemTitle.toLowerCase().includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (sorted.length === 0) {
    return (
      <div style={{ width: 420, flexShrink: 0, height: "100%", borderRight: `1px solid ${t.rule}`, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <Icon name="pencil" size={28} color={t.mutedSoft}/>
          <div style={{ marginTop: 14, fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: t.muted }}>
            {search ? "No notes match your search." : "No notes yet.\nOpen a story or comment and hit Note."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 420, flexShrink: 0, height: "100%", borderRight: `1px solid ${t.rule}`, background: t.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sorted.map((note, i) => (
          <NoteCard
            key={note.itemId}
            note={note}
            isSelected={selectedId === note.storyId}
            isEditing={editingId === note.itemId}
            editText={editText}
            isLast={i === sorted.length - 1}
            onOpenStory={() => onSelect(note.storyId)}
            onStartEdit={() => { setEditingId(note.itemId); setEditText(note.body); }}
            onEditChange={setEditText}
            onSaveEdit={() => {
              if (editText.trim()) saveNote({ ...note, body: editText.trim() });
              setEditingId(null);
            }}
            onCancelEdit={() => setEditingId(null)}
            onDelete={() => { deleteNote(note.itemId); setEditingId(null); }}
          />
        ))}
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: NoteRecord;
  isSelected: boolean;
  isEditing: boolean;
  editText: string;
  isLast: boolean;
  onOpenStory: () => void;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function NoteCard({ note, isSelected, isEditing, editText, isLast, onOpenStory, onStartEdit, onEditChange, onSaveEdit, onCancelEdit, onDelete }: NoteCardProps) {
  const t = useTheme();

  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${t.rule}`, background: isSelected ? t.surface : "transparent", borderLeft: isSelected ? `3px solid ${t.accent}` : "3px solid transparent", padding: "14px 18px 14px 16px" }}>
      {/* Source label */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon name={note.itemType === "comment" ? "chat" : "link"} size={11} color={t.mutedSoft}/>
        <button
          onClick={onOpenStory}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: MONO, fontSize: 10.5, color: t.accent, textAlign: "left", textDecoration: "underline", textUnderlineOffset: 2, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {note.itemType === "comment"
            ? `Comment in: ${note.storyTitle || "story"}`
            : note.storyTitle}
        </button>
      </div>

      {/* Comment excerpt if applicable */}
      {note.itemType === "comment" && note.itemTitle && (
        <div style={{ marginBottom: 8, padding: "6px 10px", borderLeft: `2px solid ${t.rule}`, fontFamily: SERIF, fontSize: 12, color: t.muted, fontStyle: "italic", lineHeight: 1.4 }}>
          "{note.itemTitle.length > 100 ? note.itemTitle.slice(0, 100) + "…" : note.itemTitle}"
        </div>
      )}

      {/* Note body / editor */}
      {isEditing ? (
        <div>
          <textarea autoFocus value={editText} onChange={e => onEditChange(e.target.value)}
            style={{ width: "100%", border: `1px solid ${t.accent}`, outline: "none", background: t.bg, color: t.ink, borderRadius: 6, padding: "8px 10px", fontFamily: SERIF, fontSize: 14, lineHeight: 1.5, resize: "vertical", minHeight: 72, boxSizing: "border-box" }}/>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <button onClick={onDelete}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: t.warn, fontFamily: MONO, fontSize: 10.5, padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="trash" size={11} color={t.warn}/>Delete
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onCancelEdit}
                style={{ border: `1px solid ${t.rule}`, background: "transparent", borderRadius: 5, padding: "3px 10px", fontFamily: SERIF, fontSize: 12, color: t.inkSoft, cursor: "pointer" }}>Cancel</button>
              <button onClick={onSaveEdit}
                style={{ border: `1px solid ${t.accent}`, background: t.accent, borderRadius: 5, padding: "3px 10px", fontFamily: SERIF, fontSize: 12, color: "#FBF6E9", fontWeight: 600, cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1, fontFamily: SERIF, fontSize: 14, color: t.ink, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {note.body}
          </div>
          <button onClick={onStartEdit}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 3, color: t.mutedSoft, flexShrink: 0 }}>
            <Icon name="pencil" size={13} color={t.mutedSoft}/>
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 10, color: t.mutedSoft, letterSpacing: 0.2 }}>
        {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}
