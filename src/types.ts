// Type definitions for ChatterBox

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

export interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
    typingSpeed: number;
}

export const DEFAULT_LINKEDIN_POST_TEMPLATES: ReplyTemplate[] = [
    {
        id: 'question',
        name: 'Question',
        prompt: 'Generate a concise, thoughtful question in response to this LinkedIn post. Be curious and engaging.',
        icon: '❓'
    },
    {
        id: 'funny',
        name: 'Funny',
        prompt: 'Generate a concise, witty and humorous response to this LinkedIn post. Be clever but not offensive, while maintaining professional tone.',
        icon: '😄'
    },
    {
        id: 'agree',
        name: 'Agree',
        prompt: 'Generate a concise, supportive response that agrees with and builds upon the LinkedIn post.',
        icon: '👍'
    },
    {
        id: 'professional',
        name: 'Professional',
        prompt: 'Generate a concise, professional comment that adds value to this LinkedIn post. Be respectful and constructive.',
        icon: '💼'
    },
    {
        id: 'insight',
        name: 'Insightful',
        prompt: 'Generate a concise response that adds valuable insight or a different perspective to the LinkedIn post. If it is a technical post, add a technical insight.',
        icon: '💡'
    },
    {
        id: 'disagree',
        name: 'Disagree',
        prompt: 'Generate a concise response that disagrees with the LinkedIn post. Be respectful and constructive while maintaining professionalism.',
        icon: '👎'
    },
    {
        id: 'expertise',
        name: 'Share Expertise',
        prompt: 'Generate a comment that shares relevant professional expertise or experience related to this LinkedIn post topic.',
        icon: '🎓'
    },
    {
        id: 'congrats',
        name: 'Congrats',
        prompt: 'Generate a concise, congratulatory response to the LinkedIn post. Be positive and professional.',
        icon: '🎉'
    },
    {
        id: 'response',
        name: 'Respond',
        prompt: 'Generate a concise, thoughtful response to the LinkedIn post. Be positive and constructive.',
        icon: '💬'
    },
    {
        id: 'encourage',
        name: 'Encourage',
        prompt: 'Generate a concise, encouraging response to the LinkedIn post. Be positive and motivating.',
        icon: '💪'
    }
];

export const DEFAULT_TEMPLATES: ReplyTemplate[] = [
    {
        id: 'question',
        name: 'Question',
        prompt: 'Generate a 1 sentence concise, thoughtful question in response to this tweet. Be curious and engaging.',
        icon: '❓'
    },
    {
        id: 'funny',
        name: 'Funny',
        prompt: 'Generate a 1 sentence concise, witty and humorous response to this tweet. Be clever but not offensive.',
        icon: '😄'
    },
    {
        id: 'agree',
        name: 'Agree',
        prompt: 'Generate a 1 sentence concise, supportive response that agrees with and builds upon the tweet.',
        icon: '👍'
    },
    {
        id: 'sarcastic',
        name: 'Sarcastic',
        prompt: 'Generate a 1 sentence concise, sarcastic response to the tweet. Be clever but not offensive.',
        icon: '🤨'
    },
    {
        id: 'insight',
        name: 'Insightful',
        prompt: 'Generate a concise response that adds valuable insight or a different perspective to the tweet. If it is a technical post, add a technical insight.',
        icon: '💡'
    },
    {
        id: 'disagree',
        name: 'Disagree',
        prompt: 'Generate a concise response that disagrees with the tweet. Be respectful and/or constructive.',
        icon: '👎'
    },
    {
        id: 'promote',
        name: 'Promote',
        prompt: 'Generate a concise response that promotes my product (always put the link in the response!)',
        icon: '🚀'
    },
    {
        id: 'congrats',
        name: 'Congrats',
        prompt: 'Generate a 1 sentence concise, congratulatory response to the tweet. Be positive and/or constructive.',
        icon: '🎉'
    },
    {
        id: 'response',
        name: 'Respond',
        prompt: 'Generate a 1 sentence concise, response to the tweet. Be positive and/or constructive.',
        icon: '💬'
    },
    {
        id: 'encourage',
        name: 'Encourage',
        prompt: 'Generate a 1 sentence concise, encouraging response to the tweet. Be positive and/or constructive.',
        icon: '💪'
    }
]; 