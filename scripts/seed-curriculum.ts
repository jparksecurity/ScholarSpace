import { PrismaClient } from '../lib/generated/prisma';
import curriculumData from '../curriculum_prerequisite_network.json';

const prisma = new PrismaClient();

async function seedCurriculum() {
  console.log('Starting curriculum seeding...');

  const { nodes, edges } = curriculumData;

  try {
    // Insert curriculum nodes
    console.log(`Seeding ${nodes.length} curriculum nodes...`);
    
    for (const node of nodes) {
      await prisma.curriculumNode.upsert({
        where: { id: node.id },
        update: {
          unitTitle: node.unit_title,
          unitNumber: node.unit_number,
          courseTitle: node.course_title,
          coursePath: node.course_path,
          gradeLevel: node.grade_level,
          subject: node.subject,
        },
        create: {
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

    // Insert curriculum edges
    console.log(`Seeding ${edges.length} curriculum edges...`);
    
    for (const edge of edges) {
      await prisma.curriculumEdge.upsert({
        where: {
          fromNodeId_toNodeId: {
            fromNodeId: edge.from,
            toNodeId: edge.to,
          },
        },
        update: {
          relationshipType: edge.relationship_type,
          description: edge.description,
        },
        create: {
          fromNodeId: edge.from,
          toNodeId: edge.to,
          relationshipType: edge.relationship_type,
          description: edge.description,
        },
      });
    }

    console.log('✅ Curriculum seeding completed successfully!');
    console.log(`📚 Seeded ${nodes.length} nodes and ${edges.length} edges`);
    
  } catch (error) {
    console.error('❌ Error seeding curriculum:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedCurriculum()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedCurriculum; 