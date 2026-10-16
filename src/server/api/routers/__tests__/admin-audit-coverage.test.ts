/** @jest-environment node */
jest.mock("@/db", () => ({ db: {} }));
jest.mock("@/src/env.mjs", () => ({ env: { NEXT_PUBLIC_APP_URL: "http://localhost:3100", NEXT_PUBLIC_URL: "http://localhost:3100" } }));
jest.mock("@/src/lib/auth", () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: class { static slidingWindow = jest.fn(); limit = jest.fn().mockResolvedValue({ success: true }); } }));
jest.mock("superjson", () => ({ __esModule: true, default: { serialize: (json: unknown) => ({ json }), deserialize: ({ json }: { json: unknown }) => json } }));
jest.mock("@/src/server/dictionary-cache", () => ({ invalidateDictionaryCache: jest.fn() }));
jest.mock("@/src/server/word-cache", () => ({ invalidateWordCache: jest.fn() }));
import { appRouter } from "../../root";
import { ADMIN_AUDIT_REGISTRY, ADMIN_AUDIT_EXCLUSIONS } from "@/src/server/admin-audit-registry";

test("every exposed administrative mutation has an audit descriptor or a documented exclusion", () => {
  const procedures = appRouter._def.procedures;
  const administrative = Object.entries(procedures).filter(([, procedure]) => procedure._def.type === "mutation" && procedure._def.meta?.administrative).map(([path]) => path).sort();
  expect(administrative).toEqual([...Object.keys(ADMIN_AUDIT_REGISTRY), ...Object.keys(ADMIN_AUDIT_EXCLUSIONS)].sort());
  expect(procedures["admin.feedback.updateType"]._def.meta?.administrative).toBe(true);
});
