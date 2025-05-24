import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { nodeIds } = await request.json();

    if (!nodeIds || !Array.isArray(nodeIds)) {
      return NextResponse.json({ error: 'nodeIds array is required' }, { status: 400 });
    }

    const nodes = await prisma.curriculumNode.findMany({
      where: {
        id: {
          in: nodeIds
        }
      },
      orderBy: {
        subject: 'asc'
      }
    });

    return NextResponse.json({ nodes });

  } catch (error) {
    console.error('Error fetching curriculum nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curriculum nodes' },
      { status: 500 }
    );
  }
} 