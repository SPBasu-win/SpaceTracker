export class ChatMemoryService {
    sessions = new Map();
    MAX_TURNS = 25;
    TTL_MS = 30 * 60 * 1000; // 30 minutes
    constructor() {
        // Cleanup stale sessions every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    getHistory(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return [];
        session.lastAccessed = new Date();
        return session.messages;
    }
    addMessage(sessionId, message) {
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
    getTurnCount(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.turnCount : 0;
    }
    isSessionExpired(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        // Check turn limit
        if (session.turnCount >= this.MAX_TURNS)
            return true;
        // Check TTL
        if (Date.now() - session.lastAccessed.getTime() > this.TTL_MS) {
            this.sessions.delete(sessionId);
            return true;
        }
        return false;
    }
    getTurnsRemaining(sessionId) {
        return Math.max(0, this.MAX_TURNS - this.getTurnCount(sessionId));
    }
    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    cleanup() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastAccessed.getTime() > this.TTL_MS) {
                this.sessions.delete(sessionId);
            }
        }
    }
}
export const chatMemory = new ChatMemoryService();
