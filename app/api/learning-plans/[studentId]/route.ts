import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const learningPlans = await prisma.learningPlan.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, plans: learningPlans });

  } catch (error) {
    console.error('Error fetching learning plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning plans' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!studentId || !planId) {
      return NextResponse.json({ error: 'Student ID and Plan ID are required' }, { status: 400 });
    }

    await prisma.learningPlan.delete({
      where: {
        id: planId,
        studentId: studentId
      }
    });

    return NextResponse.json({ success: true, message: 'Learning plan deleted' });

  } catch (error) {
    console.error('Error deleting learning plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete learning plan' },
      { status: 500 }
    );
  }
} 