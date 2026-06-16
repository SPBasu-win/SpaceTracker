export class BaseProvider {
    apiKey;
    defaultModel;
    cooldownUntil = 0;
    constructor(apiKey, defaultModel) {
        this.apiKey = apiKey;
        this.defaultModel = defaultModel;
    }
    /**
     * Check if this provider supports native web search
     */
    supportsNativeWebSearch() {
        return false;
    }
    /**
     * Get the current model ID
     */
    modelId() {
        return this.defaultModel;
    }
}
