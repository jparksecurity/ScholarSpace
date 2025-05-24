import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { StudentsClient } from '@/app/dashboard/students/components/StudentsClient';

async function getStudents(userId: string) {
  return await prisma.student.findMany({
    where: {
      parentUserId: userId,
      isActive: true,
    },
    include: {
      progress: {
        include: {
          curriculumNode: true,
        },
      },
      enrollments: {
        where: { isActive: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function StudentsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const students = await getStudents(userId);

  return <StudentsClient initialStudents={students} />;
} 