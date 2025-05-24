'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, User, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { StudentWithRelations } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StudentForm } from '@/app/dashboard/students/components/StudentForm';
import { StudentOnboarding } from '@/app/dashboard/students/components/StudentOnboarding';
import { deleteStudentAction } from '@/app/dashboard/students/actions';

interface StudentsClientProps {
  initialStudents: StudentWithRelations[];
}

export function StudentsClient({ initialStudents }: StudentsClientProps) {
  const [students, setStudents] = useState(initialStudents);
  const [showForm, setShowForm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithRelations | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<{
    currentProgress?: Array<{
      nodeId: string;
      status?: string;
      score?: number;
      completedAt?: string;
    }>;
  } | null>(null);

  const handleAddStudent = () => {
    setEditingStudent(null);
    setOnboardingData(null);
    setShowOnboarding(true);
  };

  const handleEditStudent = (student: StudentWithRelations) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudentAction(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setDeletingStudentId(null);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleOnboardingComplete = (data: {
    currentProgress?: Array<{
      nodeId: string;
      status?: string;
      score?: number;
      completedAt?: string;
    }>;
  }) => {
    setShowOnboarding(false);
    setOnboardingData(data);
    setShowForm(true);
  };

  const handleStudentCreated = (newStudent: StudentWithRelations) => {
    setStudents(prev => [newStudent, ...prev]);
  };

  const handleStudentUpdated = (updatedStudent: StudentWithRelations) => {
    setStudents(prev =>
      prev.map(student => (student.id === updatedStudent.id ? updatedStudent : student))
    );
  };

  const calculateProgress = (student: StudentWithRelations) => {
    if (student.progress.length === 0) return 0;
    const completed = student.progress.filter(p => 
      p.status === 'COMPLETED' || p.status === 'MASTERED'
    ).length;
    return Math.round((completed / student.progress.length) * 100);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-muted-foreground">
            Manage your children&apos;s learning progress
          </p>
        </div>
        <Button onClick={handleAddStudent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {students.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No students yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first student to start tracking their learning progress
            </p>
            <Button onClick={handleAddStudent}>Add Student</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar || ''} />
                      <AvatarFallback>
                        {getInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Grade {student.gradeLevel}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStudent(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingStudentId(student.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-medium">{calculateProgress(student)}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${calculateProgress(student)}%` }}
                    />
                  </div>

                  {student.enrollments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {student.enrollments.map((enrollment, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {enrollment.subject}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {student.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {student.bio}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onboardingData={onboardingData}
          onClose={() => {
            setShowForm(false);
            setEditingStudent(null);
            setOnboardingData(null);
          }}
          onStudentCreated={handleStudentCreated}
          onStudentUpdated={handleStudentUpdated}
        />
      )}

      {/* Student Onboarding Modal */}
      {showOnboarding && (
        <StudentOnboarding
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingStudentId}
        onOpenChange={() => setDeletingStudentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the student from your account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStudentId && handleDeleteStudent(deletingStudentId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 