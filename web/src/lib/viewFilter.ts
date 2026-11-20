import { useCallback, useState } from "react";
import { CACHE_PREFIX, comfortStorageAllowed } from "./consent";
import { readStored, writeStored } from "./storage";

/**
 * Goals and Today each remember their own filter. With "Instant start" allowed it survives
 * reloads on this device (and is cleared with the local copy); otherwise it lasts until the
 * tab closes. A view seen for the first time starts unfiltered.
 */
type Filter = { tags: string[]; statuses: string[]; sort: string };

const memory = new Map<string, Filter>();

function restore<F extends Filter>(
  key: string,
  empty: F,
  statuses: readonly string[],
  sorts: readonly string[],
): F {
  const remembered = memory.get(key);
  if (remembered) {
    return remembered as F;
  }
  if (!comfortStorageAllowed()) {
    return empty;
  }
  try {
    const raw: unknown = JSON.parse(readStored(key) ?? "null");
    if (!raw || typeof raw !== "object") {
      return empty;
    }
    const record = raw as Record<string, unknown>;
    const strings = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((entry): entry is string => typeof entry === "string")
        : [];
    return {
      ...empty,
      tags: strings(record.tags).slice(0, 20),
      statuses: strings(record.statuses).filter((status) => statuses.includes(status)),
      sort:
        typeof record.sort === "string" && sorts.includes(record.sort) ? record.sort : empty.sort,
    } as F;
  } catch {
    return empty;
  }
}

export function useViewFilter<F extends Filter>(
  view: "goals" | "today",
  userId: string,
  empty: F,
  statuses: readonly string[],
  sorts: readonly string[],
): [F, (next: F) => void, () => void] {
  const key = `${CACHE_PREFIX}view-${view}-${userId}`;
  const [filter, setFilterState] = useState<F>(() => restore(key, empty, statuses, sorts));
  const setFilter = useCallback(
    (next: F) => {
      memory.set(key, next);
      if (comfortStorageAllowed()) {
        writeStored(key, JSON.stringify(next));
      }
      setFilterState(next);
    },
    [key],
  );
  const reset = useCallback(() => setFilter(empty), [empty, setFilter]);
  return [filter, setFilter, reset];
}

export type ViewLayout = "cards" | "list";

const layouts = new Map<string, ViewLayout>();

/**
 * Today can show steps as goal cards (the default) or as one list per day. The choice is
 * remembered like the filter: on this device with "Instant start", otherwise for the tab.
 * Resetting the filters leaves it alone.
 */
export function useViewLayout(
  view: "today",
  userId: string,
): [ViewLayout, (next: ViewLayout) => void] {
  const key = `${CACHE_PREFIX}layout-${view}-${userId}`;
  const [layout, setLayoutState] = useState<ViewLayout>(() => {
    const remembered = layouts.get(key);
    if (remembered) {
      return remembered;
    }
    const stored = comfortStorageAllowed() ? readStored(key) : null;
    return stored === "list" ? "list" : "cards";
  });
  const setLayout = useCallback(
    (next: ViewLayout) => {
      layouts.set(key, next);
      if (comfortStorageAllowed()) {
        writeStored(key, next);
      }
      setLayoutState(next);
    },
    [key],
  );
  return [layout, setLayout];
}
