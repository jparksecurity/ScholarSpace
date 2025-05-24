/*
  Warnings:

  - You are about to drop the column `ai_model` on the `learning_plans` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `learning_plans` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `learning_plans` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `learning_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "learning_plans" DROP COLUMN "ai_model",
DROP COLUMN "description",
DROP COLUMN "preferences",
DROP COLUMN "title";
