import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function debugReactFlowEdges() {
  console.log('🔍 Debugging React Flow edge transformation with FULL dataset...\n');

  // Get ALL data like the component does (no take limit)
  const nodes = await prisma.curriculumNode.findMany({
    orderBy: { subject: 'asc' }
  });

  const edges = await prisma.curriculumEdge.findMany({
    include: {
      fromNode: true,
      toNode: true,
    },
  });

  console.log(`📊 Full data: ${nodes.length} nodes, ${edges.length} edges\n`);

  // Show subject distribution to understand ordering
  const subjectCounts = nodes.reduce((acc, node) => {
    acc[node.subject] = (acc[node.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📋 Nodes by subject:');
  Object.entries(subjectCounts).forEach(([subject, count]) => {
    console.log(`- ${subject}: ${count}`);
  });
  console.log('');

  // Simulate the filtering logic for "all" subjects (should include everything)
  const filteredNodes = nodes.filter(node => {
    const subjectMatch = 'all' === 'all' || node.subject === 'all';
    const gradeMatch = 'all' === 'all' || node.gradeLevel === 'all';
    return subjectMatch && gradeMatch;
  });

  console.log(`📝 After filtering (should be same): ${filteredNodes.length} nodes\n`);

  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

  // Simulate edge filtering logic
  const filteredEdges = edges.filter(edge => {
    // Always include START/END connections
    if (edge.fromNodeId === 'START' || edge.toNodeId === 'END') {
      return filteredNodeIds.has(edge.fromNodeId) || filteredNodeIds.has(edge.toNodeId);
    }
    
    // For regular edges, show if at least one node is visible
    const fromVisible = filteredNodeIds.has(edge.fromNodeId);
    const toVisible = filteredNodeIds.has(edge.toNodeId);
    
    // If no subject filter, require both nodes to be visible
    return fromVisible && toVisible;
  });

  console.log(`🔗 After edge filtering: ${filteredEdges.length} edges\n`);

  if (filteredEdges.length === 0) {
    console.log('❌ NO EDGES AFTER FILTERING! Checking first few edges...\n');
    
    edges.slice(0, 5).forEach((edge, i) => {
      const fromVisible = filteredNodeIds.has(edge.fromNodeId);
      const toVisible = filteredNodeIds.has(edge.toNodeId);
      
      console.log(`${i + 1}. Edge ${edge.fromNodeId} -> ${edge.toNodeId}`);
      console.log(`   From visible: ${fromVisible}`);
      console.log(`   To visible: ${toVisible}`);
      console.log(`   Both visible: ${fromVisible && toVisible}`);
      console.log('');
    });
  } else {
    console.log('✅ Edges found after filtering! Sample:');
    filteredEdges.slice(0, 5).forEach((edge, i) => {
      console.log(`${i + 1}. ${edge.fromNodeId} -> ${edge.toNodeId} (${edge.relationshipType})`);
    });
  }

  // Quick test: do START/END nodes exist?
  const startNode = nodes.find(n => n.id === 'START');
  const endNode = nodes.find(n => n.id === 'END');
  console.log(`\n🎯 Special nodes: START=${!!startNode}, END=${!!endNode}`);

  await prisma.$disconnect();
}

debugReactFlowEdges().catch(console.error); 