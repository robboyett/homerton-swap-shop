ALTER TYPE "public"."item_status" ADD VALUE 'removed';--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "removed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "removed_reason" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "removed_at" timestamp with time zone;