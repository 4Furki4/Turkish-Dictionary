// A single tab-local marker survives navbar searches that load a new document.
// The searched word is used only for matching and is never sent to the server.
export const WORD_QUERY_LATENCY_STARTED = "word-query-latency-started";
const STORAGE_KEY = "word-query-latency:pending";
import { MAX_WORD_QUERY_LATENCY_MS } from "./word-query-latency-schema";

type PendingSearch = { id: string; word: string; startedAt: number; origin: string; arrived?: boolean; supersededWords?: string[] };
let memoryPending: PendingSearch | null = null;
let observingVisibility = false;
const normalize = (word: string) => word.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");
const now = () => performance.timeOrigin + performance.now();

function readPending(): PendingSearch | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return memoryPending;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return null;
    const value = parsed as Partial<PendingSearch>;
    if (typeof value.id !== "string" || typeof value.word !== "string" || typeof value.origin !== "string" || typeof value.startedAt !== "number" || !Number.isFinite(value.startedAt)) return null;
    if (value.supersededWords !== undefined && (!Array.isArray(value.supersededWords) || !value.supersededWords.every(word => typeof word === "string"))) return null;
    if (now() - value.startedAt > MAX_WORD_QUERY_LATENCY_MS) { clearPending(); return null; }
    return value as PendingSearch;
  } catch {
    return memoryPending;
  }
}

function clearPending() {
  memoryPending = null;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage can be disabled. */ }
}

export function observeWordQueryVisibility() {
  if (document.visibilityState !== "visible") clearPending();
  if (observingVisibility) return;
  observingVisibility = true;
  let departing = false;
  // A document navigation also hides the old page. Preserve its marker so the
  // destination can finish it, but discard actual background-tab waits.
  window.addEventListener("pagehide", () => { departing = true; });
  window.addEventListener("pageshow", () => { departing = false; });
  window.addEventListener("popstate", clearPending);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && !departing) clearPending();
  });
}

export function cancelWordQueryLatency(word?: string) {
  const pending = readPending();
  if (pending && (!word || pending.word === normalize(word))) clearPending();
}

export function trackWordQueryRoute(routeWord: string, route: string) {
  const pending = readPending();
  if (!pending) return;
  if (pending.word === normalize(routeWord) || pending.supersededWords?.includes(normalize(routeWord))) {
    pending.arrived = true;
    memoryPending = pending;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending)); } catch { /* Use memory. */ }
  } else if (pending.arrived || pending.origin !== route) {
    clearPending();
  }
}

export function beginWordQueryLatency(word: string) {
  const previous = readPending();
  clearPending();
  if (!word.trim() || word.includes("_") || typeof crypto.randomUUID !== "function") return;
  observeWordQueryVisibility();
  const event: PendingSearch = {
    id: crypto.randomUUID(), word: normalize(word), startedAt: now(),
    origin: window.location.pathname + window.location.search,
    // A previously requested RSC navigation can still commit while this one
    // primes its cache. Only those known superseded destinations are tolerated.
    supersededWords: previous ? [...new Set([previous.word, ...(previous.supersededWords ?? [])])].slice(0, 8) : [],
  };
  memoryPending = event;
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(event)); } catch { /* Use memory for this document. */ }
  window.dispatchEvent(new Event(WORD_QUERY_LATENCY_STARTED));
}

export function getPendingWordQueryLatency(routeWord: string, resultWords: string[]) {
  const pending = readPending();
  if (!pending || pending.word !== normalize(routeWord) || !resultWords.some(word => normalize(word) === pending.word)) return null;
  return pending;
}

export function finishWordQueryLatency(id: string, paintedAt = now()) {
  const pending = readPending();
  if (!pending || pending.id !== id) return null;
  clearPending(); // Consume before sending: refreshes and Strict Mode cannot double count.
  const durationMs = Math.round(paintedAt - pending.startedAt);
  if (document.visibilityState !== "visible" || durationMs < 0 || durationMs > MAX_WORD_QUERY_LATENCY_MS) return null;
  return { eventId: pending.id, durationMs };
}
