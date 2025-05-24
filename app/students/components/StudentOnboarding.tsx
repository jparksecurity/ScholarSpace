'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, GraduationCap, Target, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  getSubjectInfo, 
  getCoursesBySubject, 
  subjectCurriculumToEnum,
  type SubjectInfo, 
  type CourseInfo 
} from '@/lib/curriculum';

interface StudentOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

interface OnboardingData {
  subjectProgress: {
    subject: string;
    currentNodeId: string | null;
  }[];
}

export function StudentOnboarding({ onComplete, onClose }: StudentOnboardingProps) {
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [subjectProgress, setSubjectProgress] = useState<Record<string, string | null>>({});
  const [showIntro, setShowIntro] = useState(true);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [currentSubjectCourses, setCurrentSubjectCourses] = useState<CourseInfo[]>([]);

  useEffect(() => {
    setSubjects(getSubjectInfo());
  }, []);

  useEffect(() => {
    if (subjects[currentSubjectIndex]) {
      const courses = getCoursesBySubject(subjects[currentSubjectIndex].subject);
      setCurrentSubjectCourses(courses);
    }
  }, [currentSubjectIndex, subjects]);

  const totalSteps = subjects.length;
  const progressPercentage = totalSteps > 0 ? ((currentSubjectIndex + 1) / totalSteps) * 100 : 0;
  const currentSubject = subjects[currentSubjectIndex];

  const handleProgressChange = (subject: string, nodeId: string | null) => {
    setSubjectProgress(prev => ({ ...prev, [subject]: nodeId }));
  };

  const handleNext = () => {
    if (currentSubjectIndex < totalSteps - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(currentSubjectIndex - 1);
    }
  };

  const handleComplete = () => {
    // Convert curriculum format subjects to enum format for database storage
    const subjectProgressData = Object.entries(subjectProgress).map(([subject, currentNodeId]) => ({
      subject: subjectCurriculumToEnum(subject), // Convert to enum format
      currentNodeId,
    }));

    onComplete({ subjectProgress: subjectProgressData });
  };

  const canProceed = () => {
    if (!currentSubject) return false;
    // For now, allow proceeding without selection (meaning "hasn't started")
    return true;
  };

  if (showIntro) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Student Learning Assessment</DialogTitle>
            <DialogDescription>
              Let&apos;s understand where your student is in their learning journey across all subjects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  How This Assessment Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  For each subject, we&apos;ll show you the learning sequence from basic to advanced topics. 
                  Simply tell us what unit your student should work on next in that subject. 
                  This helps us understand exactly where they are in their learning journey.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject) => (
                    <Card key={subject.subject} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                        <CardDescription className="text-sm">
                          {subject.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs">
                          Sequential learning path
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    What We&apos;re Looking For
                  </h4>
                  <p className="text-sm text-blue-800">
                    Select the unit your student should <strong>work on next</strong>. 
                    If they haven&apos;t started a subject yet, that&apos;s perfectly fine - just leave it unselected 
                    and we&apos;ll start them at the beginning.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setShowIntro(false)} size="lg">
                Start Assessment
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentSubject) {
    return null; // Loading state
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {currentSubject.subjectName} - Learning Path
              </DialogTitle>
              <DialogDescription>
                Step {currentSubjectIndex + 1} of {totalSteps} • {currentSubject.description}
              </DialogDescription>
            </div>
            <Badge variant="outline">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              What unit should your student work on next in {currentSubject.subjectName}?
            </h3>
            <p className="text-muted-foreground">
              Select the unit they should focus on next in their learning journey. 
              If they haven&apos;t started this subject, leave it unselected.
            </p>
          </div>

          <RadioGroup
            value={subjectProgress[currentSubject.subject] || ''}
            onValueChange={(value) => handleProgressChange(currentSubject.subject, value || null)}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <RadioGroupItem value="" id={`${currentSubject.subject}-not-started`} />
                <Label 
                  htmlFor={`${currentSubject.subject}-not-started`}
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                >
                  <Play className="h-4 w-4 text-gray-500" />
                  Haven&apos;t started {currentSubject.subjectName} yet
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              {currentSubjectCourses.map((course) => (
                <Card key={course.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{course.title}</CardTitle>
                        <CardDescription className="text-sm">
                          Grade Level: {course.gradeLevel}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {course.gradeLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2">
                      {course.units.map((unit) => (
                        <div key={unit.id} className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                          <RadioGroupItem value={unit.id} id={unit.id} />
                          <Label 
                            htmlFor={unit.id}
                            className="flex items-center gap-2 cursor-pointer text-sm flex-1"
                          >
                            <Circle className="h-3 w-3 text-blue-600" />
                            <span className="font-medium">Unit {unit.unit_number}:</span>
                            <span>{unit.unit_title}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentSubjectIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Save for Later
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {currentSubjectIndex === totalSteps - 1 ? 'Complete Assessment' : 'Next Subject'}
                {currentSubjectIndex !== totalSteps - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 