DROP INDEX "name_idx";--> statement-breakpoint
CREATE INDEX "name_idx" ON "words" USING gin (name gin_trgm_ops);