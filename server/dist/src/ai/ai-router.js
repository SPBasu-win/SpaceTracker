import { OpenAIProvider } from './providers/openai.provider.js';
import { AnthropicProvider } from './providers/anthropic.provider.js';
import { GoogleProvider } from './providers/google.provider.js';
import { GroqProvider } from './providers/groq.provider.js';
import { OpenRouterProvider } from './providers/openrouter.provider.js';
export class AIRouter {
    providers = [];
    activeProviderIndex = 0;
    constructor() {
        this.initializeProviders();
    }
    initializeProviders() {
        const priorityString = process.env.AI_PROVIDER_PRIORITY || 'anthropic,openai,google,groq,openrouter';
        const priorities = priorityString.split(',').map(p => p.trim().toLowerCase());
        for (const p of priorities) {
            try {
                if (p === 'openai' && process.env.OPENAI_API_KEY) {
                    this.providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL));
                }
                else if (p === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
                    this.providers.push(new AnthropicProvider(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL));
                }
                else if (p === 'google' && process.env.GOOGLE_AI_API_KEY) {
                    this.providers.push(new GoogleProvider(process.env.GOOGLE_AI_API_KEY, process.env.GOOGLE_MODEL));
                }
                else if (p === 'groq' && process.env.GROQ_API_KEY) {
                    this.providers.push(new GroqProvider(process.env.GROQ_API_KEY, process.env.GROQ_MODEL));
                }
                else if (p === 'openrouter' && process.env.OPENROUTER_API_KEY) {
                    this.providers.push(new OpenRouterProvider(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_MODEL));
                }
            }
            catch (err) {
                console.error(`Failed to initialize provider ${p}:`, err);
            }
        }
        if (this.providers.length === 0) {
            console.warn('No AI providers configured. AI features will be disabled.');
        }
        else {
            console.log(`Initialized AI Router with providers: ${this.providers.map(p => p.providerName()).join(', ')}`);
        }
    }
    getActiveProvider() {
        if (this.providers.length === 0)
            return null;
        return this.providers[this.activeProviderIndex];
    }
    async chat(messages, tools, options) {
        if (this.providers.length === 0) {
            throw new Error('No AI providers configured.');
        }
        const startIndex = this.activeProviderIndex;
        let attempts = 0;
        let lastError = null;
        while (attempts < this.providers.length) {
            const provider = this.providers[this.activeProviderIndex];
            try {
                const response = await provider.chat(messages, tools, options);
                return response;
            }
            catch (error) {
                console.error(`[AIRouter] Provider ${provider.providerName()} failed:`, error.message || error);
                lastError = error;
                // Rotate to next provider
                this.activeProviderIndex = (this.activeProviderIndex + 1) % this.providers.length;
                attempts++;
                if (attempts < this.providers.length) {
                    console.log(`[AIRouter] Switching to next provider: ${this.providers[this.activeProviderIndex].providerName()}`);
                }
            }
        }
        throw lastError || new Error('All AI providers failed.');
    }
}
