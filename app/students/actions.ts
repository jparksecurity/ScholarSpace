'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { Subject } from '@/lib/generated/prisma';
import { subjectCurriculumToEnum, isValidSubjectEnum } from '@/lib/curriculum';
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
        
        // Create subject progress records with proper enum conversion
        const validSubjectProgress = subjectProgress
          .map(sp => {
            // Convert subject to enum format and validate
            const enumSubject = subjectCurriculumToEnum(sp.subject);
            if (!isValidSubjectEnum(enumSubject)) {
              console.warn(`Invalid subject: ${sp.subject}, skipping`);
              return null;
            }

            // If currentNodeId is null or doesn't exist, set it to null
            const currentNodeId = sp.currentNodeId && existingNodeIds.has(sp.currentNodeId) 
              ? sp.currentNodeId 
              : null;
            
            return {
              studentId: newStudent.id,
              subject: enumSubject as Subject,
              currentNodeId,
            };
          })
          .filter(<T>(item: T | null): item is T => item !== null);

        if (validSubjectProgress.length > 0) {
          await tx.subjectProgress.createMany({
            data: validSubjectProgress,
          });
        }
      } else {
        // Create subject progress records with no current nodes
        const validSubjectProgress = subjectProgress
          .map(sp => {
            const enumSubject = subjectCurriculumToEnum(sp.subject);
            if (!isValidSubjectEnum(enumSubject)) {
              console.warn(`Invalid subject: ${sp.subject}, skipping`);
              return null;
            }

            return {
              studentId: newStudent.id,
              subject: enumSubject as Subject,
              currentNodeId: null,
            };
          })
          .filter(<T>(item: T | null): item is T => item !== null);

        if (validSubjectProgress.length > 0) {
          await tx.subjectProgress.createMany({
            data: validSubjectProgress,
          });
        }
      }
    }

    return newStudent;
  });

  // Fetch the complete student data with relations
  const completeStudent = await prisma.student.findUnique({
    where: { id: student.id },
    include: {
      subjectProgress: true,
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

  // Update student in a transaction
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
      subjectProgress: true,
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

  // Soft delete the student and remove subject progress
  await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id },
      data: { isActive: false },
    });

    await tx.subjectProgress.deleteMany({
      where: { studentId: id },
    });
  });

  revalidatePath('/students');
  return { success: true };
} 