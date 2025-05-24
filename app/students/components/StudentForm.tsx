'use client';

import { useState, useEffect } from 'react';
import { StudentWithRelations } from '@/hooks/useStudents';
import { createStudentAction, updateStudentAction, CreateStudentData } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { calculateAge } from '@/lib/utils';

interface OnboardingData {
  currentProgress?: Array<{
    nodeId: string;
    status?: string;
    score?: number;
    completedAt?: string;
  }>;
}

interface StudentFormProps {
  student?: StudentWithRelations | null;
  onboardingData?: OnboardingData;
  onClose: () => void;
  onStudentCreated?: (student: StudentWithRelations) => void;
  onStudentUpdated?: (student: StudentWithRelations) => void;
}





export function StudentForm({ student, onboardingData, onClose, onStudentCreated, onStudentUpdated }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    avatar: '',
  });

  // Calculate age for display
  const currentAge = calculateAge(formData.dateOfBirth);

  useEffect(() => {
    if (student && student.id) {
      // Only populate form data if this is an existing student
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth 
          ? new Date(student.dateOfBirth).toISOString().split('T')[0]
          : '',
        avatar: student.avatar || '',
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        avatar: formData.avatar || undefined,
        // Include onboarding progress data for new students
        ...(onboardingData && !student ? { 
          currentProgress: onboardingData.currentProgress 
        } : {}),
      };

      if (student) {
        const updatedStudent = await updateStudentAction(student.id, data);
        if (updatedStudent && onStudentUpdated) {
          onStudentUpdated(updatedStudent);
        }
      } else {
        const newStudent = await createStudentAction(data as CreateStudentData);
        if (newStudent && onStudentCreated) {
          onStudentCreated(newStudent);
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student ? 'Edit Student' : 'Add Student'}
          </DialogTitle>
          <DialogDescription>
            {student 
              ? 'Update your student\'s information'
              : onboardingData 
                ? 'Complete your student\'s profile with their basic information'
                : 'Add a new student to track their learning progress'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              required
            />
          </div>
            <div className="space-y-2">
              {currentAge && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Age:</strong> {currentAge} years old
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    We use age-based learning instead of grade levels for personalized education
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              value={formData.avatar}
              onChange={(e) => handleInputChange('avatar', e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>





          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.firstName || !formData.lastName || !formData.dateOfBirth}
            >
              {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 