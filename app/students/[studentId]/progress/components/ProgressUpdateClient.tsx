'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, PlayCircle, TrendingUp, Undo2 } from 'lucide-react';
import { StudentWithRelations } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  getSubjectProgressSummary,
  getUniqueSubjects,
  getCurrentNodeForSubject,
  getNextNode,
  getPreviousNode,
  getFirstNodeForSubject,
} from '@/lib/curriculum';
import { updateStudentProgressAction, removeStudentProgressAction } from '@/app/students/actions';

interface ProgressUpdateClientProps {
  student: StudentWithRelations;
}

interface ProgressActionDialogState {
  isOpen: boolean;
  nodeId: string | null;
  action: 'COMPLETED' | 'GO_BACK' | 'START_SUBJECT' | null;
  nodeName: string;
  subjectName: string;
}

export function ProgressUpdateClient({ student }: ProgressUpdateClientProps) {
  const router = useRouter();
  const [progressActionDialog, setProgressActionDialog] = useState<ProgressActionDialogState>({
    isOpen: false,
    nodeId: null,
    action: null,
    nodeName: '',
    subjectName: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const subjects = getUniqueSubjects();
  const progressSummary = getSubjectProgressSummary(student.progressLog);

  const handleBack = () => {
    router.back();
  };

  const handleProgressAction = async (
    nodeId: string, 
    action: 'COMPLETED' | 'GO_BACK' | 'START_SUBJECT', 
    nodeName: string,
    subjectName: string
  ) => {
    setProgressActionDialog({
      isOpen: true,
      nodeId,
      action,
      nodeName,
      subjectName,
    });
  };

  const confirmProgressAction = async () => {
    if (!progressActionDialog.nodeId || !progressActionDialog.action) return;

    setIsUpdating(true);
    try {
      if (progressActionDialog.action === 'COMPLETED') {
        // Mark current unit as completed
        await updateStudentProgressAction(
          student.id,
          progressActionDialog.nodeId,
          'COMPLETED'
        );
        
        // Check if there's a next unit and start it
        const nextNode = getNextNode(progressActionDialog.nodeId);
        if (nextNode) {
          await updateStudentProgressAction(
            student.id,
            nextNode.id,
            'STARTED'
          );
        }
        
        toast({
          title: 'Unit Completed',
          description: `Marked "${progressActionDialog.nodeName}" as completed${nextNode ? ' and started next unit' : ''}`,
        });
      } else if (progressActionDialog.action === 'GO_BACK') {
        // Remove current unit progress and revert previous unit to started
        const currentProgressEntry = student.progressLog.find(
          log => log.nodeId === progressActionDialog.nodeId && log.action === 'STARTED'
        );
        
        if (currentProgressEntry) {
          await removeStudentProgressAction(student.id, currentProgressEntry.id);
        }
        
        // Find previous unit and remove its COMPLETED status, add STARTED
        const previousNodeObj = getPreviousNode(progressActionDialog.nodeId);
        
        if (previousNodeObj) {
          const previousCompletedEntry = student.progressLog.find(
            log => log.nodeId === previousNodeObj.id && log.action === 'COMPLETED'
          );
          
          if (previousCompletedEntry) {
            await removeStudentProgressAction(student.id, previousCompletedEntry.id);
            await updateStudentProgressAction(
              student.id,
              previousNodeObj.id,
              'STARTED'
            );
          }
        }
        
        toast({
          title: 'Went Back',
          description: `Returned to "${previousNodeObj?.unitTitle || 'previous unit'}" in ${progressActionDialog.subjectName}`,
        });
      } else if (progressActionDialog.action === 'START_SUBJECT') {
        // Start a new subject
        await updateStudentProgressAction(
          student.id,
          progressActionDialog.nodeId,
          'STARTED'
        );
        
        toast({
          title: 'Subject Started',
          description: `Started "${progressActionDialog.nodeName}" in ${progressActionDialog.subjectName}`,
        });
      }

      // Refresh the page to show updated progress
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update progress',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
      setProgressActionDialog({
        isOpen: false,
        nodeId: null,
        action: null,
        nodeName: '',
        subjectName: '',
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getSubjectDisplayName = (subject: string): string => {
    const displayNames: Record<string, string> = {
      'math': 'Mathematics',
      'ela': 'English Language Arts',
      'science': 'Science',
      'humanities': 'History & Social Studies'
    };
    return displayNames[subject.toLowerCase()] || subject.charAt(0).toUpperCase() + subject.slice(1);
  };

  const renderSubjectCard = (subject: string) => {
    const subjectData = progressSummary[subject.toLowerCase()];
    const currentNodeId = getCurrentNodeForSubject(student.progressLog, subject.toLowerCase());
    const currentNode = currentNodeId ? student.progressLog.find(log => log.nodeId === currentNodeId)?.node : null;
    
    // Get previous node
    const previousNodeObj = currentNode ? getPreviousNode(currentNode.id) : null;
    const previousNode = previousNodeObj ? student.progressLog.find(log => log.nodeId === previousNodeObj.id)?.node : null;

    // Get next node for "Next Up" display
    const nextNodeObj = currentNode ? getNextNode(currentNode.id) : null;
    
    // Get first node for starting the subject
    const firstNode = !currentNode ? getFirstNodeForSubject(subject.toLowerCase()) : null;

    const colors = {
      math: 'bg-blue-500',
      ela: 'bg-purple-500',
      science: 'bg-green-500',
      humanities: 'bg-orange-500'
    };

    const subjectColor = colors[subject.toLowerCase() as keyof typeof colors] || 'bg-gray-500';
    const progressPercentage = subjectData?.progressPercentage || 0;

    return (
      <Card key={subject} className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${subjectColor}`} />
              <div>
                <CardTitle className="text-lg">{getSubjectDisplayName(subject)}</CardTitle>
                <CardDescription>
                  {subjectData 
                    ? `${subjectData.completedCount} of ${subjectData.totalCount} units completed`
                    : 'Not started yet'
                  }
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {Math.round(progressPercentage)}%
              </Badge>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2 mt-3" />
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Unit */}
          {currentNode ? (
            <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <PlayCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Currently Studying</h4>
                    <p className="font-semibold">{currentNode.unitTitle}</p>
                    <p className="text-sm text-blue-700">
                      {currentNode.courseTitle} • Grade {currentNode.gradeLevel} • Unit {currentNode.unitNumber}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleProgressAction(
                      currentNode.id,
                      'COMPLETED',
                      currentNode.unitTitle,
                      getSubjectDisplayName(subject)
                    )}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                  {previousNodeObj && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressAction(
                        currentNode.id,
                        'GO_BACK',
                        currentNode.unitTitle,
                        getSubjectDisplayName(subject)
                      )}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      Go Back
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No current unit</p>
              {firstNode ? (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-3">Ready to start this subject?</p>
                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 mb-3">
                    <p className="font-medium text-blue-900">{firstNode.unitTitle}</p>
                    <p className="text-sm text-blue-700">
                      {firstNode.courseTitle} • Grade {firstNode.gradeLevel} • Unit {firstNode.unitNumber}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleProgressAction(
                      firstNode.id,
                      'START_SUBJECT',
                      firstNode.unitTitle,
                      getSubjectDisplayName(subject)
                    )}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start {getSubjectDisplayName(subject)}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">This subject hasn&apos;t been started yet</p>
              )}
            </div>
          )}

          {/* Previous Unit (if exists and different from current) */}
          {previousNode && previousNode.id !== currentNodeId && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-green-900 mb-1">Previously Completed</h4>
                  <p className="font-semibold">{previousNode.unitTitle}</p>
                  <p className="text-sm text-green-700">
                    {previousNode.courseTitle} • Grade {previousNode.gradeLevel} • Unit {previousNode.unitNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next Up (if exists) */}
          {nextNodeObj && (
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-gray-400 bg-white mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-700 mb-1">Next Up</h4>
                  <p className="font-semibold text-gray-900">{nextNodeObj.unitTitle}</p>
                  <p className="text-sm text-gray-600">
                    {nextNodeObj.courseTitle} • Grade {nextNodeObj.gradeLevel} • Unit {nextNodeObj.unitNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {subjectData && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{subjectData.completedCount} / {subjectData.totalCount} units</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={student.avatar || ''} />
            <AvatarFallback>
              {getInitials(student.firstName, student.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-muted-foreground">Progress Management</p>
          </div>
        </div>
      </div>

      {/* Overall Progress Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((subject) => {
              const subjectData = progressSummary[subject.toLowerCase()];
              const progressPercentage = subjectData?.progressPercentage || 0;
              
              return (
                <div key={subject} className="text-center">
                  <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
                  <div className="text-sm text-gray-600 capitalize">{subject}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subject Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects.map(renderSubjectCard)}
      </div>

      {/* Progress Action Dialog */}
      <Dialog open={progressActionDialog.isOpen} onOpenChange={(open) => 
        setProgressActionDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {progressActionDialog.action === 'COMPLETED' ? 'Complete Unit' : progressActionDialog.action === 'GO_BACK' ? 'Go Back to Previous Unit' : 'Start Subject'}
            </DialogTitle>
            <DialogDescription>
              {progressActionDialog.action === 'COMPLETED' 
                ? `Mark "${progressActionDialog.nodeName}" as completed in ${progressActionDialog.subjectName}?`
                : progressActionDialog.action === 'GO_BACK'
                  ? `Go back to the previous unit in ${progressActionDialog.subjectName}? This will mark "${progressActionDialog.nodeName}" as not started.`
                  : `Start "${progressActionDialog.nodeName}" in ${progressActionDialog.subjectName}?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProgressActionDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmProgressAction} 
              disabled={isUpdating}
              className={progressActionDialog.action === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : progressActionDialog.action === 'GO_BACK' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {isUpdating ? 'Updating...' : progressActionDialog.action === 'COMPLETED' ? 'Complete' : progressActionDialog.action === 'GO_BACK' ? 'Go Back' : 'Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 