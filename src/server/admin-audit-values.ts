import type { AuditChange, AuditValue } from "@/db/schema/admin_audit";

export const ADMIN_AUDIT_RETENTION_DAYS = 365;
export const AUDIT_TEXT_LIMIT = 512;
const LIMIT = 40;

export function boundedAuditValue(input: unknown, state: { truncated: boolean }, depth = 0): AuditValue {
  if (input === null || input === undefined) return null;
  if (input instanceof Date) return input.toISOString();
  if (typeof input === "boolean") return input;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input === "string") {
    const clean = input.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
    if (clean.length > AUDIT_TEXT_LIMIT) state.truncated = true;
    // A cut between UTF-16 surrogate halves is invalid PostgreSQL JSONB.
    return clean.slice(0, AUDIT_TEXT_LIMIT).replace(/[\uD800-\uDBFF]$/, "");
  }
  if (depth >= 4) { state.truncated = true; return "[truncated]"; }
  if (Array.isArray(input)) {
    if (input.length > LIMIT) state.truncated = true;
    return input.slice(0, LIMIT).map(value => boundedAuditValue(value, state, depth + 1));
  }
  if (typeof input === "object") {
    const entries = Object.entries(input);
    if (entries.length > LIMIT) state.truncated = true;
    return Object.fromEntries(entries.slice(0, LIMIT).map(([key, value]) => [key, boundedAuditValue(value, state, depth + 1)]));
  }
  return null;
}

// Callers supply only explicitly selected, allowlisted database fields. Never
// pass mutation inputs, sessions, credentials or arbitrary request.newData here.
export function auditChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const state = { truncated: Boolean(before?.snapshotTruncated || after?.snapshotTruncated) };
  const changes: AuditChange[] = [];
  for (const field of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    if (field === "snapshotTruncated") continue;
    const left = boundedAuditValue(before?.[field], state);
    const right = boundedAuditValue(after?.[field], state);
    if (JSON.stringify(left) !== JSON.stringify(right)) changes.push({ field, before: left, after: right });
  }
  if (changes.length > LIMIT) state.truncated = true;
  // Retain whole fields up to the byte budget, never malformed/truncated JSON.
  let selected = changes.slice(0, LIMIT);
  while (Buffer.byteLength(JSON.stringify(selected), "utf8") > 40_000) { selected = selected.slice(0, -1); state.truncated = true; }
  return { changes: selected, truncated: state.truncated ? 1 : 0 };
}
