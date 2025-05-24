import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getStudentProgress } from '@/lib/data-access/students';
import { ProgressUpdateClient } from './components/ProgressUpdateClient';

interface Props {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function StudentProgressPage({ params }: Props) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const { studentId } = await params;
  const student = await getStudentProgress(studentId, userId);

  if (!student) {
    redirect('/students');
  }

  return <ProgressUpdateClient student={student} />;
} 