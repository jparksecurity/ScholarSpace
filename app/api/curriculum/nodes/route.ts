import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { nodeIds } = await request.json();

    if (!nodeIds || !Array.isArray(nodeIds)) {
      return NextResponse.json({ error: 'nodeIds array is required' }, { status: 400 });
    }

    // Fetch nodes without ordering to preserve the original order
    const nodes = await prisma.curriculumNode.findMany({
      where: {
        id: {
          in: nodeIds
        }
      }
    });

    // Create a map for fast lookup
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    
    // Return nodes in the same order as the input nodeIds array
    const orderedNodes = nodeIds
      .map(id => nodeMap.get(id))
      .filter(Boolean); // Remove any null/undefined values

    return NextResponse.json({ nodes: orderedNodes });

  } catch (error) {
    console.error('Error fetching curriculum nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curriculum nodes' },
      { status: 500 }
    );
  }
} 