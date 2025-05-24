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

// Progress update functions
export async function getStudentProgress(studentId: string, userId: string) {
  return await prisma.student.findUnique({
    where: {
      id: studentId,
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
      learningPlans: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

export async function updateStudentProgress(
  studentId: string,
  nodeId: string,
  action: 'STARTED' | 'COMPLETED',
  userId: string
) {
  // Verify the student belongs to the authenticated user
  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
      parentUserId: userId,
    },
  });

  if (!student) {
    throw new Error('Student not found or unauthorized');
  }

  // Verify the node exists
  const node = await prisma.curriculumNode.findUnique({
    where: { id: nodeId },
  });

  if (!node) {
    throw new Error('Curriculum node not found');
  }

  // Create the progress log entry
  return await prisma.progressLog.create({
    data: {
      studentId,
      nodeId,
      action,
    },
    include: {
      node: true,
    },
  });
}

export async function getStudentProgressBySubject(
  studentId: string,
  subject: string,
  userId: string
) {
  // Verify the student belongs to the authenticated user
  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
      parentUserId: userId,
    },
  });

  if (!student) {
    throw new Error('Student not found or unauthorized');
  }

  return await prisma.progressLog.findMany({
    where: {
      studentId,
      node: {
        subject: subject.toLowerCase(),
      },
    },
    include: {
      node: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
} 