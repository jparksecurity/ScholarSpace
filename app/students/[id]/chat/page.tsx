import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { notFound } from 'next/navigation';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { userId } = await auth();
  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const student = await prisma.student.findFirst({
    where: {
      id: params.id,
      userId,
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Chat with AI Tutor - {student.firstName} {student.lastName}
        </h1>
        <ChatInterface
          studentId={student.id}
          studentName={`${student.firstName} ${student.lastName}`}
        />
      </div>
    </div>
  );
}