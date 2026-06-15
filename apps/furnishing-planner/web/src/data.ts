import { useCallback, useEffect, useState } from "react";
import type { Category } from "@philemon/types";
import { api, ApiError, type RoomNode } from "./api.js";

export interface DataState {
  tree: RoomNode[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  unauthorized: boolean;
  reload: () => Promise<void>;
}

export function useData(): DataState {
  const [tree, setTree] = useState<RoomNode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [rooms, cats] = await Promise.all([api.rooms(), api.categories()]);
      setTree(rooms);
      setCategories(cats);
      setError(null);
      setUnauthorized(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setUnauthorized(true);
      else setError(e instanceof Error ? e.message : "failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tree, categories, loading, error, unauthorized, reload };
}

// ---- budget rollups (cents) ----
export interface ZoneTotals {
  target: number;
  planned: number;
  spent: number;
}

export function zoneTotals(zone: RoomNode["zones"][number]): ZoneTotals {
  let planned = 0;
  let spent = 0;
  for (const it of zone.items) {
    const est =
      it.kind === "area"
        ? Math.round((it.areaM2 ?? 0) * (it.ratePerM2Cents ?? 0))
        : it.estimatedCents * it.quantity;
    planned += est;
    if (it.actualCents != null) spent += it.actualCents;
  }
  return { target: zone.budgetTargetCents, planned, spent };
}

export function grandTotals(tree: RoomNode[]): ZoneTotals {
  return tree
    .flatMap((r) => r.zones)
    .reduce(
      (acc, z) => {
        const t = zoneTotals(z);
        return { target: acc.target + t.target, planned: acc.planned + t.planned, spent: acc.spent + t.spent };
      },
      { target: 0, planned: 0, spent: 0 },
    );
}
