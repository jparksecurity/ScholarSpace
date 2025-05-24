/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "curriculum_nodes" (
    "id" TEXT NOT NULL,
    "unit_title" TEXT NOT NULL,
    "unit_number" INTEGER NOT NULL,
    "course_title" TEXT NOT NULL,
    "course_path" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_edges" (
    "id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_edges_from_node_id_to_node_id_key" ON "curriculum_edges"("from_node_id", "to_node_id");

-- AddForeignKey
ALTER TABLE "curriculum_edges" ADD CONSTRAINT "curriculum_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_edges" ADD CONSTRAINT "curriculum_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
