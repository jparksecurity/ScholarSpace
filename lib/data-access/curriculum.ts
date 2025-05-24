import { prisma } from '@/lib/db';

export async function getCurriculumNodes(nodeIds: string[]) {
  if (!nodeIds.length) return [];
  
  const nodes = await prisma.curriculumNode.findMany({
    where: {
      id: {
        in: nodeIds
      }
    }
  });

  // Create a map for fast lookup
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  
  // Return nodes in the same order as the input nodeIds array, filtering out undefined
  return nodeIds
    .map(id => nodeMap.get(id))
    .filter((node): node is NonNullable<typeof node> => node !== undefined);
}

export async function getAllCurriculumNodes() {
  return await prisma.curriculumNode.findMany({
    orderBy: [
      { subject: 'asc' },
      { gradeLevel: 'asc' },
      { unitNumber: 'asc' }
    ]
  });
}

export async function getCurriculumNodesBySubject(subject: string) {
  return await prisma.curriculumNode.findMany({
    where: {
      subject: subject.toLowerCase()
    },
    orderBy: [
      { gradeLevel: 'asc' },
      { unitNumber: 'asc' }
    ]
  });
} 