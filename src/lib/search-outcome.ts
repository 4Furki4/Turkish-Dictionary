import { normalizeOutcomeQuery, outcomeQuerySchema, searchOutcomeInputSchema, type SearchOutcomeInput } from "./search-outcome-schema";

export const SEARCH_OUTCOME_STARTED = "search-outcome-started";
const STORAGE_KEY = "search-outcome:pending";
const MAX_ATTEMPT_MS = 120_000;
type PendingAttempt = Omit<SearchOutcomeInput, "outcome" | "resultCount"> & {
  startedAt: number; origin: string; arrived?: boolean; supersededWords: string[]; documentTimeOrigin?: number;
};
type Reporter = (event: SearchOutcomeInput) => Promise<unknown>;
let memoryPending: PendingAttempt | null = null;
let reporter: Reporter | null = null;
let waiting: SearchOutcomeInput[] = [];
let observingHistory = false;
const now = () => performance.timeOrigin + performance.now();

function save(pending: PendingAttempt | null) {
  memoryPending = pending;
  try {
    if (pending) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Tab memory remains usable when storage is disabled. */ }
}

function read(): PendingAttempt | null {
  let pending = memoryPending;
  let readingStored = false;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      readingStored = true;
      const parsed = JSON.parse(raw) as Partial<PendingAttempt> | null;
      if (!parsed || !searchOutcomeInputSchema.safeParse({
        eventId: parsed.eventId, query: parsed.query, locale: parsed.locale,
        entryPoint: parsed.entryPoint, source: parsed.source, outcome: "cancelled", resultCount: 0,
      }).success || typeof parsed.startedAt !== "number" || !Number.isFinite(parsed.startedAt)
        || typeof parsed.origin !== "string" || !Array.isArray(parsed.supersededWords)
        || parsed.supersededWords.length > 8 || !parsed.supersededWords.every(word => typeof word === "string")
        || (parsed.documentTimeOrigin !== undefined && !Number.isFinite(parsed.documentTimeOrigin))) {
        save(null); return null;
      }
      pending = parsed as PendingAttempt;
    }
  } catch {
    if (readingStored) { save(null); return null; }
    // Storage access can be disabled; retain this document's in-memory marker.
  }
  if (pending && (now() < pending.startedAt || now() - pending.startedAt > MAX_ATTEMPT_MS)) {
    save(null); return null;
  }
  return pending;
}

function send(event: SearchOutcomeInput) {
  if (!navigator.onLine) return; // No persistent offline queue or reconnect replay.
  if (!reporter) { waiting = [...waiting, event].slice(-8); return; }
  try { void reporter(event).catch(() => {}); } catch { /* Telemetry cannot break search. */ }
}

// Result effects can run before the layout effect during hydration. Buffer only
// those few startup reports in memory, then flush once the client is available.
export function installSearchOutcomeReporter(next: Reporter) {
  observeHistory();
  reporter = next;
  const queued = waiting;
  waiting = [];
  queued.forEach(send);
  return () => { if (reporter === next) reporter = null; };
}

function finish(pending: PendingAttempt, outcome: SearchOutcomeInput["outcome"], source: SearchOutcomeInput["source"], resultCount = 0) {
  const event = searchOutcomeInputSchema.safeParse({
    eventId: pending.eventId, query: pending.query, locale: pending.locale,
    entryPoint: pending.entryPoint, source, outcome, resultCount,
  });
  save(null); // Consume before sending, including failed/offline reports.
  if (event.success) send(event.data);
}

export function cancelSearchOutcome() {
  const pending = read();
  if (pending) finish(pending, "cancelled", pending.source);
}

function observeHistory() {
  if (observingHistory) return;
  observingHistory = true;
  window.addEventListener("popstate", cancelSearchOutcome);
}

export function beginSearchOutcome(query: string, options: {
  locale: string; entryPoint: SearchOutcomeInput["entryPoint"]; waitForDocument?: boolean;
}) {
  const previous = read();
  if (previous) finish(previous, "superseded", previous.source);
  save(null);
  const parsed = outcomeQuerySchema.safeParse(query);
  if (!parsed.success || !["en", "tr"].includes(options.locale) || typeof crypto.randomUUID !== "function") return;
  observeHistory();
  save({
    eventId: crypto.randomUUID(), query: parsed.data, locale: options.locale as "en" | "tr",
    entryPoint: options.entryPoint, source: navigator.onLine ? "online" : "offline",
    startedAt: now(), origin: window.location.pathname + window.location.search,
    documentTimeOrigin: options.waitForDocument ? performance.timeOrigin : undefined,
    supersededWords: previous ? [...new Set([previous.query, ...previous.supersededWords])].slice(0, 8) : [],
  });
  window.dispatchEvent(new Event(SEARCH_OUTCOME_STARTED));
}

export function trackSearchOutcomeRoute(word: string, route: string) {
  const pending = read();
  if (!pending) return;
  const query = normalizeOutcomeQuery(word);
  if (pending.query === query || pending.supersededWords.includes(query)) save({ ...pending, arrived: true });
  else if (pending.arrived || pending.origin !== route) finish(pending, "cancelled", pending.source);
}

export function completeSearchOutcome(word: string, outcome: "resolved" | "no_result" | "error", source: SearchOutcomeInput["source"], resultCount = 0) {
  const pending = read();
  if (!pending || pending.query !== normalizeOutcomeQuery(word) || pending.documentTimeOrigin === performance.timeOrigin) return;
  finish(pending, outcome, source, resultCount);
}

export function matchesSearchOutcomeResults(query: string, words: string[]) {
  const normalized = normalizeOutcomeQuery(query);
  if (!normalized.includes("_")) return words.some(word => normalizeOutcomeQuery(word) === normalized);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp("^" + escaped.replace(/_/g, ".") + "$", "u");
  return words.some(word => pattern.test(normalizeOutcomeQuery(word)));
}
