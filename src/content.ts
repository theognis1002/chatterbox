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
    private observer: MutationObserver | null = null;

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

        // Start observing the DOM for reply boxes
        this.startObserving();
    }

    private startObserving() {
        console.log('Twitter Reply Bot: Starting DOM observation...');
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.checkForReplyBox();
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check
        this.checkForReplyBox();
    }

    private checkForReplyBox() {
        // Find all tweet compose areas using multiple possible selectors
        const replyBoxes = document.querySelectorAll([
            '[data-testid="tweetTextarea_0"]:not([data-reply-bot-enhanced])',
            '[data-testid="tweetTextarea_1"]:not([data-reply-bot-enhanced])',
            '[contenteditable="true"][role="textbox"]:not([data-reply-bot-enhanced])',
            '[aria-label*="Tweet text"]:not([data-reply-bot-enhanced])',
            '[aria-label*="Post text"]:not([data-reply-bot-enhanced])',
            '[aria-label*="Reply"]:not([data-reply-bot-enhanced])'
        ].join(', '));

        if (replyBoxes.length > 0) {
            console.log(`Twitter Reply Bot: Found ${replyBoxes.length} potential reply boxes`);
        }

        replyBoxes.forEach((replyBox) => {
            // Check if this is actually a reply box (has toolbar nearby)
            const toolbar = replyBox.closest('div')?.parentElement?.querySelector('[data-testid="toolBar"]');
            if (toolbar) {
                console.log('Twitter Reply Bot: Found toolbar, enhancing reply box...');
                this.enhanceReplyBox(replyBox as HTMLElement);
            }
        });
    }

    private enhanceReplyBox(replyBox: HTMLElement) {
        console.log('Twitter Reply Bot: Enhancing reply box...');

        // Mark as enhanced to avoid duplicate buttons
        replyBox.setAttribute('data-reply-bot-enhanced', 'true');

        // Find the toolbar to inject our buttons after
        let toolbar = replyBox.closest('div')?.parentElement?.querySelector('[data-testid="toolBar"]');

        // If no toolbar found, try alternative approaches
        if (!toolbar) {
            // Look for the parent container that contains the reply box
            const container = replyBox.closest('[class*="DraftEditor"]') ||
                replyBox.closest('[class*="public-DraftEditor"]') ||
                replyBox.closest('div[dir="auto"]')?.parentElement?.parentElement;

            if (container) {
                toolbar = container.querySelector('[data-testid="toolBar"]') ||
                    container.parentElement?.querySelector('[data-testid="toolBar"]');
            }
        }

        if (!toolbar) {
            console.log('Twitter Reply Bot: Could not find toolbar');
            return;
        }

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'reply-bot-container';
        buttonContainer.innerHTML = `
            <div class="reply-bot-header">AI Reply Templates:</div>
            <div class="reply-bot-buttons"></div>
        `;

        // Add buttons for each template
        const buttonsDiv = buttonContainer.querySelector('.reply-bot-buttons') as HTMLElement;
        this.templates.forEach((template) => {
            const button = this.createTemplateButton(template, replyBox);
            buttonsDiv.appendChild(button);
        });

        // Insert after the toolbar
        if (toolbar.parentElement) {
            toolbar.parentElement.insertBefore(buttonContainer, toolbar.nextSibling);
            console.log('Twitter Reply Bot: Buttons added successfully!');
        }
    }

    private createTemplateButton(template: ReplyTemplate, replyBox: HTMLElement): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'reply-bot-button';
        button.innerHTML = `${template.icon || ''} ${template.name}`;
        button.title = `Generate ${template.name} reply`;

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.generateReply(template, replyBox);
        });

        return button;
    }

    private async generateReply(template: ReplyTemplate, replyBox: HTMLElement) {
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

            const response: GenerateReplyResponse = await chrome.runtime.sendMessage({
                action: 'generateReply',
                data: request
            });

            if (response.error) {
                throw new Error(response.error);
            }

            // Insert the generated reply
            this.insertReply(response.reply, replyBox);

            // Reset button
            button.innerHTML = originalText;
            button.disabled = false;

        } catch (error) {
            console.error('Error generating reply:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate reply'}`);

            // Reset button
            const button = event?.target as HTMLButtonElement;
            button.innerHTML = button.title.replace('Generate ', '');
            button.disabled = false;
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

    private insertReply(reply: string, replyBox: HTMLElement) {
        // The replyBox might be the contenteditable itself or contain it
        let editableDiv = replyBox;

        if (!replyBox.hasAttribute('contenteditable')) {
            editableDiv = replyBox.querySelector('[contenteditable="true"]') as HTMLElement || replyBox;
        }

        if (!editableDiv) return;

        // Focus the element first
        editableDiv.focus();

        // Clear existing content
        editableDiv.innerHTML = '';

        // Insert the reply text
        editableDiv.textContent = reply;

        // Trigger input event to update Twitter's state
        const inputEvent = new Event('input', { bubbles: true });
        editableDiv.dispatchEvent(inputEvent);

        // Also trigger a change event
        const changeEvent = new Event('change', { bubbles: true });
        editableDiv.dispatchEvent(changeEvent);

        // Trigger keyboard event to ensure Twitter recognizes the input
        const keyboardEvent = new KeyboardEvent('keydown', {
            key: ' ',
            code: 'Space',
            bubbles: true
        });
        editableDiv.dispatchEvent(keyboardEvent);
    }
}

// Initialize the bot when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TwitterReplyBot());
} else {
    new TwitterReplyBot();
} 