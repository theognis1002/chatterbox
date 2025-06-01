// Content script for Twitter Reply Bot
import './styles.css';
import { DEFAULT_TEMPLATES, GenerateReplyRequest, GenerateReplyResponse, ReplyTemplate } from './types';

console.log('Twitter Reply Bot: Content script loaded!');

// Add a test button to the page immediately
function addTestButton() {
    const testButton = document.createElement('button');
    testButton.innerHTML = '🤖';
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

        // Listen for focus events on the page
        this.setupFocusListener();

        // Also observe DOM changes to catch reply boxes as they appear
        this.startObserving();
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

    private startObserving() {
        console.log('Twitter Reply Bot: Starting DOM observation...');

        this.observer = new MutationObserver((mutations) => {
            // Look for reply buttons in the mutations
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check added nodes
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkForReplyButton(node as HTMLElement);
                        }
                    });
                }
            }
        });

        // Start observing
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check for any existing reply buttons
        this.checkForReplyButton(document.body);
    }

    private checkForReplyButton(node: HTMLElement) {
        // Look for the Reply button
        const replyButtons = node.querySelectorAll('[data-testid="tweetButtonInline"]');

        replyButtons.forEach((button) => {
            console.log('Twitter Reply Bot: Found Reply button');
            this.injectButtonsNearReplyButton(button as HTMLElement);
        });

        // Also check if the node itself is a reply button
        if (node.getAttribute('data-testid') === 'tweetButtonInline') {
            console.log('Twitter Reply Bot: Node itself is Reply button');
            this.injectButtonsNearReplyButton(node);
        }
    }

    private injectButtonsNearReplyButton(replyButton: HTMLElement) {
        // Check if we already injected buttons in this area
        const toolbar = replyButton.closest('[data-testid="toolBar"]') as HTMLElement;
        if (!toolbar) {
            console.log('Twitter Reply Bot: Could not find toolbar for Reply button');
            return;
        }

        // Check if buttons already exist
        if (toolbar.parentElement?.querySelector('.reply-bot-container')) {
            console.log('Twitter Reply Bot: Buttons already exist in this area');
            return;
        }

        // Find the text area associated with this reply button
        const textArea = this.findAssociatedTextArea(toolbar);
        if (!textArea) {
            console.log('Twitter Reply Bot: Could not find associated text area');
            return;
        }

        // Create and inject the buttons
        const buttonContainer = this.createButtonContainer(textArea);

        // Insert after the toolbar
        toolbar.parentElement?.insertBefore(buttonContainer, toolbar.nextSibling);

        console.log('Twitter Reply Bot: Buttons injected successfully!');
    }

    private findAssociatedTextArea(toolbar: HTMLElement): HTMLElement | null {
        // Look for text area in the same container structure
        let parent = toolbar.parentElement;
        while (parent && parent !== document.body) {
            const textArea = parent.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement;
            if (textArea) {
                return textArea;
            }
            parent = parent.parentElement;
        }

        // Fallback: look for any contenteditable in the page
        const allTextAreas = document.querySelectorAll('[contenteditable="true"][role="textbox"]');
        if (allTextAreas.length === 1) {
            return allTextAreas[0] as HTMLElement;
        }

        return null;
    }

    private checkNodeForReplyBoxes(node: HTMLElement) {
        // Now just check for Reply buttons instead of text areas
        this.checkForReplyButton(node);
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

            console.log('Twitter Reply Bot: Generating reply for tweet:', tweetContent);

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

            console.log('Twitter Reply Bot: Received response:', response);

            if (!response) {
                throw new Error('No response from extension. Please refresh the page and try again.');
            }

            if (response.error) {
                throw new Error(response.error);
            }

            if (!response.reply || response.reply.trim() === '') {
                throw new Error('Generated reply is empty. Please try again.');
            }

            // Insert the generated reply
            await this.insertReply(response.reply, textArea);

            // Auto-like the post
            await this.autoLikePost();

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

    private async autoLikePost() {
        console.log('Twitter Reply Bot: Attempting to auto-like post...');

        // Find the tweet article we're replying to
        const article = document.querySelector('article[data-testid="tweet"]');
        if (!article) {
            console.log('Twitter Reply Bot: Could not find tweet article');
            return;
        }

        // Look for the like button using data-testid="like"
        const likeButton = article.querySelector('[data-testid="like"]');

        if (!likeButton) {
            console.log('Twitter Reply Bot: Could not find like button');
            return;
        }

        // Click the like button
        (likeButton as HTMLElement).click();
        console.log('Twitter Reply Bot: Liked the post!');

        // Small delay to ensure the like is registered
        await new Promise(resolve => setTimeout(resolve, 100));
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

    private async insertReply(reply: string, textArea: HTMLElement) {
        // Validate reply
        if (!reply || reply.trim() === '') {
            console.error('Twitter Reply Bot: Cannot insert empty reply');
            return;
        }

        console.log('Twitter Reply Bot: Inserting reply:', reply);

        // Focus the element first
        textArea.focus();

        // Find the actual contenteditable element
        const editableElement = textArea.hasAttribute('contenteditable') ? textArea :
            textArea.querySelector('[contenteditable="true"]') as HTMLElement || textArea;

        if (!editableElement) {
            console.error('Twitter Reply Bot: Could not find editable element');
            return;
        }

        // Clear existing content by selecting all and deleting
        editableElement.focus();

        // Get current content to check if we need to clear
        const currentContent = editableElement.textContent || '';
        console.log('Twitter Reply Bot: Current content before clear:', currentContent);

        if (currentContent.trim() !== '') {
            // Select all content
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editableElement);
            selection?.removeAllRanges();
            selection?.addRange(range);

            // Delete selected content
            document.execCommand('delete', false);

            // Clear the selection
            selection?.removeAllRanges();
        }

        // Type each character
        for (let i = 0; i < reply.length; i++) {
            const char = reply[i];

            // Focus before each character
            editableElement.focus();

            // Use execCommand for actual character insertion
            document.execCommand('insertText', false, char);

            // Trigger input event for each character
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: char,
                composed: true
            });
            editableElement.dispatchEvent(inputEvent);

            // Small delay to simulate human typing (optional, but can help with some sites)
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        // Final input event for the complete text
        const finalInputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertRecomposeText',
            composed: true
        });
        editableElement.dispatchEvent(finalInputEvent);

        // Ensure focus and cursor at end
        editableElement.focus();
        const finalSelection = window.getSelection();
        const finalRange = document.createRange();
        finalRange.selectNodeContents(editableElement);
        finalRange.collapse(false);
        finalSelection?.removeAllRanges();
        finalSelection?.addRange(finalRange);

        console.log('Twitter Reply Bot: Reply insertion complete');
    }
}

// Initialize the bot when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TwitterReplyBot());
} else {
    new TwitterReplyBot();
} 