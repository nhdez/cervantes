import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchHNStories, searchHNComments } from "../lib/hnApi";
import type { AlgoliaStoryResult, AlgoliaCommentResult } from "../lib/hnApi";

export interface AlgoliaSearchResults {
  stories: AlgoliaStoryResult[];
  comments: AlgoliaCommentResult[];
  isLoading: boolean;
  isError: boolean;
}

export function useAlgoliaSearch(query: string): AlgoliaSearchResults {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const active = debounced.trim().length > 1;

  const storiesQ = useQuery({
    queryKey: ["algolia-stories", debounced],
    queryFn: () => searchHNStories(debounced),
    enabled: active,
    staleTime: 60_000,
  });

  const commentsQ = useQuery({
    queryKey: ["algolia-comments", debounced],
    queryFn: () => searchHNComments(debounced),
    enabled: active,
    staleTime: 60_000,
  });

  return {
    stories: storiesQ.data ?? [],
    comments: commentsQ.data ?? [],
    isLoading: storiesQ.isFetching || commentsQ.isFetching,
    isError: storiesQ.isError || commentsQ.isError,
  };
}
