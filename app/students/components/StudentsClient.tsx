'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, User, Calendar, TrendingUp, Eye, ArrowRight, BookOpen, Award } from 'lucide-react';
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
import { getSubjectProgressPercentage, getNodeById, getCoursesBySubject, getNextNode } from '@/lib/curriculum';

interface StudentsClientProps {
  initialStudents: StudentWithRelations[];
}

export function StudentsClient({ initialStudents }: StudentsClientProps) {
  const [students, setStudents] = useState(initialStudents);
  const [showForm, setShowForm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithRelations | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState<StudentWithRelations | null>(null);
  const [onboardingData, setOnboardingData] = useState<{
    subjectProgress?: Array<{
      subject: string;
      currentNodeId: string | null;
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
    subjectProgress?: Array<{
      subject: string;
      currentNodeId: string | null;
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

  const handleShowProgressDetail = (student: StudentWithRelations) => {
    setSelectedStudentForProgress(student);
    setShowProgressDetail(true);
  };

  const calculateProgress = (student: StudentWithRelations) => {
    // Calculate overall progress based on subject progress
    if (!student.subjectProgress || student.subjectProgress.length === 0) return 0;
    
    const progressValues = student.subjectProgress.map(sp => 
      getSubjectProgressPercentage(sp.currentNodeId, sp.subject)
    );
    
    const averageProgress = progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length;
    return Math.round(averageProgress);
  };

  const calculateSubjectProgress = (student: StudentWithRelations) => {
    const subjectProgressMap: Record<string, {name: string, progress: number, color: string}> = {};
    
    const subjectNames = {
      math: 'Math',
      ela: 'ELA', 
      science: 'Science',
      humanities: 'Social Studies'
    };
    
    const colors = {
      math: 'bg-blue-500',
      ela: 'bg-green-500',
      science: 'bg-purple-500', 
      humanities: 'bg-orange-500'
    };

    // Use SubjectProgress if available
    if (student.subjectProgress && student.subjectProgress.length > 0) {
      student.subjectProgress.forEach(sp => {
        const progress = getSubjectProgressPercentage(sp.currentNodeId, sp.subject);
        
        subjectProgressMap[sp.subject] = {
          name: subjectNames[sp.subject as keyof typeof subjectNames] || sp.subject,
          progress,
          color: colors[sp.subject as keyof typeof colors] || 'bg-gray-500'
        };
      });
    } else {
      // Fallback to old method if no subject progress exists
      const subjects = ['math', 'ela', 'science', 'humanities'];
      
      subjects.forEach(subject => {
        const subjectNodes = student.progress.filter(p => 
          p.curriculumNode?.subject === subject
        );
        
        if (subjectNodes.length > 0) {
          const completed = subjectNodes.filter(p => 
            p.status === 'COMPLETED'
          ).length;
          const progress = Math.round((completed / subjectNodes.length) * 100);
          
          subjectProgressMap[subject] = {
            name: subjectNames[subject as keyof typeof subjectNames],
            progress,
            color: colors[subject as keyof typeof colors]
          };
        }
      });
    }
    
    return subjectProgressMap;
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
          onboardingData={onboardingData || undefined}
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

      {/* Detailed Progress Modal */}
      <Dialog open={showProgressDetail} onOpenChange={setShowProgressDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedStudentForProgress?.avatar || ''} />
                <AvatarFallback>
                  {selectedStudentForProgress ? 
                    getInitials(selectedStudentForProgress.firstName, selectedStudentForProgress.lastName) : 
                    '?'
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg">
                  {selectedStudentForProgress?.firstName} {selectedStudentForProgress?.lastName}&apos;s Progress
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  Detailed subject-by-subject breakdown
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudentForProgress && (
            <div className="space-y-6">
              {/* Overall Progress Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Completion</span>
                      <span className="font-medium">{calculateProgress(selectedStudentForProgress)}%</span>
                    </div>
                    <Progress value={calculateProgress(selectedStudentForProgress)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Subject Details */}
              <div className="grid gap-4">
                {Object.entries(calculateSubjectProgress(selectedStudentForProgress)).map(([subject, data]) => {
                  const subjectProgress = selectedStudentForProgress.subjectProgress?.find(sp => sp.subject === subject);
                  const currentNode = subjectProgress?.currentNodeId ? getNodeById(subjectProgress.currentNodeId) : null;
                  const nextNode = currentNode ? getNextNode(currentNode.id) : null;
                  const courses = getCoursesBySubject(subject);
                  
                  return (
                    <Card key={subject}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${data.color}`} />
                            {data.name}
                          </div>
                          <Badge variant="secondary">{data.progress}% Complete</Badge>
                        </CardTitle>
                        {currentNode && (
                          <CardDescription>
                            Currently studying: {currentNode.course_title} - {currentNode.unit_title}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Subject Progress</span>
                            <span className="font-medium">{data.progress}%</span>
                          </div>
                          <Progress value={data.progress} className="h-2" />
                        </div>
                        
                        {/* Current Course Info */}
                        {currentNode && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">Current Course</span>
                            </div>
                            <div className="text-sm text-blue-800">
                              <div className="font-medium">{currentNode.course_title}</div>
                              <div className="text-blue-600">Grade {currentNode.grade_level}</div>
                              <div className="mt-1">Unit {currentNode.unit_number}: {currentNode.unit_title}</div>
                            </div>
                            
                            {nextNode && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                  <ArrowRight className="h-3 w-3" />
                                  <span>Next: {nextNode.unit_title}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Available Courses */}
                        {courses.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">Available Courses in {data.name}</div>
                            <div className="grid gap-2">
                              {courses.slice(0, 3).map((course) => (
                                <div key={course.id} className="bg-gray-50 rounded p-3 text-sm">
                                  <div className="font-medium">{course.title}</div>
                                  <div className="text-gray-600">Grade {course.gradeLevel} • {course.units.length} units</div>
                                </div>
                              ))}
                              {courses.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{courses.length - 3} more courses available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                {Object.keys(calculateSubjectProgress(selectedStudentForProgress)).length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Progress Data Yet</h3>
                                             <p className="text-muted-foreground">
                         This student hasn&apos;t started any courses yet. Complete the initial assessment to begin tracking progress.
                       </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 