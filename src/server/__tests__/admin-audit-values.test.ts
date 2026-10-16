/** @jest-environment node */
import { auditChanges, boundedAuditValue } from "../admin-audit-values";

test("diffs database fields with explicit creation/deletion null values and preserves no-ops", () => {
  expect(auditChanges(null, { role: "admin", removed: null })).toEqual({ changes: [{ field: "role", before: null, after: "admin" }], truncated: 0 });
  expect(auditChanges({ role: "user" }, { role: "admin" }).changes).toEqual([{ field: "role", before: "user", after: "admin" }]);
  expect(auditChanges({ status: "open" }, { status: "open" })).toEqual({ changes: [], truncated: 0 });
  expect(auditChanges({ name: "entry" }, null).changes[0]).toEqual({ field: "name", before: "entry", after: null });
});
test("marks omitted rows, text, deep values and byte budgets without malformed JSON", () => {
  const state = { truncated: false };
  expect(boundedAuditValue("a".repeat(600), state)).toHaveLength(512);
  expect(state.truncated).toBe(true);
  const rows = auditChanges(null, { meanings: Array.from({ length: 41 }, (_, id) => ({ id, meaning: "词".repeat(600) })) });
  expect(rows.truncated).toBe(1);
  expect(Buffer.byteLength(JSON.stringify(rows.changes))).toBeLessThanOrEqual(40_000);
  expect(auditChanges({ snapshotTruncated: true }, {}).truncated).toBe(1);
});
test("strips unsafe control characters while retaining newlines and timestamps", () => {
  const state = { truncated: false };
  expect(boundedAuditValue("a\u0000\u0007b\nc", state)).toBe("ab\nc");
  expect(boundedAuditValue(new Date("2026-10-15T00:00:00Z"), state)).toBe("2026-10-15T00:00:00.000Z");
});

test("truncation never leaves an invalid Unicode surrogate in a JSONB value", () => {
  const state = { truncated: false };
  expect(boundedAuditValue("a" + "😀".repeat(256), state)).toBe("a" + "😀".repeat(255));
  expect(state.truncated).toBe(true);
});
