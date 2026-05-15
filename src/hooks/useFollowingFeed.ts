import { useQuery } from "@tanstack/react-query";
import { fetchUserStories } from "../lib/hnApi";
import type { HNItem } from "../types/hn";

export function useFollowingFeed(usernames: string[]) {
  const key = [...usernames].sort().join(",");
  return useQuery({
    queryKey: ["following-feed", key],
    queryFn: async (): Promise<HNItem[]> => {
      const results = await Promise.allSettled(usernames.map(un => fetchUserStories(un, 20)));
      const stories: HNItem[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") stories.push(...r.value);
      }
      return stories
        .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))
        .slice(0, 120);
    },
    enabled: usernames.length > 0,
    staleTime: 5 * 60_000,
  });
}
