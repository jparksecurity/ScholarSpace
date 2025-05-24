import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUserStudents } from '@/lib/data-access/students';
import { StudentsClient } from '@/app/students/components/StudentsClient';

export default async function StudentsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const students = await getCurrentUserStudents();

  return <StudentsClient initialStudents={students} />;
} 