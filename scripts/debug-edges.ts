import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function debugEdges() {
  console.log('🔗 Debugging edge connections...\n');

  // Check sample edges
  const edges = await prisma.curriculumEdge.findMany({ 
    take: 10, 
    include: { fromNode: true, toNode: true } 
  });
  
  console.log('📋 Sample edges:');
  edges.forEach((edge, i) => {
    console.log(`${i + 1}. ${edge.fromNode.subject} -> ${edge.toNode.subject} (${edge.relationshipType})`);
    console.log(`   From: ${edge.fromNode.unitTitle} (${edge.fromNode.gradeLevel})`);
    console.log(`   To: ${edge.toNode.unitTitle} (${edge.toNode.gradeLevel})\n`);
  });
  
  // Check edge types
  const edgeTypes = await prisma.curriculumEdge.groupBy({
    by: ['relationshipType'],
    _count: { relationshipType: true }
  });
  
  console.log('🏷️  Edge types and counts:');
  edgeTypes.forEach(type => {
    console.log(`- ${type.relationshipType}: ${type._count.relationshipType}`);
  });

  // Check all edges to see the subjects involved
  console.log('\n🌐 Subject pair analysis:');
  const allEdges = await prisma.curriculumEdge.findMany({
    include: { fromNode: { select: { subject: true } }, toNode: { select: { subject: true } } }
  });

  const subjectPairs = new Map<string, number>();
  allEdges.forEach(edge => {
    const pair = `${edge.fromNode.subject} -> ${edge.toNode.subject}`;
    subjectPairs.set(pair, (subjectPairs.get(pair) || 0) + 1);
  });

  // Show top 10 subject pairs
  const sortedPairs = Array.from(subjectPairs.entries()).sort((a, b) => b[1] - a[1]);
  console.log('Top subject pair connections:');
  sortedPairs.slice(0, 15).forEach(([pair, count]) => {
    console.log(`- ${pair}: ${count} edges`);
  });

  // Check what happens when we filter by math only
  const mathNodes = await prisma.curriculumNode.findMany({ where: { subject: 'math' } });
  const mathNodeIds = new Set(mathNodes.map(n => n.id));
  
  const mathOnlyEdges = allEdges.filter(edge => 
    mathNodeIds.has(edge.fromNodeId) && mathNodeIds.has(edge.toNodeId)
  );
  
  console.log(`\n🔢 Math filtering test:`);
  console.log(`- Total math nodes: ${mathNodes.length}`);
  console.log(`- Total edges connecting math nodes: ${mathOnlyEdges.length}`);

  // Test START/END connections
  const startConnections = await prisma.curriculumEdge.findMany({
    where: { fromNodeId: 'START' },
    include: { toNode: true }
  });
  
  const endConnections = await prisma.curriculumEdge.findMany({
    where: { toNodeId: 'END' },
    include: { fromNode: true }
  });

  console.log(`\n🎯 START/END connections:`);
  console.log(`- START connects to: ${startConnections.length} nodes`);
  console.log(`- END connects from: ${endConnections.length} nodes`);
  
  if (startConnections.length > 0) {
    console.log('START connects to subjects:', 
      [...new Set(startConnections.map(e => e.toNode.subject))].join(', '));
  }

  await prisma.$disconnect();
}

debugEdges().catch(console.error); 