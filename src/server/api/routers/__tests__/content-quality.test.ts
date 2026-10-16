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
jest.mock("@/src/server/content-quality", () => ({ getContentQuality: jest.fn() }));
import { getContentQuality } from "@/src/server/content-quality";
import { contentQualityAdminRouter } from "../admin/content-quality";
import { contentQualityInputSchema, readContentQualityFilters } from "../../schemas/content-quality";

const database = {};
const caller = (role?: string) => contentQualityAdminRouter.createCaller({
  db: database, session: role ? { user: { id: "reviewer", role } } : null, headers: new Headers(),
} as never);
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, "log").mockImplementation(() => {}); });
afterEach(() => jest.restoreAllMocks());

test.each([undefined, "user", "moderator"])("%s cannot inspect content quality", async role => {
  await expect(caller(role).list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(getContentQuality).not.toHaveBeenCalled();
});
test("admin reads get validated defaults and no mutation surface", async () => {
  await caller("admin").list({ q: "  kitap  " });
  expect(getContentQuality).toHaveBeenCalledWith(database, expect.objectContaining({ q: "kitap", gap: "any", demand: "all", sort: "demand_desc", pageSize: 10 }));
});
test.each([{ page: 0 }, { page: 1001 }, { pageSize: 26 }, { q: "a".repeat(101) }, { gap: "invalid" }, { demand: "any" }, { sort: "sql" }, { asOf: new Date("9999-01-01") }, { selection: { range: "custom", start: "2026-01-01", end: "2026-12-31" } }])("rejects invalid input %p", input => {
  expect(contentQualityInputSchema.safeParse(input).success).toBe(false);
});
test("URL state restores bounded filters and reports a fallback for invalid state", () => {
  expect(readContentQualityFilters(new URLSearchParams("q=kitap&gap=examples&demand=unsearched&sort=demand_asc&page=2&pageSize=5")))
    .toEqual({ error: false, filters: { q: "kitap", gap: "examples", demand: "unsearched", sort: "demand_asc", page: 2, pageSize: 5 } });
  expect(readContentQualityFilters(new URLSearchParams("page=99999")).error).toBe(true);
});
