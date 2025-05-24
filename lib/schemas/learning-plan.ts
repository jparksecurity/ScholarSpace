import { z } from 'zod';

// Simplified learning plan that's just a list of curriculum units to complete in a year
export const learningPlanSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  preferences: z.string().optional(), // JSON string of parent preferences
  startDate: z.string(), // Will be converted to Date
  endDate: z.string(), // Will be converted to Date
  aiModel: z.string(), // Which AI model was used
  unitIds: z.array(z.string()), // Array of curriculum node IDs
});

export type LearningPlanData = z.infer<typeof learningPlanSchema>; 