'use client';

import { useState, useEffect, useCallback } from 'react';
import LearningPlanGenerator from '@/components/learning-plans/LearningPlanGenerator';
import LearningPlanView from '@/components/learning-plans/LearningPlanView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, BookOpen, Trash2 } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface LearningPlan {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  unitIds: string[];
  createdAt: string;
  studentId: string;
  studentName?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function LearningPlansPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        // Extract students from the response object
        const studentsList = data.students || [];
        setStudents(studentsList);
        // Load plans for all students
        if (studentsList && studentsList.length > 0) {
          await loadPlansForAllStudents(studentsList);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadPlansForAllStudents = async (studentsList: Student[]) => {
    try {
      const allPlans: LearningPlan[] = [];
      
      for (const student of studentsList) {
        const response = await fetch(`/api/learning-plans/${student.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.plans) {
            // Add student info to each plan for display
            const studentPlans = data.plans.map((plan: LearningPlan) => ({
              ...plan,
              studentName: `${student.firstName} ${student.lastName}`,
              studentId: student.id
            }));
            allPlans.push(...studentPlans);
          }
        }
      }
      
      setPlans(allPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handlePlanGenerated = () => {
    // Refresh plans when a new one is generated
    loadStudents();
  };

  const handleDeletePlan = async (planId: string, studentId: string) => {
    try {
      const response = await fetch(`/api/learning-plans/${studentId}?planId=${planId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPlans(prev => prev.filter(plan => plan.id !== planId));
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Learning Plans</h1>
        <p className="text-muted-foreground">
          Create personalized 1-year learning plans for your children using AI-powered curriculum planning
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generator */}
      {students.length > 0 ? (
        <LearningPlanGenerator students={students} onPlanGenerated={handlePlanGenerated} />
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <LearningPlanView plan={plan} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 