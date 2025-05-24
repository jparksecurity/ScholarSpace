import { useState, useEffect } from 'react';
import { Student, ProgressLog, CurriculumNode } from '@/lib/generated/prisma';
import { subjectCurriculumToEnum, isValidSubjectEnum } from '@/lib/curriculum';

export interface ProgressLogWithNode extends ProgressLog {
  node: CurriculumNode;
}

export interface StudentWithRelations extends Student {
  progressLog: ProgressLogWithNode[];
}

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  avatar?: string;
  initialProgress?: {
    subject: string;
    lastCompletedNodeId: string | null;
  }[];
}

export interface UpdateStudentData extends Partial<CreateStudentData> {}

interface UseStudentsReturn {
  students: StudentWithRelations[];
  loading: boolean;
  error: string | null;
  createStudent: (data: CreateStudentData) => Promise<StudentWithRelations>;
  updateStudent: (id: string, data: UpdateStudentData) => Promise<StudentWithRelations>;
  deleteStudent: (id: string) => Promise<void>;
  refreshStudents: () => Promise<void>;
}

export function useStudents(): UseStudentsReturn {
  const [students, setStudents] = useState<StudentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/students');
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      setStudents(data.students || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (studentData: CreateStudentData): Promise<StudentWithRelations> => {
    const response = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...studentData,
        // Convert initialProgress to the expected format for the API
        initialProgress: studentData.initialProgress?.map(ip => {
          const enumSubject = subjectCurriculumToEnum(ip.subject);
          return {
            subject: enumSubject,
            lastCompletedNodeId: ip.lastCompletedNodeId,
          };
        }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create student');
    }

    const data = await response.json();
    
    // Update local state
    setStudents(prevStudents => [...prevStudents, data.student]);
    
    return data.student;
  };

  const updateStudent = async (id: string, updates: Partial<CreateStudentData>): Promise<StudentWithRelations> => {
    const response = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update student');
    }

    const data = await response.json();
    
    // Update local state
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === id ? data.student : student
      )
    );
    
    return data.student;
  };

  const deleteStudent = async (id: string): Promise<void> => {
    const response = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete student');
    }
    
    // Update local state
    setStudents(prevStudents =>
      prevStudents.filter(student => student.id !== id)
    );
  };

  const refreshStudents = async () => {
    await fetchStudents();
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    refreshStudents,
  };
} 