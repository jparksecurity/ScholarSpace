'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
// import { Input } from '@/components/ui/input'; // No longer needed
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface LearningPlanGeneratorProps {
  students: Student[];
  onPlanGenerated: () => void;
}

export default function LearningPlanGenerator({ students, onPlanGenerated }: LearningPlanGeneratorProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [preferences, setPreferences] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/learning-plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          preferences: preferences.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate learning plan');
      }

      setSuccess('Successfully generated learning plan!');
      setPreferences('');
      onPlanGenerated();
      
    } catch (error) {
      console.error('Error generating plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate learning plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generate AI Learning Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Selection */}
        <div className="space-y-2">
          <Label htmlFor="student-select">Student</Label>
          <select
            id="student-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full p-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">Select a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <Label htmlFor="preferences">
            Learning Goals & Preferences 
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="preferences"
            placeholder="Describe any specific learning goals, pace preferences, focus areas, or other preferences for this student's learning plan..."
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            rows={4}
          />
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !selectedStudentId}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Learning Plan...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate 1-Year Learning Plan
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1 text-xs">
            <li>• AI analyzes your student&apos;s current progress and generates a personalized 1-year plan</li>
            <li>• Plan includes an ordered list of curriculum units across all subjects</li>
            <li>• Respects prerequisite relationships and builds foundational knowledge</li>
            <li>• Considers your preferences for pace, focus areas, and learning goals</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 