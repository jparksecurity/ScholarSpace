import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function getStudentsForUser(userId: string) {
  return await prisma.student.findMany({
    where: {
      parentUserId: userId,
      isActive: true,
    },
    include: {
      progressLog: {
        include: {
          node: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getStudentById(id: string, userId: string) {
  return await prisma.student.findUnique({
    where: {
      id,
      parentUserId: userId,
    },
    include: {
      progressLog: {
        include: {
          node: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export async function getCurrentUserStudents() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return getStudentsForUser(userId);
} 