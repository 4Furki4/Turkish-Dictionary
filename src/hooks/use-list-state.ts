"use client";
import { useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useProgressRouter } from "./use-progress-router";
import { parseListState } from "@/src/lib/list-state";
/** One URL value for a list's coupled filters; updates preserve other query parameters. */
export function useListState<T extends object>(defaults: T) {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useProgressRouter();
  const value = parseListState(search.get("list"), defaults);
  const setValue = useCallback(
    (next: T | ((old: T) => T)) => {
      const query = new URLSearchParams(
        typeof window === "undefined" ? search : window.location.search,
      );
      const current = parseListState(query.get("list"), defaults);
      const serialized = JSON.stringify(
        typeof next === "function" ? next(current) : next,
      );
      if (query.get("list") === serialized) return;
      query.set("list", serialized);
      router.replace(`${pathname}?${query}`, { scroll: false });
    },
    [search, pathname, router, defaults],
  );
  return [value, setValue] as const;
}
