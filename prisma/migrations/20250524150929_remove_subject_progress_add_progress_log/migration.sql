/*
  Warnings:

  - You are about to drop the `subject_progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProgressAction" AS ENUM ('STARTED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "subject_progress" DROP CONSTRAINT "subject_progress_current_node_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_progress" DROP CONSTRAINT "subject_progress_student_id_fkey";

-- DropTable
DROP TABLE "subject_progress";

-- CreateTable
CREATE TABLE "progress_log" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "action" "ProgressAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "progress_log_student_id_idx" ON "progress_log"("student_id");

-- CreateIndex
CREATE INDEX "progress_log_student_id_created_at_idx" ON "progress_log"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "progress_log_node_id_idx" ON "progress_log"("node_id");

-- AddForeignKey
ALTER TABLE "progress_log" ADD CONSTRAINT "progress_log_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_log" ADD CONSTRAINT "progress_log_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "curriculum_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
