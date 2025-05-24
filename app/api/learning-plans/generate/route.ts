import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { PrismaClient } from '@/lib/generated/prisma';
import curriculumData from '@/curriculum_prerequisite_network.json';
import { getSubjectProgressSummary } from '@/lib/curriculum';

const prisma = new PrismaClient();

const LearningPlanSchema = z.object({
  unitIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const { studentId, preferences } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student information and current progress
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        progressLog: {
          include: {
            node: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Calculate student's age for grade level context
    const age = student.dateOfBirth 
      ? Math.floor((Date.now() - student.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // Build context about student's current progress using ProgressLog
    const progressSummary = getSubjectProgressSummary(student.progressLog || []);
    const currentProgress = Object.entries(progressSummary).map(([, data]: [string, {
      subject: string;
      subjectName: string;
      completedCount: number;
      totalCount: number;
      progressPercentage: number;
      currentNodeId: string | null;
      latestActivity: Date | null;
    }]) => ({
      subject: data.subject,
      currentNodeId: data.currentNodeId,
      completedCount: data.completedCount,
      progressPercentage: data.progressPercentage
    }));

    // Create simplified system prompt
    const systemPrompt = `You are an expert educational curriculum planner. Create a simple 1-year learning plan for a student.

    CURRICULUM CONTEXT:
    - You have access to Khan Academy's K-12 curriculum with prerequisite relationships
    - Each node represents a unit with specific learning objectives
    - Units must follow prerequisite paths
    
    STUDENT CONTEXT:
    - Name: ${student.firstName} ${student.lastName}
    - Age: ${age}
    - Current Progress: ${JSON.stringify(currentProgress)}
    
    PARENT PREFERENCES:
    ${preferences || 'No specific preferences provided'}
    
    AVAILABLE CURRICULUM NODES:
    ${JSON.stringify(curriculumData.nodes.map(node => ({
      id: node.id,
      unitTitle: node.unit_title,
      courseTitle: node.course_title,
      subject: node.subject,
      gradeLevel: node.grade_level
    })), null, 2)}
    
    PLAN REQUIREMENTS:
    1. Return a simple ordered list of curriculum node IDs for the student to complete in 1 year
    2. Respect prerequisite relationships 
    3. Include all subjects: math, science, ELA, humanities
    4. Order them in a logical learning progression
    5. Include 30-50 units total (reasonable for one year)
    
    IMPORTANT: Only include curriculum node IDs that exist in the provided curriculum data.`;

    const userPrompt = `Create a 1-year learning plan by selecting curriculum node IDs in the proper sequence.
    
    Parent preferences: "${preferences || 'No specific preferences'}"
    
    Focus on logical progression and balanced subject coverage. Return only the unitIds array.`;

    // Generate the learning plan using AI
    const result = await generateObject({
      model: openai('o4-mini'),
      schema: LearningPlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    const generatedPlan = result.object;

    // Validate that all unitIds exist in the curriculum
    const availableNodeIds = new Set(curriculumData.nodes.map(node => node.id));
    const validUnitIds = generatedPlan.unitIds.filter(id => availableNodeIds.has(id));
    
    if (validUnitIds.length === 0) {
      return NextResponse.json({ error: 'No valid curriculum units found in generated plan' }, { status: 400 });
    }

    // Save the simplified learning plan to database
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    const learningPlan = await prisma.learningPlan.create({
      data: {
        studentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        unitIds: validUnitIds, // Use validated unit IDs
      }
    });

    return NextResponse.json({
      success: true,
      plan: learningPlan
    });

  } catch (error) {
    console.error('Error generating learning plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning plan' },
      { status: 500 }
    );
  }
} 