"use client";

import { useEffect } from "react";
import { extractSearchWordFromPathname } from "@/src/lib/search-route";
import { finishWordQueryLatency, getPendingWordQueryLatency, observeWordQueryVisibility, WORD_QUERY_LATENCY_STARTED } from "@/src/lib/word-query-latency";
import { api } from "@/src/trpc/react";

type WordPaintEntry = PerformanceEntry & { identifier: string; renderTime: number; element: Element | null };

export function useWordQueryLatency(resultWords: string[], source: "online" | "offline") {
  const client = api.useUtils().client;
  const resultKey = JSON.stringify(resultWords);

  useEffect(() => {
    observeWordQueryVisibility();
    let firstFrame = 0;
    let paintFrame = 0;
    let observer: PerformanceObserver | undefined;
    const paints: WordPaintEntry[] = [];
    const words: string[] = JSON.parse(resultKey);
    const routeWord = () => extractSearchWordFromPathname(window.location.pathname)
      ?? new URLSearchParams(window.location.search).get("word") ?? "";
    const report = (eventId: string, paintedAt?: number) => {
      if (!getPendingWordQueryLatency(routeWord(), words)) return;
      const measurement = finishWordQueryLatency(eventId, paintedAt);
      if (!measurement) return;
      void client.searchTelemetry.recordWordQueryLatency.mutate({ ...measurement, source }).catch(() => {
        // Analytics failure must never change the dictionary experience.
      });
    };
    const reportBufferedPaint = () => {
      const pending = getPendingWordQueryLatency(routeWord(), words);
      if (!pending) return false;
      const entry = paints.filter(paint =>
        paint.identifier === "dictionary-word-result" && paint.renderTime > 0 &&
        performance.timeOrigin + paint.renderTime >= pending.startedAt &&
        paint.element?.textContent && getPendingWordQueryLatency(routeWord(), [paint.element.textContent]),
      ).sort((a, b) => a.renderTime - b.renderTime)[0];
      if (!entry) return false;
      report(pending.id, performance.timeOrigin + entry.renderTime);
      return true;
    };
    const reportAfterPaint = () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(paintFrame);
      const pending = getPendingWordQueryLatency(routeWord(), words);
      if (!pending || reportBufferedPaint()) return;
      // Fallback for browsers without Element Timing and already-visible cached
      // cards: two frames estimate the next paint after the React commit.
      firstFrame = requestAnimationFrame(() => {
        paintFrame = requestAnimationFrame(() => {
          if (!reportBufferedPaint()) report(pending.id);
        });
      });
    };
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes?.includes("element")) {
      try {
        observer = new PerformanceObserver(list => {
          paints.push(...list.getEntries() as WordPaintEntry[]);
          reportBufferedPaint();
        });
        // Buffered entries include server-rendered text painted before hydration.
        observer.observe({ type: "element", buffered: true });
      } catch { observer?.disconnect(); }
    }
    reportAfterPaint();
    window.addEventListener(WORD_QUERY_LATENCY_STARTED, reportAfterPaint);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(paintFrame);
      window.removeEventListener(WORD_QUERY_LATENCY_STARTED, reportAfterPaint);
    };
  }, [client, resultKey, source]);
}
