import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Subject } from '@/lib/generated/prisma';
import { subjectCurriculumToEnum, isValidSubjectEnum } from '@/lib/curriculum';

interface SubjectProgressData {
  subject: string;
  lastCompletedNodeId: string | null;
}

const prisma = new PrismaClient();

// GET /api/students - Get all students for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      where: {
        parentUserId: userId,
        isActive: true,
      },
      include: {
        subjectProgress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      avatar,
      subjectProgress = [],
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth) {
      return NextResponse.json(
        { error: 'First name, last name, and date of birth are required' },
        { status: 400 }
      );
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
          .map((sp: SubjectProgressData) => sp.lastCompletedNodeId)
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
            .map((sp: SubjectProgressData) => {
              // Convert subject to enum format and validate
              const enumSubject = subjectCurriculumToEnum(sp.subject);
              if (!isValidSubjectEnum(enumSubject)) {
                console.warn(`Invalid subject: ${sp.subject}, skipping`);
                return null;
              }

              // If lastCompletedNodeId is null or doesn't exist, set currentNodeId to null
              const currentNodeId = sp.lastCompletedNodeId && existingNodeIds.has(sp.lastCompletedNodeId) 
                ? sp.lastCompletedNodeId 
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
          // Create subject progress records with no completed nodes
          const validSubjectProgress = subjectProgress
            .map((sp: SubjectProgressData) => {
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

    return NextResponse.json(completeStudent, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 