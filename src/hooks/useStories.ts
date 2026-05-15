import { useQuery } from "@tanstack/react-query";
import { fetchFeedIds, fetchItem } from "../lib/hnApi";
import type { FeedType } from "../types/hn";
import { FEED_ENDPOINTS } from "../types/hn";

export function useFeedIds(feed: FeedType) {
  return useQuery({
    queryKey: ["feed", feed],
    queryFn: () => fetchFeedIds(FEED_ENDPOINTS[feed]),
    staleTime: 60_000,
  });
}

export function useFeedPage(feed: FeedType, page: number, perPage: number) {
  const { data: ids } = useFeedIds(feed);
  const pageIds = (ids ?? []).slice(page * perPage, (page + 1) * perPage);
  return useQuery({
    queryKey: ["feed-page", feed, page, perPage],
    queryFn: () => Promise.all(pageIds.map(fetchItem)),
    enabled: pageIds.length > 0,
    staleTime: 60_000,
  });
}

export function useTotalPages(feed: FeedType, perPage: number): number {
  const { data: ids } = useFeedIds(feed);
  if (!ids) return 0;
  return Math.ceil(ids.length / perPage);
}
