/*
  Warnings:

  - You are about to drop the column `plan_data` on the `learning_plans` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `student_progress` table. All the data in the column will be lost.
  - You are about to drop the column `time_spent` on the `student_progress` table. All the data in the column will be lost.
  - You are about to drop the `student_enrollments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "student_enrollments" DROP CONSTRAINT "student_enrollments_student_id_fkey";

-- AlterTable
ALTER TABLE "learning_plans" DROP COLUMN "plan_data",
ADD COLUMN     "unit_ids" TEXT[];

-- AlterTable
ALTER TABLE "student_progress" DROP COLUMN "notes",
DROP COLUMN "time_spent";

-- DropTable
DROP TABLE "student_enrollments";
