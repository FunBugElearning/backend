-- CreateTable
CREATE TABLE IF NOT EXISTS "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

-- Seed default roles
INSERT INTO "Role" ("name", "description", "updatedAt")
VALUES
  ('admin', 'Administrator role', CURRENT_TIMESTAMP),
  ('teacher', 'Teacher role', CURRENT_TIMESTAMP),
  ('student', 'Default student role', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Add user role_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role_id'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "role_id" INTEGER;
  END IF;
END
$$;

-- Backfill existing users to student role
UPDATE "User"
SET "role_id" = r."id"
FROM "Role" r
WHERE r."name" = 'student'
  AND "User"."role_id" IS NULL;

-- Make role required
ALTER TABLE "User" ALTER COLUMN "role_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_id_idx" ON "User"("role_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_role_id_fkey'
  ) THEN
    ALTER TABLE "User"
    ADD CONSTRAINT "User_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "Role"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
