import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { PrismaClient } from '@/lib/generated/prisma';
import curriculumData from '@/curriculum_prerequisite_network.json';

const prisma = new PrismaClient();

// Simplified schema for the generated learning plan - just a list of units
const LearningPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  unitIds: z.array(z.string()), // Just the curriculum node IDs
  estimatedHours: z.number() // Total estimated hours for the year
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
        progress: {
          include: {
            curriculumNode: true
          }
        },
        subjectProgress: {
          include: {
            currentNode: true
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

    // Build context about student's current progress
    const completedNodes = student.progress
      .filter(p => p.status === 'COMPLETED')
      .map(p => p.curriculumNode.id);

    const currentProgress = student.subjectProgress.map(sp => ({
      subject: sp.subject,
      currentNodeId: sp.currentNode?.id
    }));

    // Create simplified system prompt
    const systemPrompt = `You are an expert educational curriculum planner. Create a simple 1-year learning plan for a student.

    CURRICULUM CONTEXT:
    - You have access to Khan Academy's K-12 curriculum with prerequisite relationships
    - Each node represents a unit with specific learning objectives
    - Units must follow prerequisite paths
    
    STUDENT CONTEXT:
    - Name: ${student.firstName} ${student.lastName}
    - Age: ${age || 'Unknown'}
    - Completed Units: ${completedNodes.length} units already completed
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
    3. Don't include units the student has already completed
    4. Include all subjects: math, science, ELA, humanities
    5. Order them in a logical learning progression
    6. Include 30-50 units total (reasonable for one year)
    7. Estimate total hours for the entire plan
    
    IMPORTANT: Only include curriculum node IDs that exist in the provided curriculum data.`;

    const userPrompt = `Create a simple 1-year learning plan with:
    1. A descriptive title
    2. A brief description of the plan's goals
    3. An ordered list of curriculum node IDs to complete
    4. Total estimated hours for the year
    
    Parent preferences: "${preferences}"
    
    Focus on logical progression and balanced subject coverage.`;

    // Generate the learning plan using AI
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
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
        title: generatedPlan.title,
        description: generatedPlan.description,
        preferences: JSON.stringify(preferences),
        unitIds: validUnitIds,
        estimatedHours: generatedPlan.estimatedHours,
        startDate,
        endDate,
        aiModel: 'gpt-4o-mini'
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