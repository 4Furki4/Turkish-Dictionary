CREATE TABLE IF NOT EXISTS "languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"language_en" varchar(255) NOT NULL,
	"language_tr" varchar(255) NOT NULL,
	"language_code" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roots" RENAME COLUMN "language" TO "language_id";--> statement-breakpoint
ALTER TABLE "roots" ALTER COLUMN "language_id" SET DATA TYPE integer USING(language_id::integer);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roots" ADD CONSTRAINT "roots_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
