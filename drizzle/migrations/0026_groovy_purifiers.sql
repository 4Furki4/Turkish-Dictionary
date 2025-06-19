ALTER TABLE "saved_words" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "saved_words" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "saved_words" ALTER COLUMN "createdAt" SET NOT NULL;