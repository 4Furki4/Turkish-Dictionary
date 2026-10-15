/** @jest-environment node */
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/src/env.mjs", () => ({ env: { CRON_SECRET: "fixture-secret" } }));
jest.mock("@/src/server/search-outcomes", () => ({ pruneSearchOutcomes: jest.fn() }));
jest.mock("@/src/server/admin-audit", () => ({ pruneAdminAudit: jest.fn() }));
jest.mock("@/src/lib/cron/update-view-counts", () => ({ runUpdateViewCounts: jest.fn() }));

import { GET } from "../api/update-view-counts/route";
import { pruneSearchOutcomes } from "@/src/server/search-outcomes";
import { runUpdateViewCounts } from "@/src/lib/cron/update-view-counts";
import { pruneAdminAudit } from "@/src/server/admin-audit";

const request = (authorized = true) => new Request("http://localhost/api/update-view-counts", {
  headers: authorized ? { authorization: "Bearer fixture-secret" } : {},
});

beforeEach(() => {
  (pruneSearchOutcomes as jest.Mock).mockReset().mockResolvedValue({ deleted: 2 });
  (pruneAdminAudit as jest.Mock).mockReset().mockResolvedValue({ deleted: 3 });
  (runUpdateViewCounts as jest.Mock).mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test("cron authentication precedes retention and aggregation", async () => {
  expect((await GET(request(false))).status).toBe(401);
  expect(pruneSearchOutcomes).not.toHaveBeenCalled();
  expect(pruneAdminAudit).not.toHaveBeenCalled();
  expect(runUpdateViewCounts).not.toHaveBeenCalled();
});

test("retention runs before aggregation even when there are no views to process", async () => {
  const response = await GET(request());
  expect(await response.json()).toEqual({ success: true, searchOutcomeRetention: { deleted: 2 }, adminAuditRetention: { deleted: 3 } });
  expect((pruneSearchOutcomes as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((runUpdateViewCounts as jest.Mock).mock.invocationCallOrder[0]);
  expect((pruneAdminAudit as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((runUpdateViewCounts as jest.Mock).mock.invocationCallOrder[0]);
});

test("retention failure is visible to the cron monitor", async () => {
  (pruneSearchOutcomes as jest.Mock).mockRejectedValue(new Error("retention failed"));
  const response = await GET(request());
  expect(response.status).toBe(500);
  expect(runUpdateViewCounts).not.toHaveBeenCalled();
});

test("view aggregation failure does not prevent the preceding retention pass", async () => {
  (runUpdateViewCounts as jest.Mock).mockRejectedValue(new Error("aggregation failed"));
  expect((await GET(request())).status).toBe(500);
  expect(pruneSearchOutcomes).toHaveBeenCalledTimes(1);
});

test("audit retention failure is visible and prevents a false successful cron response", async () => {
  (pruneAdminAudit as jest.Mock).mockRejectedValue(new Error("audit retention failed"));
  expect((await GET(request())).status).toBe(500);
  expect(runUpdateViewCounts).not.toHaveBeenCalled();
});
