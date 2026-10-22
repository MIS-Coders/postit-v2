ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "account_status" text NOT NULL DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password_changed_at" timestamp with time zone;
