ALTER TYPE "public"."entity_type" ADD VALUE 'pronunciations';--> statement-breakpoint
CREATE TABLE "request_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_votes" ADD CONSTRAINT "request_votes_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_votes" ADD CONSTRAINT "request_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;