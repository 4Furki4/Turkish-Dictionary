CREATE TABLE "search_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" integer NOT NULL,
	"user_id" text,
	"search_timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "search_logs_word_id_idx" ON "search_logs" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "search_logs_timestamp_idx" ON "search_logs" USING btree ("search_timestamp");