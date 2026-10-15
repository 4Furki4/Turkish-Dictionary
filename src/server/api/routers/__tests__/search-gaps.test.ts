/** @jest-environment node */
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/src/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: class {
  static slidingWindow = jest.fn();
  limit = jest.fn().mockResolvedValue({ success: true });
} }));
jest.mock("superjson", () => ({ __esModule: true, default: {
  serialize: (json: unknown) => ({ json }), deserialize: ({ json }: { json: unknown }) => json,
} }));
jest.mock("@/src/server/dictionary-cache", () => ({ invalidateDictionaryCache: jest.fn() }));
jest.mock("@/src/server/word-cache", () => ({ invalidateWordCache: jest.fn() }));
jest.mock("@/src/server/search-gaps", () => ({ getSearchGaps: jest.fn(), reviewSearchGap: jest.fn() }));

import { getSearchGaps, reviewSearchGap } from "@/src/server/search-gaps";
import { searchGapsAdminRouter } from "../admin/search-gaps";
import { readSearchGapFilters, searchGapReviewSchema, searchGapsInputSchema } from "../../schemas/search-gaps";
import { normalizeOutcomeQuery } from "@/src/lib/search-outcome-schema";

const database = {};
const caller = (role?: string) => searchGapsAdminRouter.createCaller({
  db: database, session: role ? { user: { id: "reviewer", role } } : null, headers: new Headers(),
} as never);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test.each([undefined, "user", "moderator"])("%s cannot read queries or record review decisions", async role => {
  await expect(caller(role).list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(caller(role).review({ query: "kitap", status: "reviewed" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(getSearchGaps).not.toHaveBeenCalled();
  expect(reviewSearchGap).not.toHaveBeenCalled();
});

test("review actor is server-owned and terms use the collection normalizer", async () => {
  await caller("admin").review({ query: "  IĞDIR  ", status: "linked", targetType: "word", targetId: 42 });
  expect(reviewSearchGap).toHaveBeenCalledWith(database, { query: "ığdır", status: "linked", targetType: "word", targetId: 42 }, "reviewer");
  await expect(caller("admin").review({ query: "kitap", status: "reviewed", updatedBy: "someone-else" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
});

test.each([
  { page: 0 }, { page: 1001 }, { pageSize: 1000 }, { q: "a".repeat(101) },
  { source: "anywhere" }, { sort: "sql" }, { asOf: new Date("9999-01-01") },
  { selection: { range: "custom", start: "2026-01-01", end: "2026-12-31" } },
])("rejects unbounded or invalid list input: %p", input => {
  expect(searchGapsInputSchema.safeParse(input).success).toBe(false);
});

test("URL filters normalize Turkish casing and safely restore valid state", () => {
  const result = readSearchGapFilters(new URLSearchParams("q=%20IĞDIR%20&source=offline&kind=word&status=linked&sort=recent&page=2"));
  expect(result.error).toBe(false);
  expect(result.filters).toMatchObject({ q: "ığdır", source: "offline", status: "linked", sort: "recent", page: 2 });
  expect(readSearchGapFilters(new URLSearchParams("page=100000&source=invalid")).error).toBe(true);
  expect(normalizeOutcomeQuery("İZ")).not.toBe(normalizeOutcomeQuery("IZ"));
  expect(normalizeOutcomeQuery("IĞDIR")).toBe(normalizeOutcomeQuery("ığdır"));
});

test.each([
  { status: "linked", targetType: "word", targetId: 0 },
  { status: "linked", targetType: "word", targetId: 1.5 },
  { status: "linked", targetType: "external-url", targetId: 1 },
  { status: "reviewed", targetType: "word", targetId: 1 },
  { status: "open", targetId: 1 },
  { status: "dismissed", query: "person@example.com" },
])("rejects invalid or identifying review input: %p", input => {
  expect(searchGapReviewSchema.safeParse({ query: "kitap", ...input }).success).toBe(false);
});
