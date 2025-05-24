'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Calendar, BookOpen } from 'lucide-react';

interface LearningPlan {
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

interface CurriculumUnit {
  id: string;
  unitTitle: string;
  courseTitle: string;
  subject: string;
  gradeLevel: string;
  isCompleted?: boolean; // Track completion status
}

const subjectColors: Record<string, string> = {
  math: 'bg-blue-100 text-blue-800 border-blue-200',
  science: 'bg-green-100 text-green-800 border-green-200',
  ela: 'bg-purple-100 text-purple-800 border-purple-200',
  humanities: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function LearningPlanView({ plan }: { plan: LearningPlan }) {
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch curriculum unit details and completion status
  useEffect(() => {
    const loadUnits = async () => {
      try {
        // Fetch curriculum node details
        const curriculumResponse = await fetch('/api/curriculum/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeIds: plan.unitIds })
        });
        
        if (!curriculumResponse.ok) {
          throw new Error('Failed to fetch curriculum nodes');
        }
        
        const { nodes } = await curriculumResponse.json();
        
        // TODO: Fetch completion status for these units
        // For now, all units are marked as not completed
        const unitsWithProgress = nodes.map((node: CurriculumUnit) => ({
          ...node,
          isCompleted: false
        }));
        
        setUnits(unitsWithProgress);
      } catch (error) {
        console.error('Error loading units:', error);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };

    if (plan.unitIds?.length > 0) {
      loadUnits();
    } else {
      setLoading(false);
    }
  }, [plan.unitIds]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading plan details...</div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = units.filter(unit => unit.isCompleted).length;
  const progressPercentage = units.length > 0 ? (completedCount / units.length) * 100 : 0;

  // Group units by subject while preserving original order within each subject
  const unitsBySubject = units.reduce((acc, unit, originalIndex) => {
    if (!acc[unit.subject]) {
      acc[unit.subject] = [];
    }
    acc[unit.subject].push({ ...unit, originalIndex });
    return acc;
  }, {} as Record<string, (CurriculumUnit & { originalIndex: number })[]>);

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Plan Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">
                  {completedCount} of {units.length} units completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            {/* Summary Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {plan.unitIds.length} units
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units by Subject */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Learning Units</h4>
        
        {Object.entries(unitsBySubject)
          .sort(([a], [b]) => a.localeCompare(b)) // Sort subjects alphabetically
          .map(([subject, subjectUnits]) => {
            // Sort units within each subject by their original order
            const orderedSubjectUnits = subjectUnits.sort((a, b) => a.originalIndex - b.originalIndex);
            
            return (
              <Card key={subject}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={subjectColors[subject] || 'bg-gray-100'}>
                      {subject.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {orderedSubjectUnits.filter(u => u.isCompleted).length} of {orderedSubjectUnits.length} completed
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orderedSubjectUnits.map((unit) => (
                      <div 
                        key={unit.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                      >
                        <div className="mt-0.5">
                          {unit.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-medium text-sm leading-tight">
                                {unit.unitTitle}
                              </h5>
                              <p className="text-xs text-muted-foreground mt-1">
                                {unit.courseTitle} • Grade {unit.gradeLevel}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              #{unit.originalIndex + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
} 