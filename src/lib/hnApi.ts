import type { HNItem, HNUser } from "../types/hn";

const BASE = "https://hacker-news.firebaseio.com/v0";
const ALGOLIA = "https://hn.algolia.com/api/v1";

export async function fetchFeedIds(endpoint: string): Promise<number[]> {
  const res = await fetch(`${BASE}/${endpoint}.json`);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchItem(id: number): Promise<HNItem> {
  const res = await fetch(`${BASE}/item/${id}.json`);
  if (!res.ok) throw new Error(`Item ${id} fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchUser(username: string): Promise<HNUser> {
  const res = await fetch(`${BASE}/user/${username}.json`);
  if (!res.ok) throw new Error(`User ${username} fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchItems(ids: number[]): Promise<HNItem[]> {
  return Promise.all(ids.map(fetchItem));
}

interface AlgoliaHit {
  objectID: string; title: string; url?: string; author: string;
  points: number; num_comments: number; created_at_i: number; story_text?: string | null;
}

export async function fetchUserStories(username: string, limit = 15): Promise<HNItem[]> {
  const url = `${ALGOLIA}/search_by_date?tags=story,author_${encodeURIComponent(username)}&hitsPerPage=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Algolia fetch failed: ${res.status}`);
  const data = await res.json() as { hits: AlgoliaHit[] };
  return data.hits.map(h => ({
    id: parseInt(h.objectID, 10),
    type: "story" as const,
    by: h.author,
    title: h.title,
    url: h.url,
    score: h.points,
    descendants: h.num_comments,
    time: h.created_at_i,
    text: h.story_text ?? undefined,
  }));
}
