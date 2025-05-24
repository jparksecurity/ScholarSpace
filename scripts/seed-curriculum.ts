import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

const SAMPLE_CURRICULUM = [
  {
    id: 'math-addition-k',
    unitTitle: 'Basic Addition',
    unitNumber: 1,
    courseTitle: 'Kindergarten Math',
    coursePath: 'mathematics/kindergarten',
    gradeLevel: 'Kindergarten',
    subject: 'Mathematics',
  },
  {
    id: 'math-subtraction-k',
    unitTitle: 'Basic Subtraction', 
    unitNumber: 2,
    courseTitle: 'Kindergarten Math',
    coursePath: 'mathematics/kindergarten',
    gradeLevel: 'Kindergarten',
    subject: 'Mathematics',
  },
  {
    id: 'reading-phonics-k',
    unitTitle: 'Letter Sounds',
    unitNumber: 1,
    courseTitle: 'Kindergarten Reading',
    coursePath: 'english/kindergarten',
    gradeLevel: 'Kindergarten',
    subject: 'English Language Arts',
  },
  {
    id: 'reading-sight-words-k',
    unitTitle: 'Sight Words',
    unitNumber: 2,
    courseTitle: 'Kindergarten Reading', 
    coursePath: 'english/kindergarten',
    gradeLevel: 'Kindergarten',
    subject: 'English Language Arts',
  },
];

async function seedCurriculum() {
  console.log('Seeding curriculum nodes...');
  
  for (const node of SAMPLE_CURRICULUM) {
    await prisma.curriculumNode.upsert({
      where: { id: node.id },
      update: node,
      create: node,
    });
    console.log(`✓ Created/updated curriculum node: ${node.id}`);
  }
  
  console.log('✅ Curriculum seeding completed!');
}

seedCurriculum()
  .catch((e) => {
    console.error('❌ Error seeding curriculum:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 