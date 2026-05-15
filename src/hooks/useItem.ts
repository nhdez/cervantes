import { useQuery } from "@tanstack/react-query";
import { fetchItem, fetchItems } from "../lib/hnApi";

export function useItem(id: number | null) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id!),
    enabled: id != null,
    staleTime: 5 * 60_000,
  });
}

export function useKids(ids: number[] | undefined) {
  return useQuery({
    queryKey: ["kids", ids],
    queryFn: () => fetchItems(ids!),
    enabled: !!ids && ids.length > 0,
    staleTime: 5 * 60_000,
  });
}
