ALTER TYPE "public"."feedback_status" ADD VALUE 'implemented' BEFORE 'closed';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'testing' BEFORE 'closed';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'verified' BEFORE 'closed';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'rejected' BEFORE 'closed';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'duplicate' BEFORE 'closed';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'fixed' BEFORE 'closed';--> statement-breakpoint
ALTER TYPE "public"."feedback_status" ADD VALUE 'wont_implement' BEFORE 'closed';--> statement-breakpoint
ALTER TYPE "public"."feedback_type" ADD VALUE 'recommendation' BEFORE 'other';