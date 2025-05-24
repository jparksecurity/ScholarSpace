import { z } from 'zod';

// Simplified learning plan that's just a list of curriculum units to complete in a year
export const LearningPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  unitIds: z.array(z.string()), // Just a flat array of curriculum node IDs
  estimatedHours: z.number().optional() // Total estimated hours for the year
});

export type LearningPlanData = z.infer<typeof LearningPlanSchema>; 