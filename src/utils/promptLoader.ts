/**
 * Loads platform-specific system prompts from text files
 */

/**
 * Loads the X/Twitter system prompt
 * @returns Promise<string> The X system prompt text
 */
export async function loadXSystemPrompt(): Promise<string> {
    try {
        const response = await fetch(chrome.runtime.getURL('prompts/x-system-prompt.txt'));
        if (!response.ok) {
            throw new Error('Failed to load X system prompt');
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading X system prompt:', error);
        // Fallback to a basic X prompt if file loading fails
        return 'You are an engaged X/Twitter user. Generate concise, informal responses in lowercase without hashtags, apostrophes, or emojis.\n\nIMPORTANT: Only provide the final response. Do not include any thinking, checklists, validation steps, or meta-commentary. Generate the reply directly.';
    }
}

/**
 * Loads the LinkedIn system prompt
 * @returns Promise<string> The LinkedIn system prompt text
 */
export async function loadLinkedInSystemPrompt(): Promise<string> {
    try {
        const response = await fetch(chrome.runtime.getURL('prompts/linkedin-system-prompt.txt'));
        if (!response.ok) {
            throw new Error('Failed to load LinkedIn system prompt');
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading LinkedIn system prompt:', error);
        // Fallback to a basic LinkedIn prompt if file loading fails
        return 'You are a professional LinkedIn user. Generate thoughtful, professional responses with proper grammar and business-appropriate tone.\n\nIMPORTANT: Only provide the final response. Do not include any thinking, checklists, validation steps, or meta-commentary. Generate the reply directly.';
    }
}

 