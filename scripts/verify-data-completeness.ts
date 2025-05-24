import { PrismaClient } from "../lib/generated/prisma";
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CurriculumNetworkData {
  metadata: {
    total_nodes: number;
    total_edges: number;
  };
  nodes: Array<{
    id: string;
    unit_title: string;
    unit_number: number;
    course_title: string;
    course_path: string;
    grade_level: string;
    subject: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    relationship_type: string;
    description: string;
  }>;
}

async function verifyDataCompleteness() {
  console.log('🔍 Verifying data completeness...\n');

  // Read the source data file
  const dataPath = path.join(process.cwd(), 'curriculum_prerequisite_network.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const sourceData: CurriculumNetworkData = JSON.parse(rawData);

  console.log('📊 Source Data (JSON file):');
  console.log(`   Nodes: ${sourceData.nodes.length}`);
  console.log(`   Edges: ${sourceData.edges.length}`);
  console.log(`   Metadata says: ${sourceData.metadata.total_nodes} nodes, ${sourceData.metadata.total_edges} edges\n`);

  // Query database without any limits
  console.log('🗄️  Database Query (no limits):');
  const dbNodes = await prisma.curriculumNode.findMany({
    orderBy: { subject: 'asc' }
  });
  
  const dbEdges = await prisma.curriculumEdge.findMany({
    include: {
      fromNode: true,
      toNode: true,
    },
  });

  console.log(`   Nodes: ${dbNodes.length}`);
  console.log(`   Edges: ${dbEdges.length}\n`);

  // Compare counts
  const nodesDiff = sourceData.nodes.length - dbNodes.length;
  const edgesDiff = sourceData.edges.length - dbEdges.length;

  console.log('✅ Comparison Results:');
  console.log(`   Nodes difference: ${nodesDiff} (${nodesDiff === 0 ? 'MATCH ✓' : 'MISMATCH ❌'})`);
  console.log(`   Edges difference: ${edgesDiff} (${edgesDiff === 0 ? 'MATCH ✓' : 'MISMATCH ❌'})\n`);

  if (nodesDiff !== 0 || edgesDiff !== 0) {
    console.log('⚠️  Data completeness issues detected!');
    
    if (nodesDiff > 0) {
      console.log(`   Missing ${nodesDiff} nodes in database`);
    }
    if (edgesDiff > 0) {
      console.log(`   Missing ${edgesDiff} edges in database`);
    }
  } else {
    console.log('🎉 All data successfully loaded! We have the complete graph.');
  }

  // Test a very large query with explicit pagination to see if there are any limits
  console.log('\n🧪 Testing for automatic pagination limits...');
  
  try {
    const largeQuery = await prisma.curriculumNode.findMany({
      take: 1000, // Try to get way more than we have
      orderBy: { subject: 'asc' }
    });
    console.log(`   Query with take: 1000 returned ${largeQuery.length} nodes`);

    const unlimitedQuery = await prisma.curriculumNode.findMany({
      orderBy: { subject: 'asc' }
    });
    console.log(`   Query without take returned ${unlimitedQuery.length} nodes`);

    if (largeQuery.length === unlimitedQuery.length) {
      console.log('   ✅ No automatic pagination detected - we get all data!');
    } else {
      console.log('   ⚠️  Possible pagination or limit detected!');
    }

  } catch (error) {
    console.log(`   ❌ Error testing pagination: ${error}`);
  }

  // Check some specific nodes to verify data integrity
  console.log('\n🔍 Spot checking specific nodes...');
  const startNode = await prisma.curriculumNode.findUnique({ where: { id: 'START' } });
  const endNode = await prisma.curriculumNode.findUnique({ where: { id: 'END' } });
  const mathNode = await prisma.curriculumNode.findFirst({ 
    where: { subject: 'math' }
  });

  console.log(`   START node: ${startNode ? '✓ Found' : '❌ Missing'}`);
  console.log(`   END node: ${endNode ? '✓ Found' : '❌ Missing'}`);
  console.log(`   Sample math node: ${mathNode ? '✓ Found' : '❌ Missing'}`);

  await prisma.$disconnect();
}

verifyDataCompleteness().catch(console.error); 