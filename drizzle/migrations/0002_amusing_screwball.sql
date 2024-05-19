ALTER TABLE "examples" RENAME COLUMN "word_id" TO "meaning_id";--> statement-breakpoint
ALTER TABLE "examples" DROP CONSTRAINT "examples_word_id_words_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examples" ADD CONSTRAINT "examples_meaning_id_meanings_id_fk" FOREIGN KEY ("meaning_id") REFERENCES "public"."meanings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
