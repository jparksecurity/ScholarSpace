import { PrismaClient } from "../lib/generated/prisma";
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CurriculumNetworkData {
  metadata: {
    description: string;
    total_nodes: number;
    total_edges: number;
    creation_date: string;
    node_structure: string;
    edge_types: {
      sequential: string;
      foundational: string;
      grade_progression: string;
    };
    start_nodes: number;
    end_nodes: number;
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

export async function main() {
  console.log('Starting curriculum data seed...');

  // Read the curriculum data file
  const dataPath = path.join(process.cwd(), 'curriculum_prerequisite_network.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const curriculumData: CurriculumNetworkData = JSON.parse(rawData);

  console.log(`Loading ${curriculumData.nodes.length} nodes and ${curriculumData.edges.length} edges...`);

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.curriculumEdge.deleteMany();
  await prisma.curriculumNode.deleteMany();

  // Insert nodes first
  console.log('Inserting curriculum nodes...');
  for (const node of curriculumData.nodes) {
    await prisma.curriculumNode.create({
      data: {
        id: node.id,
        unitTitle: node.unit_title,
        unitNumber: node.unit_number,
        courseTitle: node.course_title,
        coursePath: node.course_path,
        gradeLevel: node.grade_level,
        subject: node.subject,
      },
    });
  }

  // Insert edges
  console.log('Inserting curriculum edges...');
  for (const edge of curriculumData.edges) {
    await prisma.curriculumEdge.create({
      data: {
        fromNodeId: edge.from,
        toNodeId: edge.to,
        relationshipType: edge.relationship_type,
        description: edge.description,
      },
    });
  }

  console.log('Curriculum data seeding completed successfully!');
  console.log(`Inserted ${curriculumData.nodes.length} nodes and ${curriculumData.edges.length} edges`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 