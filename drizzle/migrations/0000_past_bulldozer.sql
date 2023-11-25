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
	CONSTRAINT account_provider_providerAccountId PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meanings" (
	"id" serial PRIMARY KEY NOT NULL,
	"definition" text NOT NULL,
	"exampleSentence" text,
	"exampleAuthor" varchar(255),
	"word_id" integer NOT NULL,
	"imageUrl" varchar(255),
	"partOfSpeech" "partOfSpeech" NOT NULL,
	"attributes" varchar(255)[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"username" varchar(255) NOT NULL,
	"password" varchar(510),
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" "role" DEFAULT 'user'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_to_groups" (
	"user_id" text NOT NULL,
	"word_id" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT users_to_groups_user_id_word_id PRIMARY KEY("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phonetic" varchar(255),
	"root" varchar(255),
	"attributes" varchar(255)[],
	"audio" varchar(255),
	"created_at" date DEFAULT now(),
	"updated_at" date,
	"related_words" varchar(255)[],
	"related_phrases" text[]
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "users_to_groups" ADD CONSTRAINT "users_to_groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_groups" ADD CONSTRAINT "users_to_groups_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
