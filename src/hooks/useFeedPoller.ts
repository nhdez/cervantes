import { useEffect, useRef, useState } from "react";
import { fetchFeedIds } from "../lib/hnApi";
import { FEED_ENDPOINTS } from "../types/hn";
import { dbLoadFeedSnapshot, dbSaveFeedSnapshot } from "../lib/db";

const POLL_MS = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 30;

function snapshotKey(ids: number[]) { return ids.slice(0, PAGE_SIZE).join(","); }

export function useFeedPoller(): { hasUpdates: boolean; clearUpdates: () => void } {
  const [hasUpdates, setHasUpdates] = useState(false);
  const baselineRef = useRef<string | null>(null);

  // Load the stored snapshot as baseline on mount, then start polling
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const stored = await dbLoadFeedSnapshot().catch(() => [] as number[]);
      if (stored.length > 0) {
        baselineRef.current = snapshotKey(stored);
      } else {
        // No stored snapshot yet — fetch now to establish baseline
        const ids = await fetchFeedIds(FEED_ENDPOINTS.top).catch(() => [] as number[]);
        if (ids.length > 0) {
          baselineRef.current = snapshotKey(ids);
          await dbSaveFeedSnapshot(ids.slice(0, PAGE_SIZE)).catch(() => {});
        }
      }
    };

    init();

    const poll = async () => {
      if (cancelled) return;
      try {
        const ids = await fetchFeedIds(FEED_ENDPOINTS.top);
        const key = snapshotKey(ids);
        if (baselineRef.current !== null && key !== baselineRef.current) {
          setHasUpdates(true);
        }
        // Always persist latest positions regardless of whether we flag updates
        await dbSaveFeedSnapshot(ids.slice(0, PAGE_SIZE)).catch(() => {});
      } catch {
        // Network error — silently skip this tick
      }
    };

    const timer = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const clearUpdates = () => {
    setHasUpdates(false);
    // Update baseline to whatever is now live
    fetchFeedIds(FEED_ENDPOINTS.top)
      .then(ids => {
        baselineRef.current = snapshotKey(ids);
        return dbSaveFeedSnapshot(ids.slice(0, PAGE_SIZE));
      })
      .catch(() => {});
  };

  return { hasUpdates, clearUpdates };
}
