ALTER TABLE "pronounciations" RENAME TO "pronunciations";--> statement-breakpoint
ALTER TABLE "pronunciations" DROP CONSTRAINT "pronounciations_word_id_words_id_fk";
--> statement-breakpoint
ALTER TABLE "pronunciations" DROP CONSTRAINT "pronounciations_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pronunciations" ADD CONSTRAINT "pronunciations_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pronunciations" ADD CONSTRAINT "pronunciations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;