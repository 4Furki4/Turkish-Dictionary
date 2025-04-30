ALTER TABLE "related_words" ADD COLUMN "relation_type" varchar(255) DEFAULT 'relatedWord';--> statement-breakpoint
ALTER TABLE "related_words" ADD COLUMN "request_type" varchar(255) DEFAULT 'relatedWord';--> statement-breakpoint
ALTER TABLE "related_words" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "related_words" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "related_words" ADD CONSTRAINT "related_words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;