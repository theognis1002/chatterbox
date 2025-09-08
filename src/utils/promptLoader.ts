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
        const basePrompt = await response.text();
        return `${basePrompt}\n\nIMPORTANT: Only provide the final response. Do not include any thinking, checklists, validation steps, or meta-commentary. Generate the reply directly.`;
    } catch (error) {
        console.error('Error loading system prompt:', error);
        // Fallback to a basic prompt if file loading fails
        return 'Generate concise, engaging replies.\n\nIMPORTANT: Only provide the final response. Do not include any thinking, checklists, validation steps, or meta-commentary. Generate the reply directly.';
    }
} 