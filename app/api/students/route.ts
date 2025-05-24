import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

interface ProgressData {
  nodeId: string;
  status?: string;
  score?: number;
  completedAt?: string;
}

const prisma = new PrismaClient();

// GET /api/students - Get all students for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      where: {
        parentUserId: userId,
        isActive: true,
      },
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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gradeLevel,
      avatar,
      bio,
      subjects = [],
      currentProgress = [],
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !gradeLevel) {
      return NextResponse.json(
        { error: 'First name, last name, and grade level are required' },
        { status: 400 }
      );
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
          gradeLevel,
          avatar,
          bio,
        },
      });

      // Create enrollments for each subject
      if (subjects.length > 0) {
        await tx.studentEnrollment.createMany({
          data: subjects.map((subject: string) => ({
            studentId: newStudent.id,
            subject,
            gradeLevel,
            startDate: new Date(),
          })),
        });
      }

      // Create initial progress entries if provided
      if (currentProgress.length > 0) {
        // First, check which curriculum nodes actually exist
        const existingNodes = await tx.curriculumNode.findMany({
          where: {
            id: {
              in: currentProgress.map((p: ProgressData) => p.nodeId),
            },
          },
          select: { id: true },
        });
        
        const existingNodeIds = new Set(existingNodes.map(node => node.id));
        const validProgress = currentProgress.filter((progress: ProgressData) => 
          existingNodeIds.has(progress.nodeId)
        );

        console.log(`Found ${existingNodes.length} existing curriculum nodes out of ${currentProgress.length} requested`);
        
        if (validProgress.length > 0) {
          await tx.studentProgress.createMany({
            data: validProgress.map((progress: ProgressData) => ({
              studentId: newStudent.id,
              nodeId: progress.nodeId,
              status: progress.status || 'NOT_STARTED',
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

    return NextResponse.json(completeStudent, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 