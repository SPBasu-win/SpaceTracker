import { Request, Response } from 'express';
import { aiService } from '../services/ai.service.js';
import { chatMemory } from '../services/chat-memory.js';
import { randomUUID } from 'crypto';

export async function chat(req: Request, res: Response) {
  try {
    const { message } = req.body;
    let { sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!sessionId) {
      sessionId = randomUUID();
    }

    const response = await aiService.chat(sessionId, message);
    return res.json(response);

  } catch (error: any) {
    if (error.status === 429) {
      return res.status(429).json({ error: error.message, retryAfter: error.retryAfter || 30 });
    }
    if (error.message?.includes('Message too long') || error.message?.includes('Session limit reached')) {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('AI Chat Error:', error);
    return res.status(500).json({ 
      error: 'AI is temporarily unavailable', 
      fallback: true 
    });
  }
}

export async function clearSession(req: Request, res: Response) {
  const { sessionId } = req.params;
  if (sessionId) {
    chatMemory.deleteSession(sessionId as string);
  }
  return res.json({ success: true });
}

export async function getHealth(req: Request, res: Response) {
  return res.json(aiService.getHealth());
}
