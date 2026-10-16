import type { db } from "@/db";
import { and, count, desc, eq, gte, lt, lte } from "drizzle-orm";
import { adminAuditCoverage, adminAuditEvents as events } from "@/db/schema/admin_audit";
import type { z } from "zod";
import type { adminHistoryInputSchema } from "./api/schemas/admin-history";
import { getDashboardWindow } from "./dashboard-window";
import { ADMIN_AUDIT_RETENTION_DAYS } from "./admin-audit-values";
import { ADMIN_AUDIT_EXCLUSIONS, ADMIN_AUDIT_REGISTRY } from "./admin-audit-registry";

export async function getAdminHistory(database: typeof db, input: z.infer<typeof adminHistoryInputSchema>, now = new Date()) {
  const generatedAt = input.asOf ?? now;
  const window = getDashboardWindow(input.selection, generatedAt);
  const retainedFrom = new Date(now.getTime() - ADMIN_AUDIT_RETENTION_DAYS * 86_400_000);
  const where = and(
    gte(events.occurredAt, window.start), lt(events.occurredAt, window.end),
    gte(events.occurredAt, retainedFrom), lte(events.occurredAt, generatedAt),
    input.actorId ? eq(events.actorId, input.actorId) : undefined,
    input.targetType !== "all" ? eq(events.targetType, input.targetType) : undefined,
    input.targetId ? eq(events.targetId, input.targetId) : undefined,
    input.action !== "all" ? eq(events.action, input.action) : undefined,
  );
  const [totals] = await database.select({ total: count() }).from(events).where(where);
  const page = Math.min(input.page, Math.max(1, Math.ceil(totals.total / input.pageSize)));
  const items = await database.select({ id: events.id, occurredAt: events.occurredAt, actorId: events.actorId,
    actorLabel: events.actorLabel, action: events.action, targetType: events.targetType,
    targetId: events.targetId, targetLabel: events.targetLabel, requestId: events.requestId,
    truncated: events.truncated,
  }).from(events).where(where).orderBy(desc(events.occurredAt), desc(events.id)).limit(input.pageSize).offset((page - 1) * input.pageSize);
  const [coverage] = await database.select().from(adminAuditCoverage).where(eq(adminAuditCoverage.id, 1));
  return { generatedAt, window, retainedFrom, collectionStartedAt: coverage?.startedAt ?? null,
    coveredProcedures: Object.keys(ADMIN_AUDIT_REGISTRY).sort(), excludedProcedures: Object.keys(ADMIN_AUDIT_EXCLUSIONS),
    items, total: totals.total, page, pageSize: input.pageSize };
}

export async function getAdminHistoryDetail(database: typeof db, id: number, now = new Date()) {
  const [event] = await database.select().from(events).where(and(eq(events.id, id),
    gte(events.occurredAt, new Date(now.getTime() - ADMIN_AUDIT_RETENTION_DAYS * 86_400_000)), lte(events.occurredAt, now)));
  return event ?? null;
}
