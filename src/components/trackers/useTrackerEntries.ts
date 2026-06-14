import { useEffect, useState } from "react";
import type { QuantityEntry, SessionEntry } from "../../data/types";
import { quantityEntriesRepo, sessionEntriesRepo } from "../../data/repositories";

export interface TrackerEntries {
  quantity: QuantityEntry[];
  session: SessionEntry[];
  loading: boolean;
}

/**
 * Loads all tracker entries, re-fetching whenever `version` changes (the store's
 * `entriesVersion` bumps on any entry mutation). Mirrors useDashboardData.
 */
export function useTrackerEntries(version: number): TrackerEntries {
  const [data, setData] = useState<TrackerEntries>({
    quantity: [],
    session: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [quantity, session] = await Promise.all([
        quantityEntriesRepo.all(),
        sessionEntriesRepo.all(),
      ]);
      if (!cancelled) setData({ quantity, session, loading: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return data;
}
