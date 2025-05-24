import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// GET /api/students/[id] - Get a specific student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: {
        id: params.id,
        parentUserId: userId, // Ensure user can only access their own students
      },
      include: {
        subjectProgress: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] - Update a specific student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    } = body;

    // Verify student belongs to the authenticated user
    const existingStudent = await prisma.student.findUnique({
      where: {
        id: params.id,
        parentUserId: userId,
      },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update student in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the student
      await tx.student.update({
        where: { id: params.id },
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
      where: { id: params.id },
      include: {
        subjectProgress: true,
      },
    });

    return NextResponse.json(completeStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Soft delete a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify student belongs to the authenticated user
    const existingStudent = await prisma.student.findUnique({
      where: {
        id: params.id,
        parentUserId: userId,
      },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Soft delete the student and remove subject progress
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      await tx.subjectProgress.deleteMany({
        where: { studentId: params.id },
      });
    });

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 