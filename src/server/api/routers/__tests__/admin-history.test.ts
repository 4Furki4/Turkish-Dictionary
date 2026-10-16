/** @jest-environment node */
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/src/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: class { static slidingWindow = jest.fn(); limit = jest.fn().mockResolvedValue({ success: true }); } }));
jest.mock("superjson", () => ({ __esModule: true, default: { serialize: (json: unknown) => ({ json }), deserialize: ({ json }: { json: unknown }) => json } }));
jest.mock("@/src/server/dictionary-cache", () => ({ invalidateDictionaryCache: jest.fn() }));
jest.mock("@/src/server/word-cache", () => ({ invalidateWordCache: jest.fn() }));
jest.mock("@/src/server/admin-history", () => ({ getAdminHistory: jest.fn(), getAdminHistoryDetail: jest.fn() }));
import { adminHistoryRouter } from "../admin/history";
import { getAdminHistory, getAdminHistoryDetail } from "@/src/server/admin-history";
import { adminHistoryInputSchema, readAdminHistoryFilters, AUDIT_TARGETS } from "../../schemas/admin-history";
import { ADMIN_AUDIT_REGISTRY, ADMIN_AUDIT_TARGETS, ADMIN_AUDIT_EXCLUSIONS } from "@/src/server/admin-audit-registry";

const database = {};
const caller = (role?: string) => adminHistoryRouter.createCaller({ db: database, session: role ? { user: { id: "reviewer", role } } : null, headers: new Headers() } as never);
beforeEach(() => jest.clearAllMocks());
test.each([undefined, "user", "moderator"])("%s cannot inspect history or details", async role => {
  await expect(caller(role).list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(caller(role).detail({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(getAdminHistory).not.toHaveBeenCalled(); expect(getAdminHistoryDetail).not.toHaveBeenCalled();
});
test("admin uses bounded validated defaults and explicit detail IDs", async () => {
  await caller("admin").list({ actorId: " actor " });
  expect(getAdminHistory).toHaveBeenCalledWith(database, expect.objectContaining({ actorId: "actor", pageSize: 10, action: "all" }));
  await caller("admin").detail({ id: 42 });
  expect(getAdminHistoryDetail).toHaveBeenCalledWith(database, 42);
});
test.each([{ page: 0 }, { page: 1001 }, { pageSize: 26 }, { actorId: "a".repeat(129) }, { targetId: "a".repeat(161) }, { targetType: "session" }, { action: "restore" }, { asOf: new Date("9999-01-01") }])("rejects invalid history input %p", input => expect(adminHistoryInputSchema.safeParse(input).success).toBe(false));
test("URL state and the documented entity inventory stay aligned", () => {
  expect(readAdminHistoryFilters(new URLSearchParams("actorId=abc&targetType=word&targetId=10&action=delete&page=2&pageSize=5")).filters).toMatchObject({ actorId: "abc", targetType: "word", targetId: "10", action: "delete", page: 2, pageSize: 5 });
  expect(readAdminHistoryFilters(new URLSearchParams("action=invalid")).error).toBe(true);
  expect([...AUDIT_TARGETS].sort()).toEqual(ADMIN_AUDIT_TARGETS);
  expect(Object.keys(ADMIN_AUDIT_REGISTRY).length).toBeGreaterThan(50);
  expect(Object.keys(ADMIN_AUDIT_EXCLUSIONS)).toEqual(["admin.searchGaps.review"]);
});
