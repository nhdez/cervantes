import Database from "@tauri-apps/plugin-sql";
import type { FavMeta, HNItem } from "../types/hn";

interface FavoriteRow {
  id: number;
  title: string;
  url: string | null;
  by: string;
  score: number;
  descendants: number;
  time: number;
  note: string;
  tags: string;
  saved_at: string;
}

let _db: Database | null = null;

async function db(): Promise<Database> {
  if (!_db) _db = await Database.load("sqlite:cervantes.db");
  return _db;
}

export async function dbLoadFavorites(): Promise<{ ids: Set<number>; meta: Record<number, FavMeta>; items: Record<number, HNItem> }> {
  const d = await db();
  const rows = await d.select<FavoriteRow[]>("SELECT * FROM favorites ORDER BY saved_at DESC");
  const ids = new Set(rows.map(r => r.id));
  const meta: Record<number, FavMeta> = {};
  const items: Record<number, HNItem> = {};
  for (const r of rows) {
    meta[r.id] = { note: r.note, tags: JSON.parse(r.tags) as string[], savedAt: r.saved_at };
    items[r.id] = { id: r.id, type: "story", title: r.title, url: r.url ?? undefined, by: r.by, score: r.score, descendants: r.descendants, time: r.time };
  }
  return { ids, meta, items };
}

export async function dbSaveFavorite(
  id: number,
  item: { title?: string; url?: string | null; by?: string; score?: number; descendants?: number; time?: number }
): Promise<void> {
  const d = await db();
  await d.execute(
    `INSERT OR IGNORE INTO favorites (id, title, url, by, score, descendants, time, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, item.title ?? "", item.url ?? null, item.by ?? "", item.score ?? 0, item.descendants ?? 0, item.time ?? 0]
  );
}

export async function dbRemoveFavorite(id: number): Promise<void> {
  const d = await db();
  await d.execute("DELETE FROM favorites WHERE id = ?", [id]);
}

export async function dbUpdateNote(id: number, note: string): Promise<void> {
  const d = await db();
  await d.execute("UPDATE favorites SET note = ? WHERE id = ?", [note, id]);
}

export async function dbUpdateTags(id: number, tags: string[]): Promise<void> {
  const d = await db();
  await d.execute("UPDATE favorites SET tags = ? WHERE id = ?", [JSON.stringify(tags), id]);
}
