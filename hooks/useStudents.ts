import { useState, useEffect } from 'react';
import { Student, StudentProgress, StudentEnrollment, SubjectProgress } from '@/lib/generated/prisma';

export interface StudentWithRelations extends Student {
  progress: (StudentProgress & {
    curriculumNode: {
      id: string;
      unitTitle: string;
      courseTitle: string;
      gradeLevel: string;
      subject: string;
    };
  })[];
  subjectProgress: SubjectProgress[];
  enrollments: StudentEnrollment[];
}

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gradeLevel: string;
  avatar?: string;
  bio?: string;
  subjects?: string[];
  subjectProgress?: {
    subject: string;
    lastCompletedNodeId: string | null;
  }[];
}

export interface UpdateStudentData extends Partial<CreateStudentData> {}

interface UseStudentsReturn {
  students: StudentWithRelations[];
  loading: boolean;
  error: string | null;
  createStudent: (data: CreateStudentData) => Promise<StudentWithRelations | null>;
  updateStudent: (id: string, data: UpdateStudentData) => Promise<StudentWithRelations | null>;
  deleteStudent: (id: string) => Promise<boolean>;
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
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (data: CreateStudentData): Promise<StudentWithRelations | null> => {
    try {
      setError(null);
      
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }
      
      const newStudent = await response.json();
      setStudents(prev => [newStudent, ...prev]);
      return newStudent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating student:', err);
      return null;
    }
  };

  const updateStudent = async (id: string, data: UpdateStudentData): Promise<StudentWithRelations | null> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }
      
      const updatedStudent = await response.json();
      setStudents(prev =>
        prev.map(student => (student.id === id ? updatedStudent : student))
      );
      return updatedStudent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error updating student:', err);
      return null;
    }
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }
      
      setStudents(prev => prev.filter(student => student.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting student:', err);
      return false;
    }
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