'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStudents, StudentWithRelations, CreateStudentData, UpdateStudentData } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface StudentFormProps {
  student?: StudentWithRelations | null;
  onboardingData?: any;
  onClose: () => void;
}

const SUBJECTS = [
  'Mathematics',
  'English Language Arts',
  'Science',
  'Social Studies',
  'Art',
  'Music',
  'Physical Education',
  'Computer Science',
  'Foreign Language',
];

const GRADE_LEVELS = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

export function StudentForm({ student, onboardingData, onClose }: StudentFormProps) {
  const { createStudent, updateStudent } = useStudents();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gradeLevel: '',
    avatar: '',
    bio: '',
    subjects: [] as string[],
  });

  useEffect(() => {
    if (student && student.id) {
      // Only populate form data if this is an existing student
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth 
          ? new Date(student.dateOfBirth).toISOString().split('T')[0]
          : '',
        gradeLevel: student.gradeLevel,
        avatar: student.avatar || '',
        bio: student.bio || '',
        subjects: student.enrollments?.map(e => e.subject) || [],
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: CreateStudentData | UpdateStudentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        gradeLevel: formData.gradeLevel,
        avatar: formData.avatar || undefined,
        bio: formData.bio || undefined,
        subjects: formData.subjects,
        // Include onboarding progress data for new students
        ...(onboardingData && !student ? { 
          currentProgress: onboardingData.currentProgress 
        } : {}),
      };

      if (student) {
        await updateStudent(student.id, data);
      } else {
        await createStudent(data as CreateStudentData);
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

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject),
    }));
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
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select
                value={formData.gradeLevel}
                onValueChange={(value) => handleInputChange('gradeLevel', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about your student's interests, goals, or learning style..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Subjects</Label>
            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject}
                    checked={formData.subjects.includes(subject)}
                    onCheckedChange={(checked) => 
                      handleSubjectChange(subject, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={subject}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {subject}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 