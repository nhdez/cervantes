import { useEffect, useRef, useState, useMemo } from "react";
import { fetchFeedIds } from "../lib/hnApi";
import { FEED_ENDPOINTS } from "../types/hn";
import { dbLoadFeedSnapshot, dbSaveFeedSnapshot } from "../lib/db";

const POLL_MS = 5 * 60 * 1000;
const PAGE_SIZE = 30;

function toRankMap(ids: number[]): Record<number, number> {
  const m: Record<number, number> = {};
  ids.slice(0, PAGE_SIZE).forEach((id, i) => { m[id] = i; });
  return m;
}

export interface FeedPollerResult {
  hasUpdates: boolean;
  positionDeltas: Record<number, number>; // positive = moved up, negative = moved down
  clearUpdates: () => void;
}

export function useFeedPoller(): FeedPollerResult {
  const [hasUpdates, setHasUpdates] = useState(false);
  // baseline: rank map when app launched or user last refreshed
  const [baselineRanks, setBaselineRanks] = useState<Record<number, number>>({});
  // live: rank map as of the most recent poll
  const [liveRanks, setLiveRanks] = useState<Record<number, number>>({});

  const initialisedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Load whatever is in the DB as starting baseline + live
      const stored = await dbLoadFeedSnapshot().catch(() => [] as number[]);
      if (stored.length > 0) {
        const m = toRankMap(stored);
        setBaselineRanks(m);
        setLiveRanks(m);
      } else {
        // First ever launch — fetch now
        const ids = await fetchFeedIds(FEED_ENDPOINTS.top).catch(() => [] as number[]);
        if (ids.length > 0 && !cancelled) {
          const m = toRankMap(ids);
          setBaselineRanks(m);
          setLiveRanks(m);
          await dbSaveFeedSnapshot(ids.slice(0, PAGE_SIZE)).catch(() => {});
        }
      }
      initialisedRef.current = true;

      // DEV: skew the baseline so position deltas are immediately visible
      if (import.meta.env.DEV) {
        const shifts = [-6, 4, 0, -2, 8, 0, 3, -5, 1, 0, 7, -3, 0, 2, -4, 0, 5, -1, 0, 3, -7, 0, 4, -2, 0, 6, -3, 1, 0, -5];
        setBaselineRanks(prev => {
          const skewed: Record<number, number> = {};
          let i = 0;
          for (const [idStr, rank] of Object.entries(prev)) {
            skewed[Number(idStr)] = Math.max(0, rank + (shifts[i++ % shifts.length]));
          }
          return skewed;
        });
      }
    };

    init();

    const poll = async () => {
      if (cancelled || !initialisedRef.current) return;
      try {
        const ids = await fetchFeedIds(FEED_ENDPOINTS.top);
        const newMap = toRankMap(ids);
        if (!cancelled) {
          setLiveRanks(prev => {
            // Check if anything changed at all
            const prevKey = Object.entries(prev).sort().toString();
            const newKey = Object.entries(newMap).sort().toString();
            if (prevKey !== newKey) setHasUpdates(true);
            return newMap;
          });
          await dbSaveFeedSnapshot(ids.slice(0, PAGE_SIZE)).catch(() => {});
        }
      } catch {
        // Network error — skip
      }
    };

    const timer = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const positionDeltas = useMemo(() => {
    const out: Record<number, number> = {};
    for (const [idStr, liveRank] of Object.entries(liveRanks)) {
      const id = Number(idStr);
      if (id in baselineRanks) {
        const delta = baselineRanks[id] - liveRank; // positive = up
        if (delta !== 0) out[id] = delta;
      }
      // Items not in baseline are new entrants — no delta shown
    }
    return out;
  }, [baselineRanks, liveRanks]);

  const clearUpdates = () => {
    setHasUpdates(false);
    fetchFeedIds(FEED_ENDPOINTS.top)
      .then(ids => {
        const m = toRankMap(ids);
        // Refresh advances the baseline — deltas reset to 0
        setBaselineRanks(m);
        setLiveRanks(m);
        return dbSaveFeedSnapshot(ids.slice(0, PAGE_SIZE));
      })
      .catch(() => {});
  };

  return { hasUpdates, positionDeltas, clearUpdates };
}
