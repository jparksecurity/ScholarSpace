'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
// import { getNextNode } from '@/lib/curriculum'; // No longer needed

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  avatar?: string;
  subjectProgress?: {
    subject: string;
    currentNodeId: string | null;
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
    subjectProgress = [],
  } = data;

  // Validate required fields
  if (!firstName || !lastName || !dateOfBirth) {
    throw new Error('First name, last name, and date of birth are required');
  }

  // Create student with subject progress in a transaction
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

    // Create subject progress entries if provided
    if (subjectProgress.length > 0) {
      // Validate that the currentNodeIds actually exist
      const nodeIds = subjectProgress
        .map(sp => sp.currentNodeId)
        .filter(Boolean) as string[];
      
      if (nodeIds.length > 0) {
        const existingNodes = await tx.curriculumNode.findMany({
          where: {
            id: {
              in: nodeIds,
            },
          },
          select: { id: true },
        });
        
        const existingNodeIds = new Set(existingNodes.map(node => node.id));
        
        // Create subject progress records
        const validSubjectProgress = subjectProgress.map(sp => {
          // If currentNodeId is null or doesn't exist, set it to null
          const currentNodeId = sp.currentNodeId && existingNodeIds.has(sp.currentNodeId) 
            ? sp.currentNodeId 
            : null;
          
          return {
            studentId: newStudent.id,
            subject: sp.subject,
            currentNodeId,
          };
        });

        await tx.subjectProgress.createMany({
          data: validSubjectProgress,
        });
      } else {
        // Create subject progress records with no current nodes
        await tx.subjectProgress.createMany({
          data: subjectProgress.map(sp => ({
            studentId: newStudent.id,
            subject: sp.subject,
            currentNodeId: null,
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
      subjectProgress: true,
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
      subjectProgress: true,
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