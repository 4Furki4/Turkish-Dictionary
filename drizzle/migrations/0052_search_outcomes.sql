CREATE TABLE "search_outcome_daily_totals" (
	"day" date NOT NULL,
	"locale" text NOT NULL,
	"entry_point" text NOT NULL,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"outcome" text NOT NULL,
	"count" bigint NOT NULL,
	CONSTRAINT "search_outcome_daily_totals_pk" PRIMARY KEY("day","locale","entry_point","source","kind","outcome"),
	CONSTRAINT "search_outcome_daily_count_check" CHECK ("search_outcome_daily_totals"."count" > 0),
	CONSTRAINT "search_outcome_daily_locale_check" CHECK ("search_outcome_daily_totals"."locale" IN ('tr', 'en')),
	CONSTRAINT "search_outcome_daily_entry_point_check" CHECK ("search_outcome_daily_totals"."entry_point" IN ('search', 'navbar')),
	CONSTRAINT "search_outcome_daily_source_check" CHECK ("search_outcome_daily_totals"."source" IN ('online', 'offline')),
	CONSTRAINT "search_outcome_daily_kind_check" CHECK ("search_outcome_daily_totals"."kind" IN ('word', 'pattern')),
	CONSTRAINT "search_outcome_daily_outcome_check" CHECK ("search_outcome_daily_totals"."outcome" IN ('resolved', 'no_result', 'error', 'cancelled', 'superseded'))
);
--> statement-breakpoint
CREATE TABLE "search_outcomes" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"locale" text NOT NULL,
	"entry_point" text NOT NULL,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"outcome" text NOT NULL,
	"result_count" integer NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_outcomes_query_length_check" CHECK (char_length("search_outcomes"."query") BETWEEN 1 AND 100),
	CONSTRAINT "search_outcomes_locale_check" CHECK ("search_outcomes"."locale" IN ('tr', 'en')),
	CONSTRAINT "search_outcomes_entry_point_check" CHECK ("search_outcomes"."entry_point" IN ('search', 'navbar')),
	CONSTRAINT "search_outcomes_source_check" CHECK ("search_outcomes"."source" IN ('online', 'offline')),
	CONSTRAINT "search_outcomes_kind_check" CHECK ("search_outcomes"."kind" IN ('word', 'pattern')),
	CONSTRAINT "search_outcomes_result_check" CHECK (("search_outcomes"."outcome" = 'resolved' AND "search_outcomes"."result_count" BETWEEN 1 AND 1000) OR ("search_outcomes"."outcome" IN ('no_result', 'error', 'cancelled', 'superseded') AND "search_outcomes"."result_count" = 0))
);
--> statement-breakpoint
CREATE INDEX "search_outcomes_received_at_idx" ON "search_outcomes" USING btree ("received_at");