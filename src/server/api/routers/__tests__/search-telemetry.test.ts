/** @jest-environment node */
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/src/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));
const mockLimit = jest.fn();
const mockTelemetryLimit = jest.fn();
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: class MockRatelimit {
  static configurations: Array<{ prefix: string; limiter: { limit: number; duration: string } }> = [];
  static slidingWindow = jest.fn((limit: number, duration: string) => ({ limit, duration }));
  private prefix: string;
  constructor(options: { prefix: string; limiter: { limit: number; duration: string } }) {
    MockRatelimit.configurations.push(options);
    this.prefix = options.prefix;
  }
  limit(identifier: string) {
    return (this.prefix === "@upstash/search-telemetry" ? mockTelemetryLimit : mockLimit)(identifier);
  }
} }));
jest.mock("superjson", () => ({ __esModule: true, default: {
  serialize: (json: unknown) => ({ json }),
  deserialize: ({ json }: { json: unknown }) => json,
} }));
jest.mock("@/src/server/dictionary-cache", () => ({ invalidateDictionaryCache: jest.fn() }));
jest.mock("@/src/server/word-cache", () => ({ invalidateWordCache: jest.fn() }));
jest.mock("@/src/server/word-query-latency", () => ({ getWordQueryLatency: jest.fn() }));

import { wordQueryLatencies } from "@/db/schema/word_query_latencies";
import { MAX_WORD_QUERY_LATENCY_MS } from "@/src/lib/word-query-latency-schema";
import { invalidateDictionaryCache } from "@/src/server/dictionary-cache";
import { invalidateWordCache } from "@/src/server/word-cache";
import { getWordQueryLatency } from "@/src/server/word-query-latency";
import { Ratelimit } from "@upstash/ratelimit";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { overviewAdminRouter } from "../admin/overview";
import { searchTelemetryRouter } from "../search-telemetry";

const router = createTRPCRouter({
  dictionaryRead: publicProcedure.query(() => "dictionary result"),
  searchTelemetry: searchTelemetryRouter,
  admin: createTRPCRouter({ overview: overviewAdminRouter }),
});
const event = { eventId: "018feca3-5853-4db5-a389-1d3991c7dc90", durationMs: 152, source: "online" as const };
const conflict = jest.fn();
const values = jest.fn(() => ({ onConflictDoNothing: conflict }));
const database = { insert: jest.fn(() => ({ values })), select: jest.fn() };
const caller = (role?: string, userAgent?: string) => router.createCaller({
  db: database,
  session: role ? { user: { id: "fixture-admin", role } } : null,
  headers: new Headers({ "cf-connecting-ip": "203.0.113.7", ...(userAgent ? { "user-agent": userAgent } : {}) }),
} as never);
let log: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockLimit.mockResolvedValue({ success: true });
  mockTelemetryLimit.mockResolvedValue({ success: true });
  conflict.mockResolvedValue([]);
  log = jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => log.mockRestore());

test("anonymous ingestion persists only the allowed sample and deduplicates on event ID", async () => {
  await expect(caller().searchTelemetry.recordWordQueryLatency(event)).resolves.toEqual({ accepted: true });
  await caller().searchTelemetry.recordWordQueryLatency(event);
  expect(database.insert).toHaveBeenCalledWith(wordQueryLatencies);
  expect(values.mock.calls).toEqual([[event], [event]]);
  expect(conflict).toHaveBeenCalledWith({ target: wordQueryLatencies.eventId });
  expect(mockTelemetryLimit).toHaveBeenCalledWith("203.0.113.7");
  expect(mockLimit).not.toHaveBeenCalled();
  expect(invalidateDictionaryCache).not.toHaveBeenCalled();
  expect(invalidateWordCache).not.toHaveBeenCalled();
});

test.each([
  { eventId: "invalid" },
  { durationMs: -1 },
  { durationMs: 1.5 },
  { durationMs: Infinity },
  { durationMs: NaN },
  { durationMs: MAX_WORD_QUERY_LATENCY_MS + 1 },
  { source: "unknown" },
  { word: "private query" },
  { userId: "private account" },
  { receivedAt: "2040-01-01" },
])("rejects malformed or identifying telemetry before database writes: %p", async (invalid) => {
  await expect(caller().searchTelemetry.recordWordQueryLatency({ ...event, ...invalid } as never))
    .rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(database.insert).not.toHaveBeenCalled();
});

test.each([0, MAX_WORD_QUERY_LATENCY_MS])("accepts offline durations at the boundary: %d", async (durationMs) => {
  await caller().searchTelemetry.recordWordQueryLatency({ ...event, durationMs, source: "offline" });
  expect(values).toHaveBeenCalledWith({ ...event, durationMs, source: "offline" });
});

test("telemetry has its own 30-per-minute bucket alongside the existing dictionary burst budget", () => {
  const configurations = (Ratelimit as unknown as {
    configurations: Array<{ prefix: string; limiter: { limit: number; duration: string } }>;
  }).configurations;
  expect(configurations).toEqual(expect.arrayContaining([
    expect.objectContaining({ prefix: "@upstash/ratelimit", limiter: { limit: 120, duration: "10 s" } }),
    expect.objectContaining({ prefix: "@upstash/search-telemetry", limiter: { limit: 30, duration: "1 m" } }),
  ]));
});

test("bot-labelled reports invoke the telemetry limiter while SEO dictionary reads retain the exemption", async () => {
  const bot = caller(undefined, "Googlebot");
  await bot.searchTelemetry.recordWordQueryLatency(event);
  expect(mockTelemetryLimit).toHaveBeenCalledWith("203.0.113.7");
  await expect(bot.dictionaryRead()).resolves.toBe("dictionary result");
  expect(mockLimit).not.toHaveBeenCalled();
});

test("telemetry exhaustion prevents even bot-labelled writes and preserves the dictionary quota", async () => {
  mockTelemetryLimit.mockResolvedValue({ success: false, reset: Date.now() + 10_000 });
  await expect(caller(undefined, "Googlebot").searchTelemetry.recordWordQueryLatency(event))
    .rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  await expect(caller().searchTelemetry.recordWordQueryLatency(event))
    .rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  expect(database.insert).not.toHaveBeenCalled();
  await expect(caller().dictionaryRead()).resolves.toBe("dictionary result");
  expect(mockLimit).toHaveBeenCalledWith("203.0.113.7");
});

test.each([undefined, "user", "moderator"])("latency metrics require an administrator: %s", async (role) => {
  await expect(caller(role).admin.overview.getWordQueryLatency()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(getWordQueryLatency).not.toHaveBeenCalled();
});

test("the admin latency query propagates its own failure independently of overview", async () => {
  (getWordQueryLatency as jest.Mock).mockRejectedValue(new Error("latency table unavailable"));
  await expect(caller("admin").admin.overview.getWordQueryLatency()).rejects.toThrow("latency table unavailable");
  const query = {
    where: () => query,
    groupBy: () => query,
    orderBy: () => query,
    innerJoin: () => query,
    limit: () => query,
    then: (resolve: (rows: unknown[]) => void) => resolve([]),
  };
  database.select.mockReturnValue({ from: () => query });
  await expect(caller("admin").admin.overview.getDashboardOverview()).resolves.toMatchObject({
    metrics: { totalWords: 0, searchesToday: 0 },
    searchAnalytics: { topSearchedWords: [] },
  });
  expect(getWordQueryLatency).toHaveBeenCalledTimes(1);
});
