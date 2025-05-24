import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function getLearningPlansForStudent(studentId: string, userId?: string) {
  // If userId provided, verify student belongs to user
  if (userId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId, parentUserId: userId }
    });
    if (!student) {
      throw new Error('Student not found or unauthorized');
    }
  }

  return await prisma.learningPlan.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getCurrentUserLearningPlans(studentId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return getLearningPlansForStudent(studentId, userId);
}

export async function deleteLearningPlan(planId: string, studentId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify the plan belongs to a student owned by this user
  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
    include: { student: true }
  });

  if (!plan || plan.student.parentUserId !== userId || plan.studentId !== studentId) {
    throw new Error('Learning plan not found or unauthorized');
  }

  await prisma.learningPlan.delete({
    where: { id: planId }
  });
} 