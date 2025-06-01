// Background service worker for Twitter Reply Bot
import { GenerateReplyRequest, GenerateReplyResponse } from './types';

class BackgroundService {
    constructor() {
        this.setupMessageListener();
    }

    private setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'generateReply') {
                this.handleGenerateReply(request.data, sendResponse);
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
            // Get API key from storage
            const { apiKey } = await chrome.storage.sync.get(['apiKey']);

            if (!apiKey) {
                sendResponse({
                    reply: '',
                    error: 'OpenAI API key not configured. Please set it in the extension popup.'
                });
                return;
            }

            // Generate the reply using OpenAI
            const reply = await this.callOpenAI(apiKey, request);

            sendResponse({ reply });
        } catch (error) {
            console.error('Error generating reply:', error);
            sendResponse({
                reply: '',
                error: error instanceof Error ? error.message : 'Failed to generate reply'
            });
        }
    }

    private async callOpenAI(apiKey: string, request: GenerateReplyRequest): Promise<string> {
        const { tweetContent, template } = request;

        const systemPrompt = `You are a helpful Twitter reply assistant. Generate concise, engaging replies that fit Twitter's character limit. ${template.prompt}`;

        const userPrompt = `Generate a reply to this tweet: "${tweetContent}"`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 150,
                temperature: 0.8,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API request failed');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || 'Failed to generate reply';
    }
}

// Initialize the background service
new BackgroundService(); 