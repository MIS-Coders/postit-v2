ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;
--> statement-breakpoint
-- Isi awal dari sesi yang masih tersimpan (created_at disimpan sebagai UTC tanpa zona waktu);
-- login berikutnya dicatat oleh hook sesi Better Auth.
UPDATE "user" u SET "last_login_at" = s.last_created
FROM (SELECT "user_id", max("created_at") AT TIME ZONE 'UTC' AS last_created FROM "session" GROUP BY "user_id") s
WHERE s."user_id" = u."id" AND u."last_login_at" IS NULL;
