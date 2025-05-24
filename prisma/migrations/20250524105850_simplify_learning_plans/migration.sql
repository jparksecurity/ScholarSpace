/*
  Warnings:

  - You are about to drop the column `last_completed_node_id` on the `subject_progress` table. All the data in the column will be lost.
  - You are about to drop the `learning_plan_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "learning_plan_items" DROP CONSTRAINT "learning_plan_items_node_id_fkey";

-- DropForeignKey
ALTER TABLE "learning_plan_items" DROP CONSTRAINT "learning_plan_items_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_progress" DROP CONSTRAINT "subject_progress_last_completed_node_id_fkey";

-- AlterTable
ALTER TABLE "subject_progress" DROP COLUMN "last_completed_node_id";

-- DropTable
DROP TABLE "learning_plan_items";
