/*
  Warnings:

  - The values [MASTERED,NEEDS_REVIEW] on the enum `ProgressStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProgressStatus_new" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
ALTER TABLE "student_progress" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "student_progress" ALTER COLUMN "status" TYPE "ProgressStatus_new" USING ("status"::text::"ProgressStatus_new");
ALTER TYPE "ProgressStatus" RENAME TO "ProgressStatus_old";
ALTER TYPE "ProgressStatus_new" RENAME TO "ProgressStatus";
DROP TYPE "ProgressStatus_old";
ALTER TABLE "student_progress" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;

-- CreateTable
CREATE TABLE "subject_progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "last_completed_node_id" TEXT,
    "current_node_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subject_progress_student_id_idx" ON "subject_progress"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_progress_student_id_subject_key" ON "subject_progress"("student_id", "subject");

-- AddForeignKey
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_last_completed_node_id_fkey" FOREIGN KEY ("last_completed_node_id") REFERENCES "curriculum_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_progress" ADD CONSTRAINT "subject_progress_current_node_id_fkey" FOREIGN KEY ("current_node_id") REFERENCES "curriculum_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
