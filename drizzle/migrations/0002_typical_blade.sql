CREATE TABLE IF NOT EXISTS "related_phrases" (
	"phrase_id" integer NOT NULL,
	"related_phrase_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN IF EXISTS "related_phrases";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_phrases" ADD CONSTRAINT "related_phrases_phrase_id_words_id_fk" FOREIGN KEY ("phrase_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_phrases" ADD CONSTRAINT "related_phrases_related_phrase_id_words_id_fk" FOREIGN KEY ("related_phrase_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
