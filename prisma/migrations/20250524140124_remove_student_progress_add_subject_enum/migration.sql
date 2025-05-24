/*
  Warnings:

  - You are about to drop the `student_progress` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `subject` on the `subject_progress` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATH', 'ELA', 'SCIENCE', 'HUMANITIES');

-- DropForeignKey
ALTER TABLE "student_progress" DROP CONSTRAINT "student_progress_node_id_fkey";

-- DropForeignKey
ALTER TABLE "student_progress" DROP CONSTRAINT "student_progress_student_id_fkey";

-- AlterTable
ALTER TABLE "subject_progress" DROP COLUMN "subject",
ADD COLUMN     "subject" "Subject" NOT NULL;

-- DropTable
DROP TABLE "student_progress";

-- DropEnum
DROP TYPE "ProgressStatus";

-- CreateIndex
CREATE UNIQUE INDEX "subject_progress_student_id_subject_key" ON "subject_progress"("student_id", "subject");
