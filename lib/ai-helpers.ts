import { mem0Client } from './mem0';

export async function storeAIInteraction({
  userId,
  prompt,
  response,
  metadata = {}
}: {
  userId: string;
  prompt: string;
  response: string;
  metadata?: Record<string, any>;
}) {
  try {
    await mem0Client.addMemory({
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: response }
      ],
      userId,
      metadata: {
        type: 'ai_interaction',
        timestamp: new Date().toISOString(),
        ...metadata
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to store AI interaction in Mem0:', error);
    return false;
  }
}