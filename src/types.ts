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
    platform?: 'x' | 'linkedin';
}

export interface GenerateReplyResponse {
    reply: string;
    error?: string;
}

export interface StorageData {
    openrouterApiKey?: string;
    templates?: ReplyTemplate[];
    model?: string;
    xSettings?: PlatformSettings;
    linkedinSettings?: PlatformSettings;
    linkedinTemplates?: ReplyTemplate[];
    linkedinPostTemplates?: ReplyTemplate[];
}

export interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
    typingSpeed: number;
}

export interface PlatformSettings {
    systemPrompt: string;
    advancedSettings: AdvancedSettings;
    templates: ReplyTemplate[];
}

export interface ModelOption {
    id: string;
    name: string;
    provider: string;
    description?: string;
    pricing?: {
        prompt: number;
        completion: number;
    };
}

// Default LinkedIn connection templates
export const DEFAULT_LINKEDIN_TEMPLATES: ReplyTemplate[] = [
    {
        id: 'generic',
        name: 'Generic Connect',
        prompt: 'Hi {name}, I\'d love to connect with you!',
        icon: '👋'
    },
    {
        id: 'professional',
        name: 'Professional',
        prompt: 'Hi {name}, I came across your profile and would love to connect. Your experience in the industry is impressive!',
        icon: '💼'
    },
    {
        id: 'mutual',
        name: 'Mutual Interest',
        prompt: 'Hi {name}, we seem to share similar professional interests. Would love to connect and exchange insights!',
        icon: '🤝'
    },
    {
        id: 'event',
        name: 'Event Follow-up',
        prompt: 'Hi {name}, great meeting you at the recent event! Would love to stay connected.',
        icon: '🎯'
    },
    {
        id: 'industry',
        name: 'Industry Connection',
        prompt: 'Hi {name}, I\'m also working in the same industry and would love to connect with fellow professionals!',
        icon: '🏢'
    }
];

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

// Default X/Twitter reply templates
export const DEFAULT_X_TEMPLATES: ReplyTemplate[] = [
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

// Default advanced settings
export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
    temperature: 0.0,
    maxTokens: 50,
    presencePenalty: 0.25,
    frequencyPenalty: 0.25,
    typingSpeed: 5
};

// Default platform settings
export const DEFAULT_X_SETTINGS: Omit<PlatformSettings, 'systemPrompt'> = {
    advancedSettings: DEFAULT_ADVANCED_SETTINGS,
    templates: DEFAULT_X_TEMPLATES
};

export const DEFAULT_LINKEDIN_SETTINGS: Omit<PlatformSettings, 'systemPrompt'> = {
    advancedSettings: DEFAULT_ADVANCED_SETTINGS,
    templates: DEFAULT_LINKEDIN_POST_TEMPLATES
};


// Model definitions for the extension via OpenRouter
export const OPENROUTER_MODELS: ModelOption[] = [
    // OpenAI models via OpenRouter
    { id: 'openai/gpt-5', name: 'GPT-5 (OpenRouter)', provider: 'openrouter', description: 'Latest OpenAI reasoning model via OpenRouter' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter)', provider: 'openrouter', description: 'GPT-4o via OpenRouter' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', provider: 'openrouter', description: 'Smaller GPT-4o via OpenRouter' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo (OpenRouter)', provider: 'openrouter', description: 'GPT-4 Turbo via OpenRouter' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenRouter)', provider: 'openrouter', description: 'GPT-3.5 Turbo via OpenRouter' },

    // Anthropic models
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', description: 'Advanced Claude model' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'openrouter', description: 'Fast Claude model' },
    { id: 'anthropic/claude-4', name: 'Claude 4', provider: 'openrouter', description: 'Latest Claude with reasoning' },

    // Google models
    { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'openrouter', description: 'Google\'s flagship model' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter', description: 'Enhanced Gemini Pro' },

    // Meta models
    { id: 'meta-llama/llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'openrouter', description: 'Large Llama model' },
    { id: 'meta-llama/llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'openrouter', description: 'Balanced Llama model' },
    { id: 'meta-llama/llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'openrouter', description: 'Fast Llama model' },

    // Other popular models
    { id: 'perplexity/llama-3.1-sonar-huge-128k-online', name: 'Perplexity Sonar Huge', provider: 'openrouter', description: 'Perplexity\'s large model with web search' },
    { id: 'mistralai/mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'openrouter', description: 'Mistral\'s mixture of experts' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'openrouter', description: 'DeepSeek\'s chat model' }
];

// All available models (OpenRouter only)
export const ALL_MODELS: ModelOption[] = OPENROUTER_MODELS; 