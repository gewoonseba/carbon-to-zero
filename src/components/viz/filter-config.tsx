"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { SavingsData } from "@/lib/types";
import {
  filterSavings,
  isDefaultFilter,
  type DateBounds,
  type FilterState,
} from "@/lib/filter";

interface FilterContextValue {
  /** The original, unfiltered dataset (drives the filter UI's choices). */
  source: SavingsData;
  /** The dataset scoped to the active filter (identical to `source` when default). */
  filtered: SavingsData;
  state: FilterState;
  bounds: DateBounds;
  isDefault: boolean;
  /** Number of active (non-default) filter dimensions — drives the trigger badge. */
  activeCount: number;
  setRange: (from: string, to: string) => void;
  setCustomers: (ids: string[]) => void;
  reset: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

function defaultState(data: SavingsData): FilterState {
  return {
    from: data.range.min,
    to: data.range.max,
    customerIds: data.customers.map((c) => c.id),
  };
}

export function FilterProvider({
  data,
  children,
}: {
  data: SavingsData;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<FilterState>(() => defaultState(data));

  const setRange = useCallback(
    (from: string, to: string) => setState((prev) => ({ ...prev, from, to })),
    [],
  );

  const setCustomers = useCallback(
    (ids: string[]) => setState((prev) => ({ ...prev, customerIds: ids })),
    [],
  );

  const reset = useCallback(() => setState(defaultState(data)), [data]);

  const isDefault = useMemo(() => isDefaultFilter(state, data), [state, data]);

  // Keep the default view byte-identical to the unfiltered dataset; only pay
  // for the recompute once the user actually narrows the scope.
  const filtered = useMemo(
    () => (isDefault ? data : filterSavings(data, state)),
    [data, state, isDefault],
  );

  const value = useMemo<FilterContextValue>(() => {
    const dateActive =
      state.from !== data.range.min || state.to !== data.range.max;
    const customersActive = state.customerIds.length !== data.customers.length;
    return {
      source: data,
      filtered,
      state,
      bounds: data.range,
      isDefault,
      activeCount: (dateActive ? 1 : 0) + (customersActive ? 1 : 0),
      setRange,
      setCustomers,
      reset,
    };
  }, [data, filtered, state, isDefault, setRange, setCustomers, reset]);

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return ctx;
}
