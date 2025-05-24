'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
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

interface StudentOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

interface OnboardingData {
  currentProgress: {
    nodeId: string;
    status: string;
    score?: number;
  }[];
}

interface CurriculumSample {
  id: string;
  unitTitle: string;
  courseTitle: string;
  gradeLevel: string;
  subject: string;
  description: string;
}

// Mock curriculum data for onboarding - in real app, this would come from your curriculum API
const SAMPLE_CURRICULUM: CurriculumSample[] = [
  {
    id: 'math-addition-k',
    unitTitle: 'Basic Addition',
    courseTitle: 'Kindergarten Math',
    gradeLevel: 'Kindergarten',
    subject: 'Mathematics',
    description: 'Understanding numbers 1-10 and simple addition problems like 2+3=5',
  },
  {
    id: 'math-subtraction-k',
    unitTitle: 'Basic Subtraction',
    courseTitle: 'Kindergarten Math',
    gradeLevel: 'Kindergarten',
    subject: 'Mathematics',
    description: 'Simple subtraction problems like 5-2=3 using objects and visual aids',
  },
  {
    id: 'reading-phonics-k',
    unitTitle: 'Letter Sounds',
    courseTitle: 'Kindergarten Reading',
    gradeLevel: 'Kindergarten',
    subject: 'English Language Arts',
    description: 'Recognizing letters and their sounds, basic phonics',
  },
  {
    id: 'reading-sight-words-k',
    unitTitle: 'Sight Words',
    courseTitle: 'Kindergarten Reading',
    gradeLevel: 'Kindergarten',
    subject: 'English Language Arts',
    description: 'Common words like "the", "and", "is", "to" that children should recognize instantly',
  },
];

const STATUS_OPTIONS = [
  { value: 'MASTERED', label: 'Mastered', icon: CheckCircle, color: 'text-green-600', description: 'Student has fully mastered this concept' },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'text-blue-600', description: 'Student has completed but may need review' },
  { value: 'IN_PROGRESS', label: 'Learning', icon: HelpCircle, color: 'text-yellow-600', description: 'Student is currently learning this' },
  { value: 'NOT_STARTED', label: 'Not Started', icon: XCircle, color: 'text-gray-600', description: 'Student hasn\'t started this yet' },
];

export function StudentOnboarding({ onComplete, onClose }: StudentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [curriculum, setCurriculum] = useState<CurriculumSample[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch curriculum based on selected grade level
    setCurriculum(SAMPLE_CURRICULUM);
  }, []);

  const totalSteps = curriculum.length + 1; // +1 for intro step
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const handleStatusChange = (nodeId: string, status: string) => {
    setProgress(prev => ({ ...prev, [nodeId]: status }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const currentProgress = Object.entries(progress).map(([nodeId, status]) => ({
      nodeId,
      status,
    }));

    onComplete({ currentProgress });
  };

  const handleQuickSetup = () => {
    // Mark all curriculum items as "NOT_STARTED" for quick setup
    const quickProgress = curriculum.map(item => ({
      nodeId: item.id,
      status: 'NOT_STARTED',
    }));

    onComplete({ currentProgress: quickProgress });
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <BookOpen className="h-16 w-16 mx-auto text-blue-600 mb-4" />
        <h3 className="text-2xl font-bold mb-2">Let&apos;s Set Up Your Student&apos;s Profile</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We&apos;ll go through a few key learning concepts to understand where your student is in their learning journey. 
          This helps us provide personalized recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNext}>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Assessment</CardTitle>
            <CardDescription>
              Go through each concept to accurately assess your student&apos;s current level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Assessment</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleQuickSetup}>
          <CardHeader>
            <CardTitle className="text-lg">Quick Setup</CardTitle>
            <CardDescription>
              Start with a fresh slate - mark everything as &quot;Not Started&quot; and assess later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Quick Setup</Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3">Assessment levels:</h4>
          <div className="space-y-3">
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${option.color}`} />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssessmentStep = (item: CurriculumSample) => (
    <div className="space-y-6">
      <div className="text-center">
        <Badge variant="outline" className="mb-4">
          {item.subject} • {item.gradeLevel}
        </Badge>
        <h3 className="text-xl font-bold mb-2">{item.unitTitle}</h3>
        <p className="text-muted-foreground">{item.courseTitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About this concept:</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{item.description}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          How well does your student understand this concept?
        </Label>
        
        <RadioGroup
          value={progress[item.id] || ''}
          onValueChange={(value) => handleStatusChange(item.id, value)}
        >
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex items-center gap-3 cursor-pointer flex-1">
                  <Icon className={`h-5 w-5 ${option.color}`} />
                  <div>
                    <span className="font-medium">{option.label}</span>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );

  const isLastStep = currentStep === totalSteps - 1;
  const canProceed = currentStep === 0 || (curriculum[currentStep - 1] && progress[curriculum[currentStep - 1].id]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Progress Assessment</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 0 
              ? renderIntroStep()
              : renderAssessmentStep(curriculum[currentStep - 1])
            }
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

                         <div className="flex gap-2">
               {currentStep === 0 ? (
                 // On intro step, navigation is handled by the cards
                 <div className="text-sm text-muted-foreground">
                   Choose an option above to continue
                 </div>
               ) : isLastStep ? (
                 <Button onClick={handleComplete} className="flex items-center gap-2">
                   Complete & Continue
                 </Button>
               ) : (
                 <Button
                   onClick={handleNext}
                   disabled={!canProceed}
                   className="flex items-center gap-2"
                 >
                   Next
                   <ChevronRight className="h-4 w-4" />
                 </Button>
               )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 