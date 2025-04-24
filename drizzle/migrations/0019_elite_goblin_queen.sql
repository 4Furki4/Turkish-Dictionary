ALTER TABLE "related_words" ALTER COLUMN "created_at" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "meanings" ADD COLUMN "created_at" date DEFAULT now();--> statement-breakpoint
ALTER TABLE "meanings" ADD COLUMN "updated_at" date;--> statement-breakpoint
ALTER TABLE "related_phrases" ADD COLUMN "created_at" date DEFAULT now();--> statement-breakpoint
ALTER TABLE "related_phrases" ADD COLUMN "updated_at" date;--> statement-breakpoint
ALTER TABLE "related_words" ADD COLUMN "updated_at" date;