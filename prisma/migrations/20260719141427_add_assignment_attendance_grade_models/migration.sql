-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "createdById" INTEGER;

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "topic" TEXT,
    "attachFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "classId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" SERIAL NOT NULL,
    "attendanceSessionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_grade_categories" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_grade_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "content" TEXT,
    "attachFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "gradedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assignment_classId_idx" ON "Assignment"("classId");

-- CreateIndex
CREATE INDEX "Assignment_categoryId_idx" ON "Assignment"("categoryId");

-- CreateIndex
CREATE INDEX "Assignment_createdById_idx" ON "Assignment"("createdById");

-- CreateIndex
CREATE INDEX "attendance_sessions_classId_idx" ON "attendance_sessions"("classId");

-- CreateIndex
CREATE INDEX "attendance_sessions_createdById_idx" ON "attendance_sessions"("createdById");

-- CreateIndex
CREATE INDEX "attendance_records_attendanceSessionId_idx" ON "attendance_records"("attendanceSessionId");

-- CreateIndex
CREATE INDEX "attendance_records_studentId_idx" ON "attendance_records"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_attendanceSessionId_studentId_key" ON "attendance_records"("attendanceSessionId", "studentId");

-- CreateIndex
CREATE INDEX "class_grade_categories_classId_idx" ON "class_grade_categories"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "class_grade_categories_classId_name_key" ON "class_grade_categories"("classId", "name");

-- CreateIndex
CREATE INDEX "submissions_assignmentId_idx" ON "submissions"("assignmentId");

-- CreateIndex
CREATE INDEX "submissions_studentId_idx" ON "submissions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignmentId_studentId_key" ON "submissions"("assignmentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_submissionId_key" ON "grades"("submissionId");

-- CreateIndex
CREATE INDEX "grades_gradedById_idx" ON "grades"("gradedById");

-- CreateIndex
CREATE INDEX "Class_createdById_idx" ON "Class"("createdById");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "class_grade_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_grade_categories" ADD CONSTRAINT "class_grade_categories_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
