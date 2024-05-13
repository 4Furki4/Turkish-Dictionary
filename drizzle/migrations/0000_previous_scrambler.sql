DO $$ BEGIN
 CREATE TYPE "public"."partOfSpeech" AS ENUM('isim', 'fiil', 'sıfat', 'zarf', 'zamir', 'ünlem', 'edat', 'bağlaç');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."action" AS ENUM('create', 'update', 'delete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."entity_type" AS ENUM('words', 'meanings', 'roots', 'related_words', 'part_of_speechs', 'examples', 'authors', 'word_attributes', 'meaning_attributes');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('user', 'moderator', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
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
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"request_type" varchar(255) DEFAULT 'author'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "examples" (
	"id" serial PRIMARY KEY NOT NULL,
	"sentence" text NOT NULL,
	"author_id" integer,
	"request_type" varchar(255) DEFAULT 'example',
	"word_id" integer NOT NULL
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
	"request_type" varchar(255) DEFAULT 'meaningAttribute',
	CONSTRAINT "meanings_attributes_meaning_id_attribute_id_pk" PRIMARY KEY("meaning_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meanings" (
	"id" serial PRIMARY KEY NOT NULL,
	"meaning" text NOT NULL,
	"word_id" integer NOT NULL,
	"imageUrl" varchar(255),
	"part_of_speech_id" integer NOT NULL,
	"request_type" varchar(255) DEFAULT 'meaning'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "part_of_speechs" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_of_speech" "partOfSpeech" NOT NULL,
	"request_type" varchar(255) DEFAULT 'partOfSpeech'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pronounciations" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"audio_url" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "related_phrases" (
	"phrase_id" integer NOT NULL,
	"related_phrase_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "related_words" (
	"word_id" integer NOT NULL,
	"related_word_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" integer,
	"action" "action" NOT NULL,
	"new_data" jsonb,
	"request_date" timestamp DEFAULT now(),
	"status" "status" DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roots" (
	"id" serial PRIMARY KEY NOT NULL,
	"root" varchar(255),
	"language" varchar(255) NOT NULL,
	"user_id" text,
	"word_id" integer NOT NULL,
	"request_type" varchar(255) DEFAULT 'root'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_words" (
	"user_id" text NOT NULL,
	"word_id" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "saved_words_user_id_word_id_pk" PRIMARY KEY("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
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
	"attribute" varchar(255) NOT NULL,
	"request_type" varchar(255) DEFAULT 'wordAttribute'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words_attributes" (
	"word_id" integer NOT NULL,
	"attribute_id" integer NOT NULL,
	CONSTRAINT "words_attributes_word_id_attribute_id_pk" PRIMARY KEY("word_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phonetic" varchar(255),
	"root_id" integer,
	"created_at" date DEFAULT now(),
	"updated_at" date,
	"prefix" varchar(255),
	"suffix" varchar(255),
	"request_type" varchar(255) DEFAULT 'word'
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examples" ADD CONSTRAINT "examples_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examples" ADD CONSTRAINT "examples_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings_attributes" ADD CONSTRAINT "meanings_attributes_meaning_id_meanings_id_fk" FOREIGN KEY ("meaning_id") REFERENCES "public"."meanings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings_attributes" ADD CONSTRAINT "meanings_attributes_attribute_id_meaning_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."meaning_attributes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings" ADD CONSTRAINT "meanings_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meanings" ADD CONSTRAINT "meanings_part_of_speech_id_part_of_speechs_id_fk" FOREIGN KEY ("part_of_speech_id") REFERENCES "public"."part_of_speechs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pronounciations" ADD CONSTRAINT "pronounciations_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pronounciations" ADD CONSTRAINT "pronounciations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_phrases" ADD CONSTRAINT "related_phrases_phrase_id_words_id_fk" FOREIGN KEY ("phrase_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_phrases" ADD CONSTRAINT "related_phrases_related_phrase_id_words_id_fk" FOREIGN KEY ("related_phrase_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_words" ADD CONSTRAINT "related_words_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "related_words" ADD CONSTRAINT "related_words_related_word_id_words_id_fk" FOREIGN KEY ("related_word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roots" ADD CONSTRAINT "roots_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words_attributes" ADD CONSTRAINT "words_attributes_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "words_attributes" ADD CONSTRAINT "words_attributes_attribute_id_word_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."word_attributes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
