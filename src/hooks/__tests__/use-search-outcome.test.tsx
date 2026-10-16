import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { useSearchOutcomeResult } from "@/src/hooks/use-search-outcome";
import { beginSearchOutcome, cancelSearchOutcome, completeSearchOutcome, installSearchOutcomeReporter, trackSearchOutcomeRoute } from "@/src/lib/search-outcome";
import { outcomeQuerySchema, searchOutcomeInputSchema } from "@/src/lib/search-outcome-schema";

jest.mock("@/src/trpc/react", () => ({ api: {} }));
const report = jest.fn<Promise<unknown>, [unknown]>();
let elapsed = 0;
let counter = 0;
let detach: () => void;
const begin = (query = "kitap", waitForDocument = false) => beginSearchOutcome(query, { locale: "tr", entryPoint: "search", waitForDocument });

beforeEach(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  jest.spyOn(performance, "now").mockImplementation(() => elapsed);
  Object.defineProperty(crypto, "randomUUID", { configurable: true, value: () => "00000000-0000-4000-8000-" + String(++counter).padStart(12, "0") });
  cancelSearchOutcome();
  sessionStorage.clear();
  detach = installSearchOutcomeReporter(report);
  report.mockClear().mockResolvedValue({ accepted: true });
  window.history.replaceState({}, "", "/tr/arama/kitap");
  elapsed = 0;
});
afterEach(() => { cancelSearchOutcome(); detach(); jest.restoreAllMocks(); });

test("NFC, Turkish casing, spaces and apostrophes group equivalent terms", () => {
  expect(outcomeQuerySchema.parse("  IŞIK  ")).toBe("ışık");
  expect(outcomeQuerySchema.parse("I\u0307STANBUL")).toBe("istanbul");
  expect(outcomeQuerySchema.parse("Ankara’nın   yolu")).toBe("ankara'nın yolu");
});

test.each(["", "_ _", "a".repeat(101), "name@example.com", "https://example.com", "www.example.com", "+90 555 123 4567", "123456", "<script>x</script>", "kitap\nkalem", "ki\u200btap", "ki\u202etap"])("rejects unsuitable query text without transforming it into a term: %p", query => {
  expect(outcomeQuerySchema.safeParse(query).success).toBe(false);
  begin(query);
  completeSearchOutcome(query, "resolved", "online", 1);
  expect(report).not.toHaveBeenCalled();
});

test("consumes one normalized attempt across repeated effects and strict-mode mounts", () => {
  begin(" KİTAP ");
  const { rerender } = renderHook(() => useSearchOutcomeResult({ outcome: "resolved", source: "online", resultWords: ["kitap"] }), { wrapper: StrictMode });
  rerender();
  expect(report).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledWith({ eventId: expect.any(String), query: "kitap", locale: "tr", entryPoint: "search", source: "online", outcome: "resolved", resultCount: 1 });
  expect(sessionStorage.getItem("search-outcome:pending")).toBeNull();
});

test("direct visits and unmatched stale results never create a completion", () => {
  const { rerender } = renderHook(() => useSearchOutcomeResult({ outcome: "resolved", source: "online", resultWords: ["kitap"] }));
  begin("kalem");
  rerender();
  expect(report).not.toHaveBeenCalled();
});

test("superseded navigation commits cannot consume or cancel the newer attempt", () => {
  begin("kitap");
  begin("kalem");
  trackSearchOutcomeRoute("kitap", "/tr/arama/kitap");
  completeSearchOutcome("kitap", "resolved", "online", 1);
  completeSearchOutcome("kalem", "resolved", "offline", 1);
  expect(report.mock.calls.map(([event]) => event)).toEqual([
    expect.objectContaining({ query: "kitap", outcome: "superseded", resultCount: 0 }),
    expect.objectContaining({ query: "kalem", outcome: "resolved", source: "offline", resultCount: 1 }),
  ]);
});

test.each(["no_result", "error"] as const)("records %s once without counting it as a resolved search", outcome => {
  begin();
  renderHook(() => useSearchOutcomeResult({ word: "kitap", outcome, source: "online" }));
  completeSearchOutcome("kitap", "resolved", "online", 1);
  expect(report).toHaveBeenCalledTimes(1);
  expect(report).toHaveBeenCalledWith(expect.objectContaining({ outcome, resultCount: 0 }));
});

test("a stale failure component cannot finish a different route's attempt", () => {
  begin("kalem");
  window.history.replaceState({}, "", "/tr/arama/kalem");
  renderHook(() => useSearchOutcomeResult({ word: "kitap", outcome: "no_result", source: "online" }));
  expect(report).not.toHaveBeenCalled();
});

test("a full document navigation waits for the destination, even for the same word", () => {
  renderHook(() => useSearchOutcomeResult({ outcome: "resolved", source: "online", resultWords: ["kitap"] }));
  act(() => begin("kitap", true));
  expect(report).not.toHaveBeenCalled();
  const origin = performance.timeOrigin;
  Object.defineProperty(performance, "timeOrigin", { configurable: true, value: origin + 1000 });
  try {
    completeSearchOutcome("kitap", "resolved", "online", 1);
    expect(report).toHaveBeenCalledTimes(1);
  } finally { Object.defineProperty(performance, "timeOrigin", { configurable: true, value: origin }); }
});

test("leaving the search and browser history cancellation cannot inflate completed counts", () => {
  begin();
  trackSearchOutcomeRoute("kitap", "/tr/arama/kitap");
  trackSearchOutcomeRoute("", "/tr");
  begin();
  window.dispatchEvent(new PopStateEvent("popstate"));
  expect(report.mock.calls.map(([event]) => event)).toEqual([
    expect.objectContaining({ outcome: "cancelled", resultCount: 0 }),
    expect.objectContaining({ outcome: "cancelled", resultCount: 0 }),
  ]);
});

test("connected local-pattern results report displayed count, not a dictionary-wide count", () => {
  window.history.replaceState({}, "", "/tr/arama?word=k_tap");
  begin("k_tap");
  renderHook(() => useSearchOutcomeResult({ outcome: "resolved", source: "offline", resultWords: ["kitap"] }));
  expect(report).toHaveBeenCalledWith(expect.objectContaining({ query: "k_tap", source: "offline", resultCount: 1 }));
});

test("offline outcomes are consumed without a reconnect replay", () => {
  begin();
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  completeSearchOutcome("kitap", "resolved", "offline", 1);
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  completeSearchOutcome("kitap", "resolved", "offline", 1);
  expect(report).not.toHaveBeenCalled();
});

test("storage failure and telemetry rejection do not escape into search", async () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  report.mockRejectedValue(new Error("unavailable"));
  begin();
  expect(() => completeSearchOutcome("kitap", "resolved", "online", 1)).not.toThrow();
  await Promise.resolve();
  expect(report).toHaveBeenCalledTimes(1);
});

test("a result effect preceding the reporting layout is flushed once", () => {
  detach();
  begin();
  completeSearchOutcome("kitap", "resolved", "online", 1);
  expect(report).not.toHaveBeenCalled();
  detach = installSearchOutcomeReporter(report);
  expect(report).toHaveBeenCalledTimes(1);
});

test("expired attempts cannot attach to a later direct visit", () => {
  begin();
  elapsed = 120_001;
  completeSearchOutcome("kitap", "resolved", "online", 1);
  expect(report).not.toHaveBeenCalled();
});

test("corrupted stored markers cannot fall back to an earlier attempt", () => {
  begin();
  sessionStorage.setItem("search-outcome:pending", "{bad json");
  completeSearchOutcome("kitap", "resolved", "online", 1);
  expect(report).not.toHaveBeenCalled();
});

test("a second submission can use an already displayed cached result", () => {
  renderHook(() => useSearchOutcomeResult({ outcome: "resolved", source: "offline", resultWords: ["kitap"] }));
  act(() => begin());
  act(() => begin());
  expect(report).toHaveBeenCalledTimes(2);
  expect(report.mock.calls.map(([event]) => event)).toEqual([
    expect.objectContaining({ outcome: "resolved", source: "offline" }),
    expect.objectContaining({ outcome: "resolved", source: "offline" }),
  ]);
});

test.each([
  { outcome: "resolved", resultCount: 0 }, { outcome: "no_result", resultCount: 1 },
  { outcome: "error", resultCount: 1 }, { resultCount: 1001 },
  { userId: "person" }, { receivedAt: "2040-01-01" }, { url: "https://example.com" },
])("the ingestion contract rejects contradictory counts and identifying fields: %p", invalid => {
  expect(searchOutcomeInputSchema.safeParse({ eventId: crypto.randomUUID(), query: "kitap", locale: "tr", entryPoint: "search", source: "online", outcome: "resolved", resultCount: 1, ...invalid }).success).toBe(false);
});
