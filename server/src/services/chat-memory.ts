import { ChatMessage } from '../ai/types.js';

interface SessionData {
  messages: ChatMessage[];
  turnCount: number;
  lastAccessed: Date;
}

export class ChatMemoryService {
  private sessions = new Map<string, SessionData>();
  private readonly MAX_TURNS = 25;
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Cleanup stale sessions every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  getHistory(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    session.lastAccessed = new Date();
    return session.messages;
  }

  addMessage(sessionId: string, message: ChatMessage): void {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = { messages: [], turnCount: 0, lastAccessed: new Date() };
      this.sessions.set(sessionId, session);
    }

    session.messages.push(message);
    session.lastAccessed = new Date();

    if (message.role === 'user') {
      session.turnCount++;
    }
  }

  getTurnCount(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session ? session.turnCount : 0;
  }

  isSessionExpired(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Check turn limit
    if (session.turnCount >= this.MAX_TURNS) return true;

    // Check TTL
    if (Date.now() - session.lastAccessed.getTime() > this.TTL_MS) {
      this.sessions.delete(sessionId);
      return true;
    }

    return false;
  }

  getTurnsRemaining(sessionId: string): number {
    return Math.max(0, this.MAX_TURNS - this.getTurnCount(sessionId));
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessed.getTime() > this.TTL_MS) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export const chatMemory = new ChatMemoryService();
