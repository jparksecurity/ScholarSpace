import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { PrismaClient } from '@/lib/generated/prisma';
import { 
  getSubjectProgressSummary, 
  getCurriculumContext,
  createComprehensiveSubjectPath,
  getUniqueSubjects,
  getNodeById,
  getNextNode
} from '@/lib/curriculum';

const prisma = new PrismaClient();

// Schema for AI to select end goals for each subject
const SubjectGoalsSchema = z.object({
  math: z.object({
    endNodeId: z.string(),
    reasoning: z.string()
  }),
  ela: z.object({
    endNodeId: z.string(),
    reasoning: z.string()
  }),
  science: z.object({
    endNodeId: z.string(),
    reasoning: z.string()
  }),
  humanities: z.object({
    endNodeId: z.string(),
    reasoning: z.string()
  })
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

    // Get comprehensive curriculum context
    const curriculumContext = getCurriculumContext(student.progressLog || []);
    const progressSummary = getSubjectProgressSummary(student.progressLog || []);
    
    // Build progress context for AI
    const currentProgress = Object.entries(progressSummary).map(([, data]) => ({
      subject: data.subject,
      currentNodeId: data.currentNodeId,
      completedCount: data.completedCount,
      progressPercentage: data.progressPercentage,
      startingPoints: curriculumContext.startingPointsBySubject[data.subject.toLowerCase()] || [],
      possibleEndNodes: curriculumContext.possibleEndNodesBySubject[data.subject.toLowerCase()] || []
    }));

    // STEP 1: Ask AI to select end goals for each subject
    const goalSelectionPrompt = `You are an expert educational curriculum planner. Based on the student's current progress and parent preferences, select appropriate END GOALS for each subject for a 1-year learning plan.

STUDENT CONTEXT:
- Name: ${student.firstName} ${student.lastName}
- Age: ${age || 'Unknown'}

PARENT PREFERENCES:
${preferences || 'No specific preferences provided'}

CURRENT PROGRESS:
${JSON.stringify(currentProgress, null, 2)}

AVAILABLE END NODES BY SUBJECT:
${JSON.stringify(Object.fromEntries(
  Object.entries(curriculumContext.possibleEndNodesBySubject).map(([subject, nodes]) => [
    subject,
    nodes.map(node => ({
      id: node.id,
      unitTitle: node.unit_title,
      courseTitle: node.course_title,
      gradeLevel: node.grade_level
    }))
  ])
), null, 2)}

INSTRUCTIONS:
1. You MUST select ONE appropriate end node for EACH of the four subjects: math, ela, science, and humanities
2. Consider the student's current progress and age/grade level for each subject
3. Choose challenging but achievable goals for each subject
4. Each end node should be reachable from the student's current starting points
5. Provide reasoning for each choice
6. Do not skip any subjects - all four must have goals

Return an object with math, ela, science, and humanities as keys, each containing endNodeId and reasoning.`;

    const goalResult = await generateObject({
      model: openai('o4-mini'),
      schema: SubjectGoalsSchema,
      prompt: goalSelectionPrompt,
    });

    const selectedGoals = goalResult.object;

    // STEP 2: Create ordered paths for each subject
    const subjects = getUniqueSubjects();
    const allOrderedUnits: string[] = [];
    const subjectDebugInfo: Array<{
      subject: string;
      goal: string;
      startingPoints: number;
      pathUnits: number;
      hasPath: boolean;
    }> = [];
    
    for (const subject of subjects) {
      const goal = selectedGoals[subject as keyof typeof selectedGoals];
      const startingPoints = curriculumContext.startingPointsBySubject[subject] || [];
      const completedNodes = curriculumContext.completedNodesBySubject[subject] || [];
      
      let subjectUnits: string[] = [];
      
      if (goal && goal.endNodeId) {
        // Create a comprehensive path using all starting points
        if (startingPoints.length > 0) {
          const comprehensivePath = createComprehensiveSubjectPath(
            subject, 
            startingPoints, 
            goal.endNodeId, 
            completedNodes
          );
          subjectUnits = [...subjectUnits, ...comprehensivePath];
        } else {
          // If no starting points, try to find a logical start
          const subjectStartNodes = curriculumContext.edges
            .filter(edge => edge.from === 'START' && edge.relationship_type === 'system')
            .map(edge => edge.to)
            .filter(nodeId => {
              const node = getNodeById(nodeId);
              return node && node.subject === subject;
            });
          
          if (subjectStartNodes.length > 0) {
            const comprehensivePath = createComprehensiveSubjectPath(
              subject, 
              subjectStartNodes, 
              goal.endNodeId, 
              completedNodes
            );
            subjectUnits = [...subjectUnits, ...comprehensivePath];
          }
        }
      } else {
        // No goal selected for this subject - add some starter units
        console.log(`No goal selected for ${subject}, adding starter units`);
        const subjectStartNodes = curriculumContext.edges
          .filter(edge => edge.from === 'START' && edge.relationship_type === 'system')
          .map(edge => edge.to)
          .filter(nodeId => {
            const node = getNodeById(nodeId);
            return node && node.subject === subject;
          });
        
        // Add first few units of the subject
        if (subjectStartNodes.length > 0) {
          const startNode = subjectStartNodes[0];
          let currentNodeId = startNode;
          let unitsAdded = 0;
          const maxStarterUnits = 5; // Add first 5 units if no goal
          const starterUnits: string[] = [];
          
          while (currentNodeId && unitsAdded < maxStarterUnits) {
            if (!completedNodes.includes(currentNodeId)) {
              starterUnits.push(currentNodeId);
              unitsAdded++;
            }
            const nextNode = getNextNode(currentNodeId);
            currentNodeId = nextNode?.id || '';
          }
          
          subjectUnits = [...subjectUnits, ...starterUnits];
        }
      }
      
      // Remove duplicates for this subject and add to overall list
      const uniqueSubjectUnits = [...new Set(subjectUnits)];
      allOrderedUnits.push(...uniqueSubjectUnits);
      
      subjectDebugInfo.push({
        subject,
        goal: goal?.endNodeId || 'none',
        startingPoints: startingPoints.length,
        pathUnits: uniqueSubjectUnits.length,
        hasPath: uniqueSubjectUnits.length > 0
      });
    }

    // Remove duplicates while preserving order
    const uniqueOrderedUnits = [...new Set(allOrderedUnits)];

    // Validate that all unitIds exist in the curriculum
    const validUnitIds = uniqueOrderedUnits.filter(id => getNodeById(id));
    
    if (validUnitIds.length === 0) {
      return NextResponse.json({ 
        error: 'No valid curriculum units found in generated plan',
        debug: {
          selectedGoals,
          curriculumContext: {
            ...curriculumContext,
            availableNodes: curriculumContext.availableNodes.length,
            edges: curriculumContext.edges.length
          }
        }
      }, { status: 400 });
    }

    // Limit to reasonable size for one year (30-60 units)
    const finalUnitIds = validUnitIds.slice(0, 50);

    // Save the learning plan to database
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    const learningPlan = await prisma.learningPlan.create({
      data: {
        studentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        unitIds: finalUnitIds,
      }
    });

    return NextResponse.json({
      success: true,
      plan: learningPlan,
      selectedGoals,
      debug: {
        totalUnitsBeforeDedup: allOrderedUnits.length,
        totalUnitsAfterDedup: uniqueOrderedUnits.length,
        finalUnitCount: finalUnitIds.length,
        goalSelection: selectedGoals,
        subjectPaths: subjectDebugInfo,
        curriculumContext: {
          completedNodesBySubject: Object.fromEntries(
            Object.entries(curriculumContext.completedNodesBySubject).map(([k, v]) => [k, v.length])
          ),
          startingPointsBySubject: Object.fromEntries(
            Object.entries(curriculumContext.startingPointsBySubject).map(([k, v]) => [k, v.length])
          ),
          possibleEndNodesBySubject: Object.fromEntries(
            Object.entries(curriculumContext.possibleEndNodesBySubject).map(([k, v]) => [k, v.length])
          )
        }
      }
    });

  } catch (error) {
    console.error('Error generating learning plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning plan' },
      { status: 500 }
    );
  }
}