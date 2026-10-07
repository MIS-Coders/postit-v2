ALTER TABLE "user"
DROP CONSTRAINT IF EXISTS user_role_check;

ALTER TABLE "user"
ADD CONSTRAINT user_role_check CHECK (role IN ('user', 'ms', 'admin', 'superadmin'));
