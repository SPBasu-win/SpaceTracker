import { aiService } from '../services/ai.service.js';
import { chatMemory } from '../services/chat-memory.js';
import { randomUUID } from 'crypto';
export async function chat(req, res) {
    try {
        const { message, latitude, longitude, locationName, context } = req.body;
        let { sessionId } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required and must be a string' });
        }
        if (!sessionId) {
            sessionId = randomUUID();
        }
        const location = latitude && longitude ? { latitude, longitude, locationName } : undefined;
        const extraContext = typeof context === 'string' && context.trim() ? context.slice(0, 1500) : undefined;
        const response = await aiService.chat(sessionId, message, location, extraContext);
        return res.json(response);
    }
    catch (error) {
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
export async function clearSession(req, res) {
    const { sessionId } = req.params;
    if (sessionId) {
        chatMemory.deleteSession(sessionId);
    }
    return res.json({ success: true });
}
export async function getHealth(req, res) {
    return res.json(aiService.getHealth());
}
export async function geocode(req, res) {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required and must be a string' });
        }
        let data;
        const headers = { 'User-Agent': 'SpaceTrackerAI/1.0' };
        try {
            const axiosModule = await import('axios');
            const axios = axiosModule.default || axiosModule;
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { q: query, format: 'json', limit: 1 },
                headers
            });
            data = response.data;
        }
        catch (importError) {
            if (importError.code === 'ERR_MODULE_NOT_FOUND' || importError.message?.includes('Cannot find module')) {
                const url = new URL('https://nominatim.openstreetmap.org/search');
                url.searchParams.append('q', query);
                url.searchParams.append('format', 'json');
                url.searchParams.append('limit', '1');
                const response = await fetch(url.toString(), { headers });
                data = await response.json();
            }
            else {
                throw importError;
            }
        }
        if (data && data.length > 0) {
            const result = data[0];
            return res.json({
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                displayName: result.display_name
            });
        }
        return res.status(404).json({ error: 'Location not found' });
    }
    catch (error) {
        console.error('Geocode Error:', error);
        return res.status(500).json({ error: 'Failed to geocode location' });
    }
}
