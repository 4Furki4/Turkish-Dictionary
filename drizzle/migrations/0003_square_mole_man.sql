ALTER TABLE "roots" DROP CONSTRAINT "roots_word_id_words_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roots" ADD CONSTRAINT "roots_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "words" USING btree (name);