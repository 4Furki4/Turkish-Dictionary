CREATE TABLE "admin_audit_coverage" (
	"id" integer PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_audit_coverage_singleton_check" CHECK ("admin_audit_coverage"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "admin_audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"actor_label" text NOT NULL,
	"action" text NOT NULL,
	"procedure" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"target_label" text NOT NULL,
	"request_id" integer,
	"changes" jsonb NOT NULL,
	"truncated" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "admin_audit_events_action_check" CHECK ("admin_audit_events"."action" IN ('create', 'update', 'delete', 'approve', 'reject', 'assign', 'revoke')),
	CONSTRAINT "admin_audit_events_payload_check" CHECK (jsonb_typeof("admin_audit_events"."changes") = 'array' AND jsonb_array_length("admin_audit_events"."changes") <= 40 AND octet_length("admin_audit_events"."changes"::text) <= 49152),
	CONSTRAINT "admin_audit_events_identifiers_check" CHECK (char_length("admin_audit_events"."actor_id") BETWEEN 1 AND 128 AND char_length("admin_audit_events"."actor_label") BETWEEN 1 AND 160 AND char_length("admin_audit_events"."target_id") BETWEEN 1 AND 160 AND char_length("admin_audit_events"."target_label") BETWEEN 1 AND 200 AND char_length("admin_audit_events"."procedure") BETWEEN 1 AND 160 AND char_length("admin_audit_events"."target_type") BETWEEN 1 AND 60),
	CONSTRAINT "admin_audit_events_truncated_check" CHECK ("admin_audit_events"."truncated" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX "admin_audit_events_time_id_idx" ON "admin_audit_events" USING btree ("occurred_at","id");--> statement-breakpoint
CREATE INDEX "admin_audit_events_actor_time_idx" ON "admin_audit_events" USING btree ("actor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "admin_audit_events_target_time_idx" ON "admin_audit_events" USING btree ("target_type","target_id","occurred_at");