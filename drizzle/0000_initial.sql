CREATE TYPE "public"."age_band" AS ENUM('0-3', '4-6', '7-9', '10+');--> statement-breakpoint
CREATE TYPE "public"."genre" AS ENUM('picture books', 'early readers', 'chapter books', 'fantasy and adventure', 'science and nature', 'young adult');--> statement-breakpoint
CREATE TYPE "public"."item_kind" AS ENUM('book', 'collection');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('available', 'reserved', 'collected');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"kind" "item_kind" DEFAULT 'book' NOT NULL,
	"isbn" text,
	"title" text NOT NULL,
	"author" text,
	"blurb" text,
	"genre" "genre" NOT NULL,
	"age_band" "age_band" NOT NULL,
	"cover_url" text,
	"photo_url" text,
	"approx_count" integer,
	"status" "item_status" DEFAULT 'available' NOT NULL,
	"reserved_by" uuid,
	"reserved_at" timestamp with time zone,
	"collected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_reserved_by_profiles_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "items_genre_age_idx" ON "items" USING btree ("genre","age_band");