// Background service worker for ChatterBox
import { GenerateReplyRequest, GenerateReplyResponse } from './types';
import { loadXSystemPrompt, loadLinkedInSystemPrompt } from './utils/promptLoader';

interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
    typingSpeed: number;
}

const DEFAULT_SETTINGS: AdvancedSettings = {
    temperature: 0.5,
    maxTokens: 50,
    presencePenalty: 0.6,
    frequencyPenalty: 0.3,
    typingSpeed: 5
};

class BackgroundService {
    private defaultXSystemPrompt: string = 'Loading...';
    private defaultLinkedInSystemPrompt: string = 'Loading...';

    constructor() {
        this.init();
    }

    private async init() {
        try {
            // Load the default prompts for both platforms
            this.defaultXSystemPrompt = await loadXSystemPrompt();
            this.defaultLinkedInSystemPrompt = await loadLinkedInSystemPrompt();
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
            // Get platform-specific settings from storage
            const platform = request.platform || 'x';
            const storageKeys = platform === 'linkedin' 
                ? ['openrouterApiKey', 'model', 'linkedinSettings']
                : ['openrouterApiKey', 'model', 'xSettings'];
            
            const result = await chrome.storage.sync.get(storageKeys);
            const { openrouterApiKey, model } = result;

            if (!openrouterApiKey) {
                sendResponse({
                    reply: '',
                    error: 'OpenRouter API key not configured. Please set it in the extension popup.'
                });
                return;
            }

            // Get platform-specific settings
            let systemPrompt: string;
            let advancedSettings: AdvancedSettings;
            
            if (platform === 'linkedin') {
                const linkedinSettings = result.linkedinSettings || {};
                systemPrompt = linkedinSettings.systemPrompt || this.defaultLinkedInSystemPrompt;
                advancedSettings = linkedinSettings.advancedSettings || { ...DEFAULT_SETTINGS, maxTokens: 60 };
            } else {
                const xSettings = result.xSettings || {};
                systemPrompt = xSettings.systemPrompt || this.defaultXSystemPrompt;
                advancedSettings = xSettings.advancedSettings || DEFAULT_SETTINGS;
            }

            // Generate the reply using OpenRouter
            const reply = await this.callOpenRouter(
                openrouterApiKey,
                model || 'openai/gpt-4.1',
                systemPrompt,
                advancedSettings,
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

    private async callOpenRouter(
        apiKey: string,
        model: string,
        systemPrompt: string,
        settings: AdvancedSettings,
        request: GenerateReplyRequest
    ): Promise<string> {
        const { tweetContent, template } = request;

        const finalSystemPrompt = `${systemPrompt}\n\n${template.prompt}`;

        if (tweetContent) {
            var userPrompt = `Generate a reply to this post: "${tweetContent}"`;
        } else {
            var userPrompt = `Create a post"`;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://chatterbox.extension',
                    'X-Title': 'ChatterBox Extension'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: finalSystemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: settings.maxTokens,
                    temperature: settings.temperature,
                    presence_penalty: settings.presencePenalty,
                    frequency_penalty: settings.frequencyPenalty
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
                throw new Error(error.error?.message || 'OpenRouter API request failed');
            }

            const data = await response.json();
            let replyContent = data.choices?.[0]?.message?.content?.trim();

            if (!replyContent) {
                throw new Error('No reply content generated');
            }

            return this.formatReplyContent(replyContent);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to call OpenRouter API');
        }
    }

    private formatReplyContent(content: string): string {
        let formattedContent = content;

        // Add formatting rules here as needed
        // Example future rules:
        // - Convert to lowercase
        // - Remove multiple spaces
        // - Trim hashtags
        // - Remove emojis
        // - Character count validation

        return formattedContent;
    }
}

// Initialize the service worker
new BackgroundService();