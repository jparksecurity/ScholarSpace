'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, User, Calendar, TrendingUp, Eye, BookOpen } from 'lucide-react';
import { StudentWithRelations } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatAge } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StudentForm } from './StudentForm';
import { StudentOnboarding } from './StudentOnboarding';
import { deleteStudentAction } from '../actions';
import { 
  getSubjectProgressSummary,
  getNodeById, 
  getCoursesBySubject, 
} from '@/lib/curriculum';

interface StudentsClientProps {
  initialStudents: StudentWithRelations[];
  isFirstTimeUser?: boolean;
}

interface OnboardingData {
  initialProgress: Array<{
    subject: string;
    lastCompletedNodeId: string | null;
  }>;
}

export function StudentsClient({ initialStudents, isFirstTimeUser = false }: StudentsClientProps) {
  const [students, setStudents] = useState(initialStudents);
  const [showOnboarding, setShowOnboarding] = useState(isFirstTimeUser);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithRelations | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentWithRelations | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<StudentWithRelations | null>(null);

  const handleCreateStudent = () => {
    setEditingStudent(null);
    setOnboardingData(null);
    setShowForm(true);
  };

  const handleEditStudent = (student: StudentWithRelations) => {
    setEditingStudent(student);
    setOnboardingData(null);
    setShowForm(true);
  };

  const handleOnboardingComplete = (data: OnboardingData) => {
    setOnboardingData(data);
    setShowOnboarding(false);
    setShowForm(true);
  };

  const handleStudentCreated = (newStudent: StudentWithRelations) => {
    setStudents([newStudent, ...students]);
  };

  const handleStudentUpdated = (updatedStudent: StudentWithRelations) => {
    setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleDeleteStudent = async (student: StudentWithRelations) => {
    try {
      await deleteStudentAction(student.id);
      setStudents(students.filter(s => s.id !== student.id));
      setDeletingStudent(null);
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  const handleShowProgressDetail = (student: StudentWithRelations) => {
    setSelectedStudentForProgress(student);
    setShowProgressDetail(true);
  };

  const calculateProgress = (student: StudentWithRelations) => {
    if (!student.progressLog || student.progressLog.length === 0) return 0;
    
    const progressSummary = getSubjectProgressSummary(student.progressLog);
    const progressValues = Object.values(progressSummary).map((summary: {
      progressPercentage: number;
    }) => summary.progressPercentage);
    
    if (progressValues.length === 0) return 0;
    
    return Math.round(progressValues.reduce((sum: number, val: number) => sum + val, 0) / progressValues.length);
  };

  const calculateSubjectProgress = (student: StudentWithRelations) => {
    if (!student.progressLog || student.progressLog.length === 0) {
      return {};
    }
    
    const progressSummary = getSubjectProgressSummary(student.progressLog);
    
    const colors = {
      math: 'bg-blue-500',
      ela: 'bg-purple-500',
      science: 'bg-green-500',
      humanities: 'bg-orange-500'
    };

    const result: Record<string, {name: string, progress: number, color: string}> = {};
    
    Object.entries(progressSummary).forEach(([subject, data]: [string, {
      subjectName: string;
      progressPercentage: number;
    }]) => {
      result[subject] = {
        name: data.subjectName,
        progress: data.progressPercentage,
        color: colors[subject as keyof typeof colors] || 'bg-gray-500'
      };
    });
    
    return result;
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
        <Button onClick={handleCreateStudent} className="flex items-center gap-2">
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
            <Button onClick={handleCreateStudent}>Add Student</Button>
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
                        {formatAge(student.dateOfBirth)}
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
                      onClick={() => setDeletingStudent(student)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subject Progress</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-medium">{calculateProgress(student)}% Overall</span>
                    </div>
                  </div>
                  
                  <div 
                    className="space-y-2 cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
                    onClick={() => handleShowProgressDetail(student)}
                  >
                    {Object.entries(calculateSubjectProgress(student)).map(([subject, data]) => (
                      <div key={subject} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{data.name}</span>
                          <span>{data.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`${data.color} h-1.5 rounded-full transition-all`}
                            style={{ width: `${data.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {Object.keys(calculateSubjectProgress(student)).length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No progress data yet</p>
                        <p className="text-xs text-muted-foreground">Complete the assessment to see progress</p>
                      </div>
                    )}
                    
                    {Object.keys(calculateSubjectProgress(student)).length > 0 && (
                      <div className="flex items-center justify-center text-xs text-muted-foreground mt-2 pt-2 border-t border-gray-100">
                        <Eye className="h-3 w-3 mr-1" />
                        Click to view detailed progress
                      </div>
                    )}
                  </div>
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
          onboardingData={onboardingData ? {
            initialProgress: onboardingData.initialProgress.map(item => ({
              subject: item.subject,
              nodeId: item.lastCompletedNodeId
            }))
          } : undefined}
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
        open={!!deletingStudent}
        onOpenChange={() => setDeletingStudent(null)}
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
              onClick={() => deletingStudent && handleDeleteStudent(deletingStudent)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detailed Progress Modal */}
      <Dialog open={showProgressDetail} onOpenChange={setShowProgressDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedStudentForProgress?.avatar || ''} />
                <AvatarFallback>
                  {selectedStudentForProgress && getInitials(selectedStudentForProgress.firstName, selectedStudentForProgress.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">
                  {selectedStudentForProgress?.firstName} {selectedStudentForProgress?.lastName} - Learning Progress
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Progress: {selectedStudentForProgress && calculateProgress(selectedStudentForProgress)}%
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4">
              {selectedStudentForProgress && Object.entries(calculateSubjectProgress(selectedStudentForProgress)).map(([subject, data]) => {
                const progressSummary = getSubjectProgressSummary(selectedStudentForProgress.progressLog || []);
                const subjectData = progressSummary[subject];
                const currentNode = subjectData?.currentNodeId ? getNodeById(subjectData.currentNodeId) : null;
                const courses = getCoursesBySubject(subject);
                
                return (
                  <Card key={subject}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${data.color}`} />
                          <div>
                            <CardTitle className="text-lg">{data.name}</CardTitle>
                            <CardDescription>
                              {currentNode 
                                ? `Currently working on: ${currentNode.unit_title}` 
                                : 'Not started yet'
                              }
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{data.progress}% Complete</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{data.progress}%</span>
                            {subjectData && (
                              <span className="text-muted-foreground">
                                {subjectData.completedCount} of {subjectData.totalCount} units completed
                              </span>
                            )}
                          </div>
                          <Progress value={data.progress} className="h-2" />
                        </div>
                        
                        {currentNode && (
                          <div className="text-sm space-y-1 pt-3 border-t">
                            <div className="font-medium">Current Unit Details:</div>
                            <div className="text-muted-foreground">
                              <div>Course: {currentNode.course_title}</div>
                              <div>Grade Level: {currentNode.grade_level}</div>
                              <div>Unit: {currentNode.unit_title}</div>
                            </div>
                          </div>
                        )}
                        
                        {courses.length > 0 && (
                          <div className="pt-3 border-t">
                            <div className="text-sm font-medium mb-2">Available Courses:</div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              {courses.slice(0, 3).map((course, index) => (
                                <div key={index}>• {course.title}</div>
                              ))}
                              {courses.length > 3 && <div>... and {courses.length - 3} more</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {selectedStudentForProgress && Object.keys(calculateSubjectProgress(selectedStudentForProgress)).length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Progress Data</h3>
                  <p className="text-muted-foreground">
                    This student hasn&apos;t started any subjects yet. 
                    Complete the initial assessment to set up their learning path.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 