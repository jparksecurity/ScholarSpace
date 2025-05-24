import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { mem0Client } from '@/lib/mem0';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = params.studentId;
    const body = await request.json();
    const { message, sessionId } = ChatRequestSchema.parse(body);

    // Verify student exists and belongs to this user
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        userId,
      },
      include: {
        progressLog: {
          include: { node: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get relevant memories from Mem0
    const memories = await mem0Client.search({
      query: message,
      user_id: studentId,
      limit: 5,
    });

    // Build student context
    let studentContext = `Student: ${student.firstName} ${student.lastName}\n`;
    studentContext += `Recent Progress: ${student.progressLog
      .map(log => `${log.action} ${log.node.unit_title}`)
      .join(', ')}\n`;

    // Build context from memories
    const memoryContext = memories.results
      ?.map((memory: any) => memory.memory)
      .join('\n') || '';

    // Generate response using OpenAI with context
    const { text } = await generateText({
      model: openai('gpt-4'),
      messages: [
        {
          role: 'system',
          content: `You are an AI tutor assistant for ScholarSpace, a learning management system. 
          
          Student Context:
          ${studentContext}
          
          Relevant Memories:
          ${memoryContext}
          
          Provide helpful, educational responses based on the student's learning journey and previous conversations.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    // Store the conversation in Mem0
    await mem0Client.add({
      messages: [
        { role: 'user', content: message },
        { role: 'assistant', content: text },
      ],
      user_id: studentId,
      metadata: {
        studentId,
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      message: text,
      sessionId: sessionId || `session_${Date.now()}`,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}