-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('draft', 'published', 'closed');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "allowResubmit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'published';
