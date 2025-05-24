'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getNodesBeforeInSubject, subjectEnumToCurriculum, getNextNode, getNodesBySubject } from '@/lib/curriculum';

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  avatar?: string;
  initialProgress?: {
    subject: string;
    lastCompletedNodeId: string | null;
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
    initialProgress = [],
  } = data;

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

    // Create comprehensive progress log entries if provided
    if (initialProgress.length > 0) {
      // Validate that the nodeIds actually exist
      const nodeIds = initialProgress
        .map(ip => ip.lastCompletedNodeId)
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
        
        // For each valid initial progress entry, create comprehensive history
        const allProgressEntries: Array<{
          studentId: string;
          nodeId: string;
          action: 'STARTED' | 'COMPLETED';
          createdAt: Date;
        }> = [];

        for (const ip of initialProgress) {
          if (ip.lastCompletedNodeId && existingNodeIds.has(ip.lastCompletedNodeId)) {
            const subjectName = subjectEnumToCurriculum(ip.subject);
            
            // Get all nodes that come before and including the last completed node
            const completedNodes = getNodesBeforeInSubject(ip.lastCompletedNodeId, subjectName);
            completedNodes.push({ id: ip.lastCompletedNodeId } as { id: string }); // Add the last completed node itself
            
            // Create COMPLETED entries for all completed units
            // Use slightly offset timestamps to maintain chronological order
            completedNodes.forEach((node, index) => {
              const completedAt = new Date();
              completedAt.setMinutes(completedAt.getMinutes() - (completedNodes.length - index) * 5); // 5 min intervals
              
              allProgressEntries.push({
                studentId: newStudent.id,
                nodeId: node.id,
                action: 'COMPLETED',
                createdAt: completedAt,
              });
            });
            
            // Create STARTED entry for the next unit after the last completed one
            const nextNode = getNextNode(ip.lastCompletedNodeId);
            if (nextNode) {
              allProgressEntries.push({
                studentId: newStudent.id,
                nodeId: nextNode.id,
                action: 'STARTED',
                createdAt: new Date(),
              });
            }
          } else if (!ip.lastCompletedNodeId) {
            // Student hasn't completed anything in this subject - start from the beginning
            const subjectName = subjectEnumToCurriculum(ip.subject);
            const subjectNodes = getNodesBySubject(subjectName);
            if (subjectNodes.length > 0) {
              allProgressEntries.push({
                studentId: newStudent.id,
                nodeId: subjectNodes[0].id,
                action: 'STARTED',
                createdAt: new Date(),
              });
            }
          }
        }

        // Bulk create all progress entries
        if (allProgressEntries.length > 0) {
          await tx.progressLog.createMany({
            data: allProgressEntries,
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

  revalidatePath('/students');
  return completeStudent;
}

export async function updateStudentAction(id: string, data: UpdateStudentData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify the student belongs to the authenticated user
  const existingStudent = await prisma.student.findUnique({
    where: {
      id,
      parentUserId: userId,
    },
  });

  if (!existingStudent) {
    throw new Error('Student not found');
  }

  // Update the student
  await prisma.student.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      avatar: data.avatar,
    },
  });

  // Fetch the complete updated student data
  const updatedStudent = await prisma.student.findUnique({
    where: { id },
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

  revalidatePath('/students');
  return updatedStudent;
}

export async function deleteStudentAction(id: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify the student belongs to the authenticated user
  const existingStudent = await prisma.student.findUnique({
    where: {
      id,
      parentUserId: userId,
    },
  });

  if (!existingStudent) {
    throw new Error('Student not found');
  }

  // Soft delete the student (progress log entries are kept for historical tracking)
  await prisma.student.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath('/students');
} 