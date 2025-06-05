// Background service worker for X Reply Bot
import { GenerateReplyRequest, GenerateReplyResponse } from './types';
import { loadDefaultSystemPrompt } from './utils/promptLoader';

interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
}

const DEFAULT_SETTINGS: AdvancedSettings = {
    temperature: 0.5,
    maxTokens: 50,
    presencePenalty: 0.6,
    frequencyPenalty: 0.3
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
            console.error('X Reply Bot: Failed to initialize background service:', error);
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
            // Get all settings from storage
            const { apiKey, model, systemPrompt, advancedSettings } =
                await chrome.storage.sync.get(['apiKey', 'model', 'systemPrompt', 'advancedSettings']);

            if (!apiKey) {
                sendResponse({
                    reply: '',
                    error: 'OpenAI API key not configured. Please set it in the extension popup.'
                });
                return;
            }

            // Generate the reply using OpenAI
            const reply = await this.callOpenAI(
                apiKey,
                model || 'gpt-3.5-turbo',
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

    private async callOpenAI(
        apiKey: string,
        model: string,
        systemPrompt: string,
        settings: AdvancedSettings,
        request: GenerateReplyRequest
    ): Promise<string> {
        const { tweetContent, template } = request;

        const finalSystemPrompt = `${systemPrompt} ${template.prompt}`;

        if (tweetContent) {
            var userPrompt = `Generate a reply to this tweet: "${tweetContent}"`;
        } else {
            var userPrompt = `Create a post"`;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
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
                throw new Error(error.error?.message || 'OpenAI API request failed');
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
            throw new Error('Failed to call OpenAI API');
        }
    }

    private formatReplyContent(content: string): string {
        let formattedContent = content;

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

        return formattedContent;
    }
}

// Initialize the service worker
new BackgroundService();