/** @jest-environment node */
import { dashboardRangeSchema, readDashboardRange } from "../api/schemas/dashboard";
import { compareDashboardMetric, getDashboardWindow } from "../dashboard-window";

const now = new Date("2026-10-15T12:34:56.789Z");

test.each([7, 30, 90])("%d-day presets compare the same elapsed UTC time", days => {
  const window = getDashboardWindow({ range: `${days}d` as "7d" | "30d" | "90d" }, now);
  expect(window.days).toBe(days);
  expect(window.start.getUTCHours()).toBe(0);
  expect(window.end).toEqual(now);
  expect(window.partial).toBe(true);
  expect(window.end.getTime() - window.start.getTime()).toBe(window.previousEnd.getTime() - window.previousStart.getTime());
  expect(window.start.getTime() - window.previousStart.getTime()).toBe(days * 86_400_000);
});

test("a completed custom period includes its entire end date and has contiguous equal comparison bounds", () => {
  const window = getDashboardWindow({ range: "custom", start: "2024-02-28", end: "2024-03-01" }, now);
  expect(window).toMatchObject({
    start: new Date("2024-02-28T00:00:00Z"), end: new Date("2024-03-02T00:00:00Z"),
    previousStart: new Date("2024-02-25T00:00:00Z"), previousEnd: new Date("2024-02-28T00:00:00Z"),
    days: 3, partial: false, timeZone: "UTC",
  });
});

test("the selected current day is empty at UTC midnight with a zero-length comparison", () => {
  const window = getDashboardWindow({ range: "custom", start: "2026-10-15", end: "2026-10-15" }, new Date("2026-10-15T00:00:00Z"));
  expect(window.start).toEqual(window.end);
  expect(window.previousStart).toEqual(window.previousEnd);
  expect(window.partial).toBe(true);
});

test.each(["America/Los_Angeles", "Europe/Istanbul", "Pacific/Kiritimati"])("calendar boundaries stay in UTC in %s", zone => {
  const original = process.env.TZ;
  try {
    process.env.TZ = zone;
    const window = getDashboardWindow({ range: "custom", start: "2026-03-07", end: "2026-03-09" }, now);
    expect(window.days).toBe(3);
    expect(window.end.getTime() - window.start.getTime()).toBe(3 * 86_400_000);
    expect(window.start.toISOString()).toBe("2026-03-07T00:00:00.000Z");
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test.each([
  { range: "500d" },
  { range: "custom", start: "2026-02-30", end: "2026-03-01" },
  { range: "custom", start: "2026-10-15", end: "2026-10-14" },
  { range: "custom", start: "2026-01-01", end: "2026-04-01" },
  { range: "custom", start: "bad", end: "2026-10-15" },
  { range: "7d", extra: "unbounded" },
])("invalid or unbounded ranges are rejected: %p", input => {
  expect(dashboardRangeSchema.safeParse(input).success).toBe(false);
  expect(() => getDashboardWindow(input as never, now)).toThrow();
});

test("90 inclusive custom days are allowed; 91 and future dates are rejected", () => {
  expect(getDashboardWindow({ range: "custom", start: "2026-01-01", end: "2026-03-31" }, now).days).toBe(90);
  expect(() => getDashboardWindow({ range: "custom", start: "2026-10-15", end: "2026-10-16" }, now)).toThrow("futureRange");
  expect(readDashboardRange(new URLSearchParams("range=custom&start=2026-10-15&end=2026-10-16"), now))
    .toEqual({ selection: { range: "30d" }, error: "futureRange" });
});

test("URL validation falls back visibly and restores valid custom dates", () => {
  expect(readDashboardRange(new URLSearchParams("range=custom&start=bad&end=2001-02-02"), now).error).toBe("invalidRange");
  expect(readDashboardRange(new URLSearchParams("range=custom&start=2026-10-15&end=2026-10-01"), now).error).toBe("reversedRange");
  expect(readDashboardRange(new URLSearchParams("range=90d"), now)).toEqual({ selection: { range: "90d" }, error: null });
  expect(readDashboardRange(new URLSearchParams("range=custom&start=2026-10-01&end=2026-10-14"), now))
    .toEqual({ selection: { range: "custom", start: "2026-10-01", end: "2026-10-14" }, error: null });
});

test.each([
  [0, 0, 0, null], [5, 0, 5, null], [0, 5, -5, -100], [15, 10, 5, 50],
  [null, 10, null, null], [10, null, null, null],
])("comparisons preserve empty baselines: %s vs %s", (current, previous, difference, percentChange) => {
  expect(compareDashboardMetric(current, previous)).toEqual({ current, previous, difference, percentChange });
});
