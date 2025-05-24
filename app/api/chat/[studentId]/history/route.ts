import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { mem0Client } from '@/lib/mem0';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = params.studentId;

    // Verify student exists and belongs to this user
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get chat history from Mem0
    const history = await mem0Client.getAll({
      user_id: studentId,
      limit,
    });

    return NextResponse.json({ history: history.results || [] });
  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = params.studentId;

    // Verify student exists and belongs to this user
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const memoryId = searchParams.get('memoryId');

    if (memoryId) {
      // Delete specific memory
      await mem0Client.delete(memoryId);
    } else {
      // Delete all memories for user
      await mem0Client.deleteAll({
        user_id: studentId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat history' },
      { status: 500 }
    );
  }
}