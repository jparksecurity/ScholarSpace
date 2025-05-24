'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { ProgressStatus } from '@/lib/generated/prisma';

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  avatar?: string;
  currentProgress?: {
    nodeId: string;
    status?: string;
    score?: number;
    completedAt?: string;
  }[];
}

export interface UpdateStudentData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  avatar?: string;
}

export async function createStudentAction(data: CreateStudentData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const {
    firstName,
    lastName,
    dateOfBirth,
    avatar,
    currentProgress = [],
  } = data;

  // Validate required fields
  if (!firstName || !lastName || !dateOfBirth) {
    throw new Error('First name, last name, and date of birth are required');
  }

  // Create student with enrollments in a transaction
  const student = await prisma.$transaction(async (tx) => {
    // Create the student
    const newStudent = await tx.student.create({
              data: {
        parentUserId: userId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        avatar,
      },
    });



    // Create initial progress entries if provided
    if (currentProgress.length > 0) {
      // First, check which curriculum nodes actually exist
      const existingNodes = await tx.curriculumNode.findMany({
        where: {
          id: {
            in: currentProgress.map((p) => p.nodeId),
          },
        },
        select: { id: true },
      });
      
      const existingNodeIds = new Set(existingNodes.map(node => node.id));
      const validProgress = currentProgress.filter((progress) => 
        existingNodeIds.has(progress.nodeId)
      );

      if (validProgress.length > 0) {
        await tx.studentProgress.createMany({
          data: validProgress.map((progress) => ({
            studentId: newStudent.id,
            nodeId: progress.nodeId,
            status: (progress.status as ProgressStatus) || ProgressStatus.NOT_STARTED,
            score: progress.score,
            completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
          })),
        });
      }
    }

    return newStudent;
  });

  // Fetch the complete student data with relations
  const completeStudent = await prisma.student.findUnique({
    where: { id: student.id },
    include: {
      progress: {
        include: {
          curriculumNode: true,
        },
      },
      enrollments: {
        where: { isActive: true },
      },
    },
  });

  revalidatePath('/students');
  return completeStudent;
}

export async function updateStudentAction(id: string, data: UpdateStudentData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const {
    firstName,
    lastName,
    dateOfBirth,
    avatar,
  } = data;

  // Verify student belongs to the authenticated user
  const existingStudent = await prisma.student.findUnique({
    where: {
      id,
      parentUserId: userId,
    },
  });

  if (!existingStudent) {
    throw new Error('Student not found');
  }

  // Update student and enrollments in a transaction
  await prisma.$transaction(async (tx) => {
    // Update the student
    await tx.student.update({
      where: { id },
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        avatar,
      },
    });


  });

  // Fetch the complete updated student data
  const completeStudent = await prisma.student.findUnique({
    where: { id },
    include: {
      progress: {
        include: {
          curriculumNode: true,
        },
      },
      enrollments: {
        where: { isActive: true },
      },
    },
  });

  revalidatePath('/students');
  return completeStudent;
}

export async function deleteStudentAction(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify student belongs to the authenticated user
  const existingStudent = await prisma.student.findUnique({
    where: {
      id,
      parentUserId: userId,
    },
  });

  if (!existingStudent) {
    throw new Error('Student not found');
  }

  // Soft delete the student and deactivate enrollments
  await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id },
      data: { isActive: false },
    });

    await tx.studentEnrollment.updateMany({
      where: { studentId: id },
      data: { 
        isActive: false,
        endDate: new Date(),
      },
    });
  });

  revalidatePath('/students');
  return { success: true };
} 