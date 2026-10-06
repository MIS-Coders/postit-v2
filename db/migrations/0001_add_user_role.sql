ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

ALTER TABLE "user"
DROP CONSTRAINT IF EXISTS user_role_check;

ALTER TABLE "user"
ADD CONSTRAINT user_role_check CHECK (role IN ('user', 'admin', 'superadmin'));
