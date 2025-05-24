-- CreateTable
CREATE TABLE "learning_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "preferences" TEXT,
    "plan_data" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ai_model" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_plan_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "scheduled_month" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "estimated_hours" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_plans_student_id_idx" ON "learning_plans"("student_id");

-- CreateIndex
CREATE INDEX "learning_plans_is_active_idx" ON "learning_plans"("is_active");

-- CreateIndex
CREATE INDEX "learning_plan_items_plan_id_idx" ON "learning_plan_items"("plan_id");

-- CreateIndex
CREATE INDEX "learning_plan_items_node_id_idx" ON "learning_plan_items"("node_id");

-- CreateIndex
CREATE INDEX "learning_plan_items_scheduled_month_idx" ON "learning_plan_items"("scheduled_month");

-- AddForeignKey
ALTER TABLE "learning_plans" ADD CONSTRAINT "learning_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_plan_items" ADD CONSTRAINT "learning_plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "learning_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_plan_items" ADD CONSTRAINT "learning_plan_items_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "curriculum_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
