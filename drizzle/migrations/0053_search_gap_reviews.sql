CREATE TABLE "search_gap_reviews" (
	"query" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"target_type" text,
	"target_id" integer,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_gap_reviews_query_length_check" CHECK (char_length("search_gap_reviews"."query") BETWEEN 1 AND 100),
	CONSTRAINT "search_gap_reviews_status_check" CHECK ("search_gap_reviews"."status" IN ('reviewed', 'dismissed', 'linked')),
	CONSTRAINT "search_gap_reviews_target_check" CHECK ((
    "search_gap_reviews"."status" = 'linked' AND "search_gap_reviews"."target_type" IS NOT NULL
    AND "search_gap_reviews"."target_type" IN ('word', 'correction', 'request') AND "search_gap_reviews"."target_id" IS NOT NULL AND "search_gap_reviews"."target_id" > 0
  ) OR ("search_gap_reviews"."status" IN ('reviewed', 'dismissed') AND "search_gap_reviews"."target_type" IS NULL AND "search_gap_reviews"."target_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "search_gap_reviews" ADD CONSTRAINT "search_gap_reviews_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "search_gap_reviews_updated_at_idx" ON "search_gap_reviews" USING btree ("updated_at");