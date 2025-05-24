import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();
import { StudentsClient } from '@/app/students/components/StudentsClient';

async function getStudents(userId: string) {
  return await prisma.student.findMany({
    where: {
      parentUserId: userId,
      isActive: true,
    },
    include: {
      progressLog: {
        include: {
          node: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
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
  const isFirstTimeUser = students.length === 0;

  return <StudentsClient initialStudents={students} isFirstTimeUser={isFirstTimeUser} />;
} 