'use client';

import { useState, useTransition } from 'react';
import LearningPlanGenerator from '@/components/learning-plans/LearningPlanGenerator';
import LearningPlanView from '@/components/learning-plans/LearningPlanView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Trash2 } from 'lucide-react';
import { deleteLearningPlanAction } from '../actions';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface LearningPlan {
  id: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  unitIds: string[];
  createdAt: Date;
  studentId: string;
  studentName?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface CurriculumNode {
  id: string;
  unitTitle: string;
  courseTitle: string;
  subject: string;
  gradeLevel: string;
}

// Interface for the LearningPlanView component (expects string dates)
interface LearningPlanViewData {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  unitIds: string[];
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface LearningPlansClientProps {
  initialStudents: Student[];
  initialPlans: LearningPlan[];
  curriculumNodes: CurriculumNode[];
}

export function LearningPlansClient({ initialStudents, initialPlans, curriculumNodes }: LearningPlansClientProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [isPending, startTransition] = useTransition();

  const handlePlanGenerated = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  const handleDeletePlan = (planId: string, studentId: string) => {
    startTransition(async () => {
      try {
        await deleteLearningPlanAction(planId, studentId);
        setPlans(prev => prev.filter(plan => plan.id !== planId));
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    });
  };

  // Convert dates to strings for the LearningPlanView component
  const convertPlanForView = (plan: LearningPlan): LearningPlanViewData => ({
    id: plan.id,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    isActive: plan.isActive,
    unitIds: plan.unitIds,
    student: plan.student,
  });

  // Get curriculum nodes for a specific plan
  const getCurriculumNodesForPlan = (plan: LearningPlan): CurriculumNode[] => {
    return curriculumNodes.filter(node => plan.unitIds.includes(node.id))
      .sort((a, b) => plan.unitIds.indexOf(a.id) - plan.unitIds.indexOf(b.id)); // Maintain original order
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Learning Plans</h1>
        <p className="text-muted-foreground">
          Create personalized 1-year learning plans for your children using AI-powered curriculum planning
        </p>
      </div>

      {/* Generator */}
      {initialStudents.length > 0 ? (
        <LearningPlanGenerator students={initialStudents} onPlanGenerated={handlePlanGenerated} />
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No students found. You need to add a student first.</p>
            <a
              href="/students"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Students Page
            </a>
          </CardContent>
        </Card>
      )}

      {/* Existing Plans */}
      {plans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Your Learning Plans</h2>
          
          <div className="grid gap-6">
            {plans.map((plan: LearningPlan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Learning Plan for {plan.studentName}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {plan.unitIds?.length || 0} units
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id, plan.studentId)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <LearningPlanView 
                    plan={convertPlanForView(plan)} 
                    curriculumNodes={getCurriculumNodesForPlan(plan)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 