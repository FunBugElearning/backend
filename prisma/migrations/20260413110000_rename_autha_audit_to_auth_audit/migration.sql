-- Rename legacy typo table if it exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'AuthaAuditLog'
  ) THEN
    ALTER TABLE "AuthaAuditLog" RENAME TO "AuthAuditLog";
  END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuthAuditLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "browser_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuthAuditLog_user_id_idx" ON "AuthAuditLog"("user_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AuthAuditLog_user_id_fkey'
  ) THEN
    ALTER TABLE "AuthAuditLog"
    ADD CONSTRAINT "AuthAuditLog_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
