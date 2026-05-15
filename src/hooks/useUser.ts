import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "../lib/hnApi";

export function useUser(username: string | null) {
  return useQuery({
    queryKey: ["user", username],
    queryFn: () => fetchUser(username!),
    enabled: username != null,
    staleTime: 10 * 60_000,
  });
}
