/** @jest-environment node */
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inArray } from "drizzle-orm";
import { wordQueryLatencies } from "@/db/schema/word_query_latencies";
import { fillWordQueryLatencyDays, getWordQueryLatency, wordQueryLatencyWindow } from "../word-query-latency";

test.each([
  "2026-10-13T00:00:00.000Z",
  "2026-10-13T23:59:59.999Z",
  "2026-10-14T02:59:59.999+03:00",
])("the window follows UTC regardless of the visitor's date: %s", (time) => {
  expect(wordQueryLatencyWindow(new Date(time))).toMatchObject({
    start: new Date("2026-09-14T00:00:00.000Z"),
    end: new Date(time),
    days: 30,
    timeZone: "UTC",
  });
});

test("zero-filling preserves real zero latency and leaves unsampled days null across a leap day", () => {
  const rows = fillWordQueryLatencyDays(new Date("2024-02-01T00:00:00Z"), [
    { date: "2024-02-29", sampleCount: 1, averageMs: 0, p95Ms: 0 },
  ]);
  expect(rows).toHaveLength(30);
  expect(rows[0]).toEqual({ date: "2024-02-01", sampleCount: 0, averageMs: null, p95Ms: null });
  expect(rows[28]).toEqual({ date: "2024-02-29", sampleCount: 1, averageMs: 0, p95Ms: 0 });
  expect(rows[29].date).toBe("2024-03-01");
});

const databaseUrl = process.env.WORD_QUERY_LATENCY_TEST_DATABASE_URL;
const databaseTest = databaseUrl ? test : test.skip;

databaseTest("PostgreSQL calculates UTC daily and raw-sample window percentiles, and deduplicates IDs", async () => {
  // This integration case is permitted only on the existing disposable CI DB.
  const target = new URL(databaseUrl!);
  if (target.hostname !== "127.0.0.1" || target.port !== "54329" || target.pathname !== "/turkish_dictionary_ci") {
    throw new Error("Latency tests require the disposable loopback CI database");
  }
  const client = postgres(databaseUrl!, { max: 1 });
  const database = drizzle(client);
  const ids = Array.from({ length: 6 }, () => randomUUID());
  try {
    await client`SET TIME ZONE 'Europe/Istanbul'`;
    const samples = [
      [10, "2040-01-01T00:00:00Z"],
      [20, "2040-01-01T01:00:00Z"],
      [30, "2040-01-01T23:59:59Z"],
      [1000, "2040-01-30T11:59:59Z"],
      [100000, "2039-12-31T23:59:59Z"],
      [100000, "2040-01-31T00:00:00Z"],
    ] as const;
    await database.insert(wordQueryLatencies).values(samples.map(([durationMs, receivedAt], index) => ({
      eventId: ids[index], durationMs, receivedAt: new Date(receivedAt), source: index % 2 === 0 ? "online" : "offline",
    })));
    await database.insert(wordQueryLatencies).values({ eventId: ids[0], durationMs: 9999, source: "online" })
      .onConflictDoNothing({ target: wordQueryLatencies.eventId });
    const metrics = await getWordQueryLatency(database, new Date("2040-01-30T12:00:00Z"));
    expect(metrics.summary.sampleCount).toBe(4);
    expect(metrics.summary.averageMs).toBe(265);
    expect(metrics.summary.p95Ms).toBeCloseTo(854.5);
    expect(metrics.daily).toHaveLength(30);
    expect(metrics.daily[0]).toEqual({ date: "2040-01-01", sampleCount: 3, averageMs: 20, p95Ms: 29 });
    expect(metrics.daily[1]).toEqual({ date: "2040-01-02", sampleCount: 0, averageMs: null, p95Ms: null });
    expect(metrics.daily[29]).toEqual({ date: "2040-01-30", sampleCount: 1, averageMs: 1000, p95Ms: 1000 });
    const empty = await getWordQueryLatency(database, new Date("2041-01-30T12:00:00Z"));
    expect(empty.summary).toEqual({ sampleCount: 0, averageMs: null, p95Ms: null });
    expect(empty.daily.every((day) => day.sampleCount === 0 && day.p95Ms === null)).toBe(true);
  } finally {
    await database.delete(wordQueryLatencies).where(inArray(wordQueryLatencies.eventId, ids));
    await client.end({ timeout: 5 });
  }
});
