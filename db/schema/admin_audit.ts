import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type AuditValue = string | number | boolean | null | AuditValue[] | { [key: string]: AuditValue };
export type AuditChange = { field: string; before: AuditValue; after: AuditValue };

// Snapshot identifiers deliberately have no target/user FK: deleting an account
// or content must not erase the attribution of a retained administrative action.
export const adminAuditEvents = pgTable("admin_audit_events", {
  id: serial("id").primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  actorId: text("actor_id").notNull(),
  actorLabel: text("actor_label").notNull(),
  action: text("action", { enum: ["create", "update", "delete", "approve", "reject", "assign", "revoke"] }).notNull(),
  procedure: text("procedure").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  targetLabel: text("target_label").notNull(),
  requestId: integer("request_id"),
  changes: jsonb("changes").$type<AuditChange[]>().notNull(),
  truncated: integer("truncated").notNull().default(0),
}, table => [
  index("admin_audit_events_time_id_idx").on(table.occurredAt, table.id),
  index("admin_audit_events_actor_time_idx").on(table.actorId, table.occurredAt),
  index("admin_audit_events_target_time_idx").on(table.targetType, table.targetId, table.occurredAt),
  check("admin_audit_events_action_check", sql`${table.action} IN ('create', 'update', 'delete', 'approve', 'reject', 'assign', 'revoke')`),
  check("admin_audit_events_payload_check", sql`jsonb_typeof(${table.changes}) = 'array' AND jsonb_array_length(${table.changes}) <= 40 AND octet_length(${table.changes}::text) <= 49152`),
  check("admin_audit_events_identifiers_check", sql`char_length(${table.actorId}) BETWEEN 1 AND 128 AND char_length(${table.actorLabel}) BETWEEN 1 AND 160 AND char_length(${table.targetId}) BETWEEN 1 AND 160 AND char_length(${table.targetLabel}) BETWEEN 1 AND 200 AND char_length(${table.procedure}) BETWEEN 1 AND 160 AND char_length(${table.targetType}) BETWEEN 1 AND 60`),
  check("admin_audit_events_truncated_check", sql`${table.truncated} IN (0, 1)`),
]);

// Initialized atomically with the first recorded action; it survives retention.
export const adminAuditCoverage = pgTable("admin_audit_coverage", {
  id: integer("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [check("admin_audit_coverage_singleton_check", sql`${table.id} = 1`)]);
