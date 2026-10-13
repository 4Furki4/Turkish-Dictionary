CREATE TABLE "word_query_latencies" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"duration_ms" integer NOT NULL,
	"source" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "word_query_latencies_duration_check" CHECK ("word_query_latencies"."duration_ms" >= 0 AND "word_query_latencies"."duration_ms" <= 120000),
	CONSTRAINT "word_query_latencies_source_check" CHECK ("word_query_latencies"."source" IN ('online', 'offline'))
);
--> statement-breakpoint
CREATE INDEX "word_query_latencies_received_at_idx" ON "word_query_latencies" USING btree ("received_at");