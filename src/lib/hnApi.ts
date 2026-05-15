const BASE = "https://hacker-news.firebaseio.com/v0";

export async function fetchFeedIds(endpoint: string): Promise<number[]> {
  const res = await fetch(`${BASE}/${endpoint}.json`);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchItem(id: number): Promise<import("../types/hn").HNItem> {
  const res = await fetch(`${BASE}/item/${id}.json`);
  if (!res.ok) throw new Error(`Item ${id} fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchUser(username: string): Promise<import("../types/hn").HNUser> {
  const res = await fetch(`${BASE}/user/${username}.json`);
  if (!res.ok) throw new Error(`User ${username} fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchItems(ids: number[]): Promise<import("../types/hn").HNItem[]> {
  return Promise.all(ids.map(fetchItem));
}
