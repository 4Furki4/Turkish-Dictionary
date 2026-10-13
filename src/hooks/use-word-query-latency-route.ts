"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { extractSearchWordFromPathname } from "@/src/lib/search-route";
import { observeWordQueryVisibility, trackWordQueryRoute } from "@/src/lib/word-query-latency";

// Lives above the changing result subtree, including routes with no word card.
export function useWordQueryLatencyRoute() {
  const pathname = usePathname();
  useEffect(() => {
    observeWordQueryVisibility();
    const query = new URLSearchParams(window.location.search);
    const word = extractSearchWordFromPathname(pathname) ?? query.get("word") ?? "";
    trackWordQueryRoute(word, window.location.pathname + window.location.search);
  }, [pathname]);
}
