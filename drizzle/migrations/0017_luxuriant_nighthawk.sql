ALTER TABLE "related_words" DROP CONSTRAINT "related_words_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "related_words" ADD CONSTRAINT "related_words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;