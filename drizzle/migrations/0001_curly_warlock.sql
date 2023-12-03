CREATE TABLE IF NOT EXISTS "pronounciations" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" integer,
	"user_id" text,
	"audio_url" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "word_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"attribute" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words_attributes" (
	"word_id" integer,
	"attribute_id" integer,
	CONSTRAINT words_attributes_word_id_attribute_id_pk PRIMARY KEY("word_id","attribute_id")
);
--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN IF EXISTS "audio";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pronounciations" ADD CONSTRAINT "pronounciations_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pronounciations" ADD CONSTRAINT "pronounciations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words_attributes" ADD CONSTRAINT "words_attributes_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words_attributes" ADD CONSTRAINT "words_attributes_attribute_id_word_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "word_attributes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
