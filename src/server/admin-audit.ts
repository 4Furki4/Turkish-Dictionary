import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { lt, sql } from "drizzle-orm";
import { adminAuditCoverage, adminAuditEvents } from "@/db/schema/admin_audit";
import { ADMIN_AUDIT_REGISTRY, auditIdentifier, createdAuditIdentifier, type AuditDatabase, type AuditTransaction } from "./admin-audit-registry";
import { ADMIN_AUDIT_RETENTION_DAYS, auditChanges } from "./admin-audit-values";

function label(value: unknown, fallback: string, limit: number) {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : fallback;
  return text.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, limit).replace(/[\uD800-\uDBFF]$/, "") || fallback.slice(0, limit);
}

export async function auditAdminMutation<T>(database: AuditDatabase, path: string, rawInput: unknown,
  actor: { id: string; name?: string | null; username?: string | null },
  execute: (tx: AuditTransaction) => Promise<{ result: T; output: unknown }>): Promise<T> {
  const descriptor = ADMIN_AUDIT_REGISTRY[path];
  if (!descriptor) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Administrative history coverage is not configured." });
  const input = rawInput && typeof rawInput === "object" && !Array.isArray(rawInput) ? rawInput as Record<string, unknown> : {};
  return database.transaction(async tx => {
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
    const isCreate = descriptor.action === "create" || descriptor.action === "assign";
    const beforeId = isCreate ? null : auditIdentifier(descriptor.inputKey, input);
    const before = beforeId ? await descriptor.entity.read(tx, beforeId) : null;
    const { result, output } = await execute(tx);
    if (output instanceof TRPCError) throw output;
    if (output && typeof output === "object" && "success" in output && output.success === false) return result;
    const id = isCreate ? (descriptor.createKey ? auditIdentifier(descriptor.createKey, input) : createdAuditIdentifier(output)) : beforeId;
    if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The administrative change could not be attributed to its target." });
    const after = descriptor.action === "delete" || descriptor.action === "revoke" ? null : await descriptor.entity.read(tx, id);
    // A missing target or unresolved creation must not become a success event.
    if (!before && !after) throw new TRPCError({ code: "NOT_FOUND", message: "Administrative target not found." });
    const target = after ?? before;
    const storedId = id.length <= 160 ? id : `sha256:${createHash("sha256").update(id).digest("hex")}`;
    const [event] = await tx.insert(adminAuditEvents).values({
      actorId: actor.id,
      actorLabel: label(actor.username ?? actor.name, actor.id, 160),
      action: descriptor.action, procedure: path, targetType: descriptor.entity.type,
      targetId: storedId, targetLabel: label(target?.[descriptor.entity.label], `${descriptor.entity.type} #${storedId}`, 200),
      requestId: descriptor.entity.type === "request" ? Number(id) : null,
      ...auditChanges(before, after),
    }).returning({ occurredAt: adminAuditEvents.occurredAt });
    await tx.insert(adminAuditCoverage).values({ id: 1, startedAt: event.occurredAt }).onConflictDoNothing();
    return result;
  });
}

export async function pruneAdminAudit(database: Pick<AuditDatabase, "transaction">, now = new Date()) {
  const cutoff = new Date(now.getTime() - ADMIN_AUDIT_RETENTION_DAYS * 86_400_000);
  return database.transaction(async tx => {
    await tx.execute(sql`SET LOCAL statement_timeout = '30s'`);
    await tx.execute(sql`SET LOCAL lock_timeout = '1s'`);
    const removed = await tx.delete(adminAuditEvents).where(lt(adminAuditEvents.occurredAt, cutoff));
    return { deleted: removed.count };
  });
}
