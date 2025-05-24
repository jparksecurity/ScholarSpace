import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUserStudents } from '@/lib/data-access/students';
import { getLearningPlansForStudent } from '@/lib/data-access/learning-plans';
import { getCurriculumNodes } from '@/lib/data-access/curriculum';
import { LearningPlansClient } from './components/LearningPlansClient';

export default async function LearningPlansPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Get students and their learning plans
  const students = await getCurrentUserStudents();
  
  // Get all learning plans for all students
  const allPlans = [];
  const allUnitIds = new Set<string>();
  
  for (const student of students) {
    const plans = await getLearningPlansForStudent(student.id, userId);
    // Add student info to each plan
    const plansWithStudent = plans.map(plan => ({
      ...plan,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      studentName: `${student.firstName} ${student.lastName}`,
    }));
    allPlans.push(...plansWithStudent);
    
    // Collect all unit IDs for curriculum fetching
    plans.forEach(plan => {
      plan.unitIds.forEach(unitId => allUnitIds.add(unitId));
    });
  }

  // Sort plans by creation date
  allPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fetch all curriculum nodes needed
  const curriculumNodes = await getCurriculumNodes(Array.from(allUnitIds));

  return <LearningPlansClient 
    initialStudents={students} 
    initialPlans={allPlans} 
    curriculumNodes={curriculumNodes}
  />;
} 