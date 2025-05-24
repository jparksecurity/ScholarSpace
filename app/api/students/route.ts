import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getNodesBeforeInSubject, getNodesBySubject, getNextNode } from '@/lib/curriculum';

interface InitialProgressData {
  subject: string;
  lastCompletedNodeId: string | null; // What they've completed so far (null = haven't started)
}

// Helper function to get next node ID
function getNextNodeId(nodeId: string): string | null {
  const nextNode = getNextNode(nodeId);
  return nextNode?.id || null;
}

// GET /api/students - Get all students for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = new PrismaClient();
    
    const students = await prisma.student.findMany({
      where: {
        parentUserId: userId,
        isActive: true,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      firstName, 
      lastName, 
      dateOfBirth, 
      avatar,
      initialProgress = [],
    } = data;

    const prisma = new PrismaClient();

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

      // Create initial progress log entries if provided
      if (initialProgress.length > 0) {
        // Validate that the nodeIds actually exist
        const nodeIds = initialProgress
          .map((ip: InitialProgressData) => ip.lastCompletedNodeId)
          .filter(Boolean) as string[];
        
        if (nodeIds.length > 0) {
          const existingNodes = await tx.curriculumNode.findMany({
            where: {
              id: {
                in: nodeIds,
              },
            },
            select: { id: true, subject: true },
          });
          
          const existingNodeIds = new Set(existingNodes.map(node => node.id));
          
          // For each subject where student has completed something
          const allProgressEntries: Array<{
            studentId: string;
            nodeId: string;
            action: 'STARTED' | 'COMPLETED';
            createdAt: Date;
          }> = [];

          for (const ip of initialProgress) {
            if (ip.lastCompletedNodeId && existingNodeIds.has(ip.lastCompletedNodeId)) {
              const subjectName = ip.subject.toLowerCase();
              
              // Get all nodes that come before and include the last completed node
              const lastCompletedNode = existingNodes.find(n => n.id === ip.lastCompletedNodeId);
              if (lastCompletedNode && lastCompletedNode.subject === subjectName) {
                // Get all completed nodes (including the last completed one)
                const completedNodes = getNodesBeforeInSubject(ip.lastCompletedNodeId, subjectName);
                completedNodes.push({ id: ip.lastCompletedNodeId, subject: lastCompletedNode.subject }); // Add the last completed node itself
                
                // Create COMPLETED entries for all completed units with staggered timestamps
                completedNodes.forEach((node, index) => {
                  const completedAt = new Date();
                  completedAt.setMinutes(completedAt.getMinutes() - (completedNodes.length - index) * 5);
                  
                  allProgressEntries.push({
                    studentId: newStudent.id,
                    nodeId: node.id,
                    action: 'COMPLETED',
                    createdAt: completedAt,
                  });
                });
                
                // Find and create STARTED entry for the next unit
                const nextNodeId = getNextNodeId(ip.lastCompletedNodeId);
                if (nextNodeId) {
                  allProgressEntries.push({
                    studentId: newStudent.id,
                    nodeId: nextNodeId,
                    action: 'STARTED',
                    createdAt: new Date(),
                  });
                }
              }
            } else if (!ip.lastCompletedNodeId) {
              // Student hasn't started this subject yet - create STARTED entry for first unit
              const subjectNodes = getNodesBySubject(ip.subject.toLowerCase());
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
        } else {
          // No completed nodes, but create STARTED entries for subjects they want to begin
          const startedEntries = initialProgress
            .filter((ip: InitialProgressData) => !ip.lastCompletedNodeId)
            .map((ip: InitialProgressData) => {
              const subjectNodes = getNodesBySubject(ip.subject.toLowerCase());
              return subjectNodes.length > 0 ? {
                studentId: newStudent.id,
                nodeId: subjectNodes[0].id,
                action: 'STARTED' as const,
                createdAt: new Date(),
              } : null;
            })
            .filter(Boolean);

          if (startedEntries.length > 0) {
            await tx.progressLog.createMany({
              data: startedEntries,
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

    await prisma.$disconnect();

    return NextResponse.json({ student: completeStudent });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
} 