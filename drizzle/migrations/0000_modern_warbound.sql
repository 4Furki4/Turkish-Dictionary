DO $$ BEGIN
 CREATE TYPE "partOfSpeech" AS ENUM('isim', 'fiil', 'sıfat', 'zarf', 'zamir', 'ünlem', 'edat', 'bağlaç');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('user', 'moderator', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT account_provider_providerAccountId_pk PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "examples" (
	"id" serial PRIMARY KEY NOT NULL,
	"sentence" text NOT NULL,
	"author_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meaning_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"attribute" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meanings_attributes" (
	"meaning_id" serial NOT NULL,
	"attribute_id" serial NOT NULL,
	CONSTRAINT meanings_attributes_meaning_id_attribute_id_pk PRIMARY KEY("meaning_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meanings" (
	"id" serial PRIMARY KEY NOT NULL,
	"definition" text NOT NULL,
	"exampleSentence" text,
	"exampleAuthor" varchar(255),
	"word_id" integer NOT NULL,
	"imageUrl" varchar(255),
	"part_of_speech_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "part_of_speechs" (
	"id" serial PRIMARY KEY NOT NULL,
	"partOfSpeech" "partOfSpeech" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pronounciations" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" integer,
	"user_id" text,
	"audio_url" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "related_words" (
	"word_id" integer,
	"related_word_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_words" (
	"user_id" text NOT NULL,
	"word_id" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT saved_words_user_id_word_id_pk PRIMARY KEY("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"username" varchar(255),
	"password" varchar(510),
	"role" "role" DEFAULT 'user' NOT NULL
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
CREATE TABLE IF NOT EXISTS "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phonetic" varchar(255),
	"root" varchar(255),
	"attributes" varchar(255)[],
	"created_at" date DEFAULT now(),
	"updated_at" date,
	"related_phrases" text[],
	"prefix" varchar(255),
	"suffix" varchar(255)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examples" ADD CONSTRAINT "examples_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings_attributes" ADD CONSTRAINT "meanings_attributes_meaning_id_meanings_id_fk" FOREIGN KEY ("meaning_id") REFERENCES "meanings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings_attributes" ADD CONSTRAINT "meanings_attributes_attribute_id_meaning_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "meaning_attributes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings" ADD CONSTRAINT "meanings_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings" ADD CONSTRAINT "meanings_part_of_speech_id_part_of_speechs_id_fk" FOREIGN KEY ("part_of_speech_id") REFERENCES "part_of_speechs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
 ALTER TABLE "related_words" ADD CONSTRAINT "related_words_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_words" ADD CONSTRAINT "related_words_related_word_id_words_id_fk" FOREIGN KEY ("related_word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
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
