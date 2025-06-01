// Type definitions for Twitter Reply Bot

export interface ReplyTemplate {
    id: string;
    name: string;
    prompt: string;
    icon?: string;
}

export interface GenerateReplyRequest {
    tweetContent: string;
    template: ReplyTemplate;
    context?: string;
}

export interface GenerateReplyResponse {
    reply: string;
    error?: string;
}

export interface StorageData {
    apiKey?: string;
    templates?: ReplyTemplate[];
}

export const DEFAULT_TEMPLATES: ReplyTemplate[] = [
    {
        id: 'question',
        name: 'Question',
        prompt: 'Generate a thoughtful question in response to this tweet. Be curious and engaging.',
        icon: '❓'
    },
    {
        id: 'funny',
        name: 'Funny Remark',
        prompt: 'Generate a witty and humorous response to this tweet. Be clever but not offensive.',
        icon: '😄'
    },
    {
        id: 'agree',
        name: 'Agreement',
        prompt: 'Generate a supportive response that agrees with and builds upon the tweet.',
        icon: '👍'
    },
    {
        id: 'insight',
        name: 'Add Insight',
        prompt: 'Generate a response that adds valuable insight or a different perspective to the tweet.',
        icon: '💡'
    }
]; 