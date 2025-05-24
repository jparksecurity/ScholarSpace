'use server';

import { revalidatePath } from 'next/cache';
import { deleteLearningPlan } from '@/lib/data-access/learning-plans';

export async function deleteLearningPlanAction(planId: string, studentId: string) {
  await deleteLearningPlan(planId, studentId);
  revalidatePath('/learning-plans');
} 