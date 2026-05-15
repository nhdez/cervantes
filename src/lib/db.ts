import Database from "@tauri-apps/plugin-sql";
import type { FavMeta, HNItem, NoteRecord } from "../types/hn";

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

export async function dbLoadFollowing(): Promise<Set<string>> {
  const d = await db();
  const rows = await d.select<{ username: string }[]>("SELECT username FROM following ORDER BY followed_at DESC");
  return new Set(rows.map(r => r.username));
}

export async function dbFollowUser(username: string): Promise<void> {
  const d = await db();
  await d.execute("INSERT OR IGNORE INTO following (username) VALUES (?)", [username]);
}

export async function dbUnfollowUser(username: string): Promise<void> {
  const d = await db();
  await d.execute("DELETE FROM following WHERE username = ?", [username]);
}

interface NoteRow {
  item_id: number; item_type: string; item_title: string;
  story_id: number; story_title: string; body: string; updated_at: string;
}

export async function dbLoadNotes(): Promise<Record<number, NoteRecord>> {
  const d = await db();
  const rows = await d.select<NoteRow[]>("SELECT * FROM notes ORDER BY updated_at DESC");
  const out: Record<number, NoteRecord> = {};
  for (const r of rows) {
    out[r.item_id] = {
      itemId: r.item_id, itemType: r.item_type as "story" | "comment",
      itemTitle: r.item_title, storyId: r.story_id, storyTitle: r.story_title,
      body: r.body, updatedAt: r.updated_at,
    };
  }
  return out;
}

export async function dbSaveNote(n: NoteRecord): Promise<void> {
  const d = await db();
  await d.execute(
    `INSERT OR REPLACE INTO notes (item_id, item_type, item_title, story_id, story_title, body, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [n.itemId, n.itemType, n.itemTitle, n.storyId, n.storyTitle, n.body],
  );
}

export async function dbDeleteNote(itemId: number): Promise<void> {
  const d = await db();
  await d.execute("DELETE FROM notes WHERE item_id = ?", [itemId]);
}

export async function dbLoadFeedSnapshot(): Promise<number[]> {
  const d = await db();
  const rows = await d.select<{ item_id: number }[]>(
    "SELECT item_id FROM feed_positions ORDER BY rank ASC"
  );
  return rows.map(r => r.item_id);
}

export async function dbSaveFeedSnapshot(ids: number[]): Promise<void> {
  const d = await db();
  await d.execute("DELETE FROM feed_positions", []);
  for (let i = 0; i < ids.length; i++) {
    await d.execute(
      "INSERT INTO feed_positions (rank, item_id) VALUES (?, ?)",
      [i, ids[i]]
    );
  }
}
