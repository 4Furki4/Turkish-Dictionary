CREATE TABLE IF NOT EXISTS "meanings" (
	"id" serial PRIMARY KEY NOT NULL,
	"definition" text NOT NULL,
	"exampleSentence" text NOT NULL,
	"exampleAuthor" varchar(255) NOT NULL,
	"word_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phonetic" varchar(255),
	"root" varchar(255),
	"attributes" varchar(255),
	"audio" varchar(255),
	"createdAt" date NOT NULL,
	"updatedAt" date NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings" ADD CONSTRAINT "meanings_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
