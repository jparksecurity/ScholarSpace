import { MemoryClient } from 'mem0ai';

if (!process.env.MEM0_API_KEY) {
  throw new Error('MEM0_API_KEY is required');
}

export const mem0Client = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY,
});

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  studentId?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  studentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}