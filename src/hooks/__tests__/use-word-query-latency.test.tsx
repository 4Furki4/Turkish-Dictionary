import { act, renderHook } from "@testing-library/react";
import { useWordQueryLatency } from "@/src/hooks/use-word-query-latency";
import { beginWordQueryLatency, cancelWordQueryLatency, trackWordQueryRoute } from "@/src/lib/word-query-latency";

const mockReport = jest.fn();
const mockClient = { searchTelemetry: { recordWordQueryLatency: { mutate: mockReport } } };
jest.mock("@/src/trpc/react", () => ({ api: { useUtils: () => ({ client: mockClient }) } }));

let elapsed = 0;
let nextFrame = 0;
let frames: Map<number, FrameRequestCallback>;
const paint = () => {
  for (let i = 0; i < 2; i++) {
    const callbacks = [...frames.values()];
    frames.clear();
    act(() => callbacks.forEach(callback => callback(elapsed)));
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  elapsed = 0;
  frames = new Map();
  jest.spyOn(performance, "now").mockImplementation(() => elapsed);
  Object.defineProperty(crypto, "randomUUID", { configurable: true, value: jest.fn(() => `00000000-0000-4000-8000-${String(++nextFrame).padStart(12, "0")}`) });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  window.history.replaceState({}, "", "/tr/arama/kitap");
  window.requestAnimationFrame = jest.fn(callback => { frames.set(++nextFrame, callback); return nextFrame; });
  window.cancelAnimationFrame = jest.fn(id => { frames.delete(id); });
  mockReport.mockResolvedValue({ accepted: true });
  // Reset any memory fallback from a previous case.
  beginWordQueryLatency("");
});

afterEach(() => { jest.restoreAllMocks(); });

it("includes submission waits and reports once after the result paints", () => {
  beginWordQueryLatency(" KİTAP ");
  elapsed = 640;
  const { rerender } = renderHook(() => useWordQueryLatency(["kitap"], "online"));
  expect(mockReport).not.toHaveBeenCalled();
  paint();
  expect(mockReport).toHaveBeenCalledWith({ eventId: expect.any(String), durationMs: 640, source: "online" });
  rerender();
  paint();
  expect(mockReport).toHaveBeenCalledTimes(1);
  expect(sessionStorage.length).toBe(0);
});

it("never records direct visits, prefetches or stale mismatched results", () => {
  const { rerender } = renderHook(({ words }) => useWordQueryLatency(words, "online"), { initialProps: { words: ["kitap"] } });
  paint();
  beginWordQueryLatency("kalem");
  rerender({ words: ["kitap"] });
  paint();
  expect(mockReport).not.toHaveBeenCalled();
});

it("a newer submission cannot be consumed by the older result's paint callback", () => {
  beginWordQueryLatency("kitap");
  const { rerender } = renderHook(({ words }) => useWordQueryLatency(words, "online"), { initialProps: { words: ["kitap"] } });
  beginWordQueryLatency("kalem");
  elapsed = 100;
  paint();
  expect(mockReport).not.toHaveBeenCalled();
  window.history.replaceState({}, "", "/tr/arama/kalem");
  rerender({ words: ["kalem"] });
  paint();
  expect(mockReport).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 100 }));
});

it("excludes expired and background-tab waits", () => {
  beginWordQueryLatency("kitap");
  elapsed = 120_001;
  const { rerender } = renderHook(() => useWordQueryLatency(["kitap"], "online"));
  paint();
  beginWordQueryLatency("kitap");
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  document.dispatchEvent(new Event("visibilitychange"));
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  elapsed += 200;
  rerender();
  paint();
  expect(mockReport).not.toHaveBeenCalled();
});

it("still completes a search when storage is blocked and telemetry rejects", async () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
  mockReport.mockRejectedValue(new Error("offline"));
  beginWordQueryLatency("kitap");
  elapsed = 75;
  renderHook(() => useWordQueryLatency(["kitap"], "offline"));
  paint();
  await Promise.resolve();
  expect(mockReport).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 75, source: "offline" }));
});

it("uses the buffered server-rendered paint instead of later hydration time", () => {
  beginWordQueryLatency("kitap");
  elapsed = 800;
  const heading = document.createElement("h1");
  heading.textContent = "kitap";
  const original = window.PerformanceObserver;
  Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: class {
    static supportedEntryTypes = ["element"];
    constructor(private callback: (list: unknown) => void) {}
    observe() { this.callback({ getEntries: () => [{ identifier: "dictionary-word-result", element: heading, renderTime: 150 }] }); }
    disconnect() {}
  } });
  try {
    renderHook(() => useWordQueryLatency(["kitap"], "online"));
    paint();
    expect(mockReport).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 150 }));
    expect(mockReport).toHaveBeenCalledTimes(1);
  } finally { Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: original }); }
});

it("discards failed and abandoned searches before a later direct visit", () => {
  beginWordQueryLatency("kitap");
  cancelWordQueryLatency("kitap");
  elapsed = 500;
  renderHook(() => useWordQueryLatency(["kitap"], "online"));
  paint();
  beginWordQueryLatency("kitap");
  trackWordQueryRoute("kalem", "/tr/arama/kalem");
  elapsed = 45_000;
  renderHook(() => useWordQueryLatency(["kitap"], "online"));
  paint();
  expect(mockReport).not.toHaveBeenCalled();
});

it("discards a marker when the destination is already hidden at hydration", () => {
  beginWordQueryLatency("kitap");
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  const { rerender } = renderHook(() => useWordQueryLatency(["kitap"], "online"));
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  elapsed = 45_000;
  rerender();
  paint();
  expect(mockReport).not.toHaveBeenCalled();
});

it("returning to the origin after reaching a search route abandons the marker", () => {
  window.history.replaceState({}, "", "/tr");
  beginWordQueryLatency("kitap");
  trackWordQueryRoute("kitap", "/tr/arama/kitap");
  trackWordQueryRoute("", "/tr");
  window.history.replaceState({}, "", "/tr/arama/kitap");
  elapsed = 45_000;
  renderHook(() => useWordQueryLatency(["kitap"], "online"));
  paint();
  expect(mockReport).not.toHaveBeenCalled();
});

it("a superseded navigation committing cannot cancel the latest search", () => {
  window.history.replaceState({}, "", "/tr");
  beginWordQueryLatency("kitap");
  beginWordQueryLatency("kalem");
  trackWordQueryRoute("kitap", "/tr/arama/kitap");
  window.history.replaceState({}, "", "/tr/arama/kitap");
  const { rerender } = renderHook(({ words }) => useWordQueryLatency(words, "online"), { initialProps: { words: ["kitap"] } });
  paint();
  expect(mockReport).not.toHaveBeenCalled();
  window.history.replaceState({}, "", "/tr/arama/kalem");
  trackWordQueryRoute("kalem", "/tr/arama/kalem");
  elapsed = 500;
  rerender({ words: ["kalem"] });
  paint();
  expect(mockReport).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 500 }));
});

it("a departing card cannot complete a full navigation to the same word", () => {
  renderHook(() => useWordQueryLatency(["kitap"], "online"));
  beginWordQueryLatency("kitap", { waitForDocument: true });
  elapsed = 203;
  paint();
  expect(mockReport).not.toHaveBeenCalled();
  expect(sessionStorage.length).toBe(1);
});

it("the destination includes the full document wait before reporting its result", () => {
  beginWordQueryLatency("kitap", { waitForDocument: true });
  const origin = performance.timeOrigin;
  Object.defineProperty(performance, "timeOrigin", { configurable: true, value: origin + 1000 });
  try {
    elapsed = 250;
    renderHook(() => useWordQueryLatency(["kitap"], "online"));
    paint();
    expect(mockReport).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 1250 }));
    expect(sessionStorage.length).toBe(0);
  } finally {
    Object.defineProperty(performance, "timeOrigin", { configurable: true, value: origin });
  }
});
