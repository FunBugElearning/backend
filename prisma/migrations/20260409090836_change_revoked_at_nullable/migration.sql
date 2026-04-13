/*
  Warnings:

  - You are about to drop the column `accessToken` on the `AuthSession` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AuthSession` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokenHash` on the `AuthSession` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AuthSession` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `AuthSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jti]` on the table `AuthSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `browser_agent` to the `AuthSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expired_at` to the `AuthSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `family_id` to the `AuthSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ip_address` to the `AuthSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `AuthSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_toke_hash` to the `AuthSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rotated_at` to the `AuthSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `AuthSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AuthSession" DROP CONSTRAINT "AuthSession_userId_fkey";

-- DropIndex
DROP INDEX "AuthSession_userId_idx";

-- AlterTable
ALTER TABLE "AuthSession" DROP COLUMN "accessToken",
DROP COLUMN "createdAt",
DROP COLUMN "refreshTokenHash",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "browser_agent" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expired_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "family_id" TEXT NOT NULL,
ADD COLUMN     "ip_address" TEXT NOT NULL,
ADD COLUMN     "jti" TEXT NOT NULL,
ADD COLUMN     "refresh_toke_hash" TEXT NOT NULL,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "rotated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_jti_key" ON "AuthSession"("jti");

-- CreateIndex
CREATE INDEX "AuthSession_user_id_idx" ON "AuthSession"("user_id");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
