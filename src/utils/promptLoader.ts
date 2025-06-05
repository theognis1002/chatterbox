/**
 * Loads the default system prompt from the text file
 * @returns Promise<string> The system prompt text
 */
export async function loadDefaultSystemPrompt(): Promise<string> {
    try {
        const response = await fetch(chrome.runtime.getURL('prompts/default-system-prompt.txt'));
        if (!response.ok) {
            throw new Error('Failed to load system prompt');
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading system prompt:', error);
        // Fallback to a basic prompt if file loading fails
        return 'You are a tech-focused Twitter user. Generate concise, engaging replies.';
    }
} 