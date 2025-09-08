// Background service worker for ChatterBox
import { GenerateReplyRequest, GenerateReplyResponse } from './types';
import { loadDefaultSystemPrompt } from './utils/promptLoader';

interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
    typingSpeed: number;
    casualReplies: boolean;
}

interface ApiProvider {
    type: 'openai' | 'openrouter';
    apiKey: string;
}

interface ModelInfo {
    requiresMaxCompletionTokens: boolean;
    supportsReasoning: boolean;
    provider: string;
    supportsTemperature: boolean;
    supportsPenalties: boolean;
}

const DEFAULT_SETTINGS: AdvancedSettings = {
    temperature: 0.5,
    maxTokens: 50,
    presencePenalty: 0.6,
    frequencyPenalty: 0.3,
    typingSpeed: 5,
    casualReplies: false
};

// Extended model configuration for OpenRouter compatibility
const MODEL_CONFIG: { [key: string]: ModelInfo } = {
    // OpenRouter models - all use max_tokens as OpenRouter normalizes parameters
    'openai/gpt-5': { requiresMaxCompletionTokens: false, supportsReasoning: true, provider: 'openrouter', supportsTemperature: false, supportsPenalties: false },
    'openai/gpt-4.1': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: true },
    'openai/gpt-4o': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: true },
    'openai/gpt-4o-mini': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: true },
    'openai/gpt-4-turbo': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: true },
    'openai/gpt-3.5-turbo': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: true },
    'anthropic/claude-3.5-sonnet': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: false },
    'anthropic/claude-3-haiku': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: false },
    'google/gemini-pro': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: false },
    'meta-llama/llama-3.1-405b': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: true },
    'meta-llama/llama-3.1-70b': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: true },
    'mistralai/mixtral-8x7b': { requiresMaxCompletionTokens: false, supportsReasoning: false, provider: 'openrouter', supportsTemperature: true, supportsPenalties: false }
};

class BackgroundService {
    private defaultSystemPrompt: string = 'Loading...';

    constructor() {
        this.init();
    }

    private async init() {
        try {
            // Load the default prompt
            this.defaultSystemPrompt = await loadDefaultSystemPrompt();
            this.setupMessageListener();
        } catch (error) {
            console.error('ChatterBox: Failed to initialize background service:', error);
        }
    }

    private setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'generateReply') {
                // Handle the request asynchronously
                this.handleGenerateReply(request.data, sendResponse)
                    .catch(error => {
                        console.error('Error in handleGenerateReply:', error);
                        sendResponse({
                            reply: '',
                            error: error instanceof Error ? error.message : 'Unknown error occurred'
                        });
                    });
                return true; // Will respond asynchronously
            }
            return false;
        });
    }

    private async handleGenerateReply(
        request: GenerateReplyRequest,
        sendResponse: (response: GenerateReplyResponse) => void
    ) {
        try {
            // Get settings from storage
            const { 
                openrouterApiKey, 
                model, 
                systemPrompt, 
                advancedSettings 
            } = await chrome.storage.sync.get([
                'openrouterApiKey', 
                'model', 
                'systemPrompt', 
                'advancedSettings'
            ]);

            const selectedModel = model || 'openai/gpt-4.1';
            
            // Validate OpenRouter API key
            if (!openrouterApiKey) {
                sendResponse({
                    reply: '',
                    error: 'OpenRouter API key not configured. Please set it in the extension popup.'
                });
                return;
            }

            // Validate model selection
            if (!selectedModel) {
                sendResponse({
                    reply: '',
                    error: 'No model selected. Please choose a model from the extension popup.'
                });
                return;
            }

            console.log('ChatterBox: Using model:', selectedModel);

            // Generate the reply using OpenRouter
            const reply = await this.callLLMAPI(
                openrouterApiKey,
                'openrouter',
                selectedModel,
                systemPrompt || this.defaultSystemPrompt,
                advancedSettings || DEFAULT_SETTINGS,
                request
            );

            sendResponse({ reply });
        } catch (error) {
            console.error('Error generating reply:', error);
            sendResponse({
                reply: '',
                error: error instanceof Error ? error.message : 'Failed to generate reply'
            });
        }
    }

    private async callLLMAPI(
        apiKey: string,
        provider: string,
        model: string,
        systemPrompt: string,
        settings: AdvancedSettings,
        request: GenerateReplyRequest
    ): Promise<string> {
        const { tweetContent, template } = request;

        const finalSystemPrompt = `${systemPrompt} ${template.prompt}`;

        if (tweetContent) {
            var userPrompt = `Generate a reply to this post: "${tweetContent}"`;
        } else {
            var userPrompt = `Create a post"`;
        }

        // Determine API endpoint and headers based on provider
        let apiEndpoint: string;
        let headers: { [key: string]: string };

        if (provider === 'openrouter') {
            apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://github.com/your-username/chatterbox', // Optional
                'X-Title': 'ChatterBox Extension' // Optional
            };
        } else {
            // Default to OpenAI
            apiEndpoint = 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        }

        // Get model configuration with fallback
        const modelInfo = MODEL_CONFIG[model] || { 
            requiresMaxCompletionTokens: false, 
            supportsReasoning: false, 
            provider: 'openrouter',
            supportsTemperature: true,
            supportsPenalties: true
        };

        // Build request body with core parameters
        const requestBody: any = {
            model: model,
            messages: [
                { role: 'system', content: finalSystemPrompt },
                { role: 'user', content: userPrompt }
            ]
        };

        // Add temperature if supported
        if (modelInfo.supportsTemperature) {
            requestBody.temperature = settings.temperature;
        }

        // Add penalty parameters if supported
        if (modelInfo.supportsPenalties) {
            requestBody.presence_penalty = settings.presencePenalty;
            requestBody.frequency_penalty = settings.frequencyPenalty;
        }

        // Use appropriate token limit parameter
        if (modelInfo.requiresMaxCompletionTokens && provider === 'openai') {
            requestBody.max_completion_tokens = settings.maxTokens;
        } else {
            requestBody.max_tokens = settings.maxTokens;
        }

        console.log('ChatterBox: Making API request with body:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
                const providerName = provider === 'openrouter' ? 'OpenRouter' : 'OpenAI';
                
                // Log detailed error for debugging
                console.error('ChatterBox API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    model: model,
                    error: error
                });
                
                // Check for specific model ID errors
                if (error.error?.message?.includes('invalid model ID')) {
                    throw new Error(`Model '${model}' is not valid for OpenRouter. Please check available models or contact support.`);
                }
                
                throw new Error(error.error?.message || `${providerName} API request failed (${response.status})`);
            }

            const data = await response.json();
            let replyContent = data.choices?.[0]?.message?.content?.trim();

            if (!replyContent) {
                throw new Error('No reply content generated');
            }

            return this.formatReplyContent(replyContent, settings);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            const providerName = provider === 'openrouter' ? 'OpenRouter' : 'OpenAI';
            throw new Error(`Failed to call ${providerName} API`);
        }
    }

    private formatReplyContent(content: string, settings: AdvancedSettings): string {
        let formattedContent = content;

        // Only apply casual formatting if the toggle is enabled
        if (settings.casualReplies) {
            // Remove surrounding quotes if they exist
            if (formattedContent.startsWith('"') && formattedContent.endsWith('"')) {
                formattedContent = formattedContent.slice(1, -1);
            }

            // Remove trailing period if it exists
            if (formattedContent.endsWith('.')) {
                formattedContent = formattedContent.slice(0, -1);
            }

            // Add more formatting rules here as needed
            // Example future rules:
            // - Convert to lowercase
            // - Remove multiple spaces
            // - Trim hashtags
            // - Remove emojis
            // - Character count validation
        }

        return formattedContent;
    }
}

// Initialize the service worker
new BackgroundService();