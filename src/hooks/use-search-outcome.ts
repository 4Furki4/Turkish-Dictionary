"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/src/trpc/react";
import { extractSearchWordFromPathname, OFFLINE_SEARCH_PARAM } from "@/src/lib/search-route";
import { completeSearchOutcome, installSearchOutcomeReporter, matchesSearchOutcomeResults, SEARCH_OUTCOME_STARTED, trackSearchOutcomeRoute } from "@/src/lib/search-outcome";

function currentWord() {
  const query = new URLSearchParams(window.location.search);
  return extractSearchWordFromPathname(window.location.pathname) ?? query.get("word") ?? query.get(OFFLINE_SEARCH_PARAM) ?? "";
}

export function useSearchOutcomeReporting() {
  const client = api.useUtils().client;
  const pathname = usePathname();
  useEffect(() => installSearchOutcomeReporter(event => client.searchTelemetry.recordSearchOutcome.mutate(event)), [client]);
  useEffect(() => {
    trackSearchOutcomeRoute(currentWord(), window.location.pathname + window.location.search);
  }, [pathname]);
}

// Only the visible result/failure subtree reports an outcome. Loading-route
// lookups, prefetches, autocomplete and direct visits never create an attempt.
export function useSearchOutcomeResult({ word, outcome, source, resultWords = [] }: {
  word?: string; outcome: "resolved" | "no_result" | "error" | null | undefined;
  source: "online" | "offline"; resultWords?: string[];
}) {
  const resultKey = JSON.stringify(resultWords);
  useEffect(() => {
    const report = () => {
      if (!outcome) return;
      const routeWord = currentWord();
      const words: string[] = JSON.parse(resultKey);
      if (word !== undefined && word !== routeWord) return;
      if (outcome === "resolved" && !matchesSearchOutcomeResults(routeWord, words)) return;
      completeSearchOutcome(routeWord, outcome, source, outcome === "resolved" ? words.length : 0);
    };
    report();
    window.addEventListener(SEARCH_OUTCOME_STARTED, report);
    return () => window.removeEventListener(SEARCH_OUTCOME_STARTED, report);
  }, [word, outcome, source, resultKey]);
}
