CREATE TABLE IF NOT EXISTS "related_words" (
	"id" serial PRIMARY KEY NOT NULL,
	"related_word_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words_to_related_words" (
	"word_id" integer NOT NULL,
	"related_word_id" integer NOT NULL,
	CONSTRAINT words_to_related_words_word_id_related_word_id PRIMARY KEY("word_id","related_word_id")
);
--> statement-breakpoint
ALTER TABLE "meanings" ALTER COLUMN "word_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_words" ADD CONSTRAINT "related_words_related_word_id_words_id_fk" FOREIGN KEY ("related_word_id") REFERENCES "words"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words_to_related_words" ADD CONSTRAINT "words_to_related_words_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words_to_related_words" ADD CONSTRAINT "words_to_related_words_related_word_id_related_words_id_fk" FOREIGN KEY ("related_word_id") REFERENCES "related_words"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
