// Content script for Twitter Reply Bot
import './styles.css';
import { DEFAULT_TEMPLATES, GenerateReplyRequest, GenerateReplyResponse, ReplyTemplate } from './types';

console.log('Twitter Reply Bot: Content script loaded!');

// Add a test button to the page immediately
function addTestButton() {
    const testButton = document.createElement('button');
    testButton.innerHTML = '🤖 Reply Bot Active';
    testButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: #1d9bf0;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        border: none;
        font-weight: bold;
        cursor: pointer;
    `;
    testButton.addEventListener('click', () => {
        alert('Twitter Reply Bot is working! Now looking for reply boxes...');
    });
    document.body.appendChild(testButton);
}

// Add the test button when DOM is ready
if (document.body) {
    addTestButton();
} else {
    document.addEventListener('DOMContentLoaded', addTestButton);
}

class TwitterReplyBot {
    private templates: ReplyTemplate[] = DEFAULT_TEMPLATES;
    private buttonsInjected = new WeakSet<HTMLElement>();

    constructor() {
        console.log('Twitter Reply Bot: Initializing...');
        this.init();
    }

    private async init() {
        // Load custom templates from storage
        const result = await chrome.storage.sync.get(['templates']);
        if (result.templates) {
            this.templates = result.templates;
        }

        // Listen for focus events on the page
        this.setupFocusListener();
    }

    private setupFocusListener() {
        console.log('Twitter Reply Bot: Setting up focus listener...');

        // Use event delegation to catch all focus events
        document.addEventListener('focus', (event) => {
            const target = event.target as HTMLElement;

            // Check if this is a reply text area
            if (this.isReplyTextArea(target)) {
                console.log('Twitter Reply Bot: Reply text area focused!');
                this.injectButtons(target);
            }
        }, true); // Use capture phase to catch events early
    }

    private isReplyTextArea(element: HTMLElement): boolean {
        // Check various indicators that this is a reply text area
        return (
            element.getAttribute('contenteditable') === 'true' &&
            (
                element.getAttribute('data-testid')?.includes('tweetTextarea') ||
                element.getAttribute('aria-label')?.includes('Post text') ||
                element.getAttribute('aria-label')?.includes('Reply') ||
                // Check if placeholder says "Post your reply"
                element.getAttribute('aria-describedby')?.includes('placeholder') ||
                // Check parent structure
                element.closest('[data-testid*="tweetTextarea"]') !== null
            )
        );
    }

    private injectButtons(textArea: HTMLElement) {
        // Check if we already injected buttons for this text area
        if (this.buttonsInjected.has(textArea)) {
            console.log('Twitter Reply Bot: Buttons already injected for this text area');
            return;
        }

        // Find the toolbar
        const toolbar = this.findToolbar(textArea);
        if (!toolbar) {
            console.log('Twitter Reply Bot: Could not find toolbar');
            return;
        }

        // Check if buttons already exist in this area
        if (toolbar.parentElement?.querySelector('.reply-bot-container')) {
            console.log('Twitter Reply Bot: Buttons already exist in this area');
            return;
        }

        // Create and inject the buttons
        const buttonContainer = this.createButtonContainer(textArea);

        // Insert after the toolbar
        toolbar.parentElement?.insertBefore(buttonContainer, toolbar.nextSibling);

        // Mark this text area as having buttons
        this.buttonsInjected.add(textArea);

        console.log('Twitter Reply Bot: Buttons injected successfully!');
    }

    private findToolbar(textArea: HTMLElement): HTMLElement | null {
        // Try multiple strategies to find the toolbar

        // Strategy 1: Look for toolbar sibling
        let parent = textArea.closest('[data-testid*="tweetTextarea"]')?.parentElement;
        while (parent && parent !== document.body) {
            const toolbar = parent.querySelector('[data-testid="toolBar"]');
            if (toolbar) {
                console.log('Twitter Reply Bot: Found toolbar via parent search');
                return toolbar as HTMLElement;
            }
            parent = parent.parentElement;
        }

        // Strategy 2: Look for the specific structure from the provided DOM
        const editorRoot = textArea.closest('.DraftEditor-root');
        if (editorRoot) {
            const mainContainer = editorRoot.closest('.css-175oi2r.r-kemksi.r-jumn1c.r-xd6kpl.r-gtdqiz.r-ipm5af.r-184en5c');
            if (mainContainer) {
                const toolbar = mainContainer.querySelector('[data-testid="toolBar"]');
                if (toolbar) {
                    console.log('Twitter Reply Bot: Found toolbar via DraftEditor structure');
                    return toolbar as HTMLElement;
                }
            }
        }

        // Strategy 3: Global search (less ideal but works)
        const allToolbars = document.querySelectorAll('[data-testid="toolBar"]');
        if (allToolbars.length === 1) {
            console.log('Twitter Reply Bot: Found single toolbar on page');
            return allToolbars[0] as HTMLElement;
        }

        return null;
    }

    private createButtonContainer(textArea: HTMLElement): HTMLElement {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'reply-bot-container';
        buttonContainer.innerHTML = `
            <div class="reply-bot-header">AI Reply Templates:</div>
            <div class="reply-bot-buttons"></div>
        `;

        // Add buttons for each template
        const buttonsDiv = buttonContainer.querySelector('.reply-bot-buttons') as HTMLElement;
        this.templates.forEach((template) => {
            const button = this.createTemplateButton(template, textArea);
            buttonsDiv.appendChild(button);
        });

        return buttonContainer;
    }

    private createTemplateButton(template: ReplyTemplate, textArea: HTMLElement): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'reply-bot-button';
        button.innerHTML = `${template.icon || ''} ${template.name}`;
        button.title = `Generate ${template.name} reply`;

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.generateReply(template, textArea);
        });

        return button;
    }

    private async generateReply(template: ReplyTemplate, textArea: HTMLElement) {
        try {
            // Show loading state
            const button = event?.target as HTMLButtonElement;
            const originalText = button.innerHTML;
            button.innerHTML = '⏳ Generating...';
            button.disabled = true;

            // Get the tweet content we're replying to
            const tweetContent = this.getTweetContent();

            if (!tweetContent) {
                throw new Error('Could not find tweet content');
            }

            // Send request to background script
            const request: GenerateReplyRequest = {
                tweetContent,
                template
            };

            let response: GenerateReplyResponse;

            try {
                response = await chrome.runtime.sendMessage({
                    action: 'generateReply',
                    data: request
                });
            } catch (error) {
                // Check if it's an extension context invalidated error
                if (error instanceof Error && error.message.includes('Extension context invalidated')) {
                    // Show user-friendly message
                    alert('The extension was updated. Please refresh the page to continue using Twitter Reply Bot.');
                    throw error;
                }
                // Re-throw other errors
                throw error;
            }

            if (!response) {
                throw new Error('No response from extension. Please refresh the page and try again.');
            }

            if (response.error) {
                throw new Error(response.error);
            }

            // Insert the generated reply
            this.insertReply(response.reply, textArea);

            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;

        } catch (error) {
            console.error('Error generating reply:', error);

            // Provide user-friendly error messages
            let errorMessage = 'Failed to generate reply';
            if (error instanceof Error) {
                if (error.message.includes('Extension context invalidated')) {
                    errorMessage = 'Please refresh the page to continue using the extension';
                } else {
                    errorMessage = error.message;
                }
            }

            alert(`Error: ${errorMessage}`);

            // Reset button
            const button = event?.target as HTMLButtonElement;
            if (button) {
                button.innerHTML = button.title.replace('Generate ', '');
                button.disabled = false;
            }
        }
    }

    private getTweetContent(): string | null {
        // Try multiple selectors to find the tweet we're replying to
        const selectors = [
            'article[data-testid="tweet"] [data-testid="tweetText"]',
            'article[role="article"] [data-testid="tweetText"]',
            'div[data-testid="tweetText"]',
            '[data-testid="tweet-text-show-more-link"]',
            'article [lang] span'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            // Get the first tweet text (should be the one we're replying to)
            if (elements.length > 0) {
                const tweetText = elements[0];
                return tweetText?.textContent || null;
            }
        }

        // Fallback: try to find any article with text
        const article = document.querySelector('article');
        if (article) {
            const textElement = article.querySelector('[dir="auto"] span');
            return textElement?.textContent || null;
        }

        return null;
    }

    private insertReply(reply: string, textArea: HTMLElement) {
        // Focus the element first
        textArea.focus();

        // Find the actual contenteditable element
        const editableElement = textArea.hasAttribute('contenteditable') ? textArea :
            textArea.querySelector('[contenteditable="true"]') as HTMLElement || textArea;

        if (!editableElement) return;

        // Clear existing content
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editableElement);
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Delete existing content
        document.execCommand('delete', false);

        // Insert the new text using execCommand which preserves editability
        document.execCommand('insertText', false, reply);

        // Trigger input event for Twitter's state management
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: reply
        });
        editableElement.dispatchEvent(inputEvent);

        // Place cursor at the end and ensure the element stays focused
        setTimeout(() => {
            // Ensure focus
            editableElement.focus();

            // Move cursor to end
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editableElement);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);

            // Dispatch one more input event to ensure Twitter's state is updated
            const finalInputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: ' '
            });
            editableElement.dispatchEvent(finalInputEvent);

            // Remove the extra space we just added
            document.execCommand('delete', false);
        }, 50);
    }
}

// Initialize the bot when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TwitterReplyBot());
} else {
    new TwitterReplyBot();
} 