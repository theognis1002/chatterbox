// Content script for ChatterBox
import { DEFAULT_TEMPLATES, GenerateReplyRequest, GenerateReplyResponse, ReplyTemplate } from './types';

class ChatterBox {
    private templates: ReplyTemplate[] = DEFAULT_TEMPLATES;
    private buttonsInjected = new WeakSet<HTMLElement>();
    private observer: MutationObserver | null = null;

    constructor() {
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
        // Use event delegation to catch all focus events
        document.addEventListener('focus', (event) => {
            const target = event.target as HTMLElement;

            // Check if this is a reply text area
            if (this.isReplyTextArea(target)) {
                this.injectButtons(target);
            }
        }, true); // Use capture phase to catch events early
    }

    private startObserving() {

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
            this.injectButtonsNearReplyButton(button as HTMLElement);
        });

        // Also check if the node itself is a reply button
        if (node.getAttribute('data-testid') === 'tweetButtonInline') {
            this.injectButtonsNearReplyButton(node);
        }
    }

    private injectButtonsNearReplyButton(replyButton: HTMLElement) {
        // Find a common ancestor for the reply button and toolbar/text area
        const composerRoot = replyButton.closest('div[data-testid="cellInnerDiv"], div[role="dialog"]');

        if (!composerRoot) {
            return;
        }

        const toolbar = composerRoot.querySelector('[data-testid="toolBar"]') as HTMLElement;
        if (!toolbar) {
            return;
        }

        // Check if buttons already exist
        if (toolbar.parentElement?.querySelector('.reply-bot-container')) {
            return;
        }

        // Find the text area associated with this reply button
        const textArea = composerRoot.querySelector('[contenteditable="true"][role="textbox"]') as HTMLElement;
        if (!textArea) {
            return;
        }

        // Create and inject the buttons
        const buttonContainer = this.createButtonContainer(textArea);

        // Insert after the toolbar
        toolbar.parentElement?.insertBefore(buttonContainer, toolbar.nextSibling);
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
            return;
        }

        // Find the toolbar
        const toolbar = this.findToolbar(textArea);
        if (!toolbar) {
            return;
        }

        // Check if buttons already exist in this area
        if (toolbar.parentElement?.querySelector('.reply-bot-container')) {
            return;
        }

        // Create and inject the buttons
        const buttonContainer = this.createButtonContainer(textArea);

        // Insert after the toolbar
        toolbar.parentElement?.insertBefore(buttonContainer, toolbar.nextSibling);

        // Mark this text area as having buttons
        this.buttonsInjected.add(textArea);

    }

    private findToolbar(textArea: HTMLElement): HTMLElement | null {
        // Try multiple strategies to find the toolbar

        // Strategy 1: Look for toolbar sibling
        let parent = textArea.closest('[data-testid*="tweetTextarea"]')?.parentElement;
        while (parent && parent !== document.body) {
            const toolbar = parent.querySelector('[data-testid="toolBar"]');
            if (toolbar) {
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
                    return toolbar as HTMLElement;
                }
            }
        }

        // Strategy 3: Global search (less ideal but works)
        const allToolbars = document.querySelectorAll('[data-testid="toolBar"]');
        if (allToolbars.length === 1) {
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
            await this.generateReply(e, template, textArea);
        });

        return button;
    }

    private async sendMessageWithRetry<TRequest, TResponse>(request: TRequest, maxRetries = 3, delayMs = 200): Promise<TResponse> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await chrome.runtime.sendMessage(request) as TResponse;
                return response;
            } catch (error) {
                if (error instanceof Error && error.message.includes('Could not establish connection')) {
                    // Give the service worker time to spin up and try again
                    await new Promise(res => setTimeout(res, delayMs));
                    continue;
                }
                throw error; // propagate other errors
            }
        }
        throw new Error('Failed to communicate with extension background script.');
    }

    private async generateReply(event: MouseEvent, template: ReplyTemplate, textArea: HTMLElement) {
        const button = event.currentTarget as HTMLButtonElement;
        const originalText = button.innerHTML;

        let currentTextArea: HTMLElement | null = textArea;

        // Check if the text area is still in the document
        if (!currentTextArea || !currentTextArea.isConnected) {
            const buttonContainer = button.closest('.reply-bot-container');
            const toolbar = buttonContainer?.previousElementSibling as HTMLElement;

            if (toolbar && toolbar.getAttribute('data-testid') === 'toolBar') {
                const newTextArea = this.findAssociatedTextArea(toolbar);
                if (newTextArea) {
                    currentTextArea = newTextArea;
                } else {
                    console.warn('ChatterBox: Could not re-find associated text area.');
                    currentTextArea = null;
                }
            } else {
                console.warn('ChatterBox: Could not find toolbar to re-find text area.');
                currentTextArea = null;
            }
        }

        if (!currentTextArea) {
            alert('ChatterBox: Could not find the reply text area. Please try again.');
            button.innerHTML = originalText;
            button.disabled = false;
            return;
        }

        try {
            // Show loading state
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
                response = await this.sendMessageWithRetry({
                    action: 'generateReply',
                    data: request
                });
            } catch (error) {
                // Check if it's an extension context invalidated error
                if (error instanceof Error && error.message.includes('Extension context invalidated')) {
                    // Show user-friendly message
                    alert('The extension was updated. Please refresh the page to continue using ChatterBox.');
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

            if (!response.reply || response.reply.trim() === '') {
                throw new Error('Generated reply is empty. Please try again.');
            }

            // Insert the generated reply
            await this.insertReply(response.reply, currentTextArea);

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
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
    }

    private async autoLikePost() {
        // Find the tweet article we're replying to
        const article = document.querySelector('article[data-testid="tweet"]');
        if (!article) {
            console.warn('ChatterBox: Could not find tweet article');
            return;
        }

        // Look for the like button using data-testid="like"
        const likeButton = article.querySelector('[data-testid="like"]');

        if (!likeButton) {
            console.warn('ChatterBox: Could not find like button');
            return;
        }

        // Click the like button
        (likeButton as HTMLElement).click();

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
            console.error('ChatterBox: Cannot insert empty reply');
            return;
        }

        // Get typing speed from storage
        const { advancedSettings } = await chrome.storage.sync.get(['advancedSettings']);
        const typingSpeed = advancedSettings?.typingSpeed ?? 5; // Default to 5ms if not set

        // Helper to check if an element is the editable tweet textbox
        const isEditableTextbox = (el: Element | null): el is HTMLElement => {
            return !!el && el instanceof HTMLElement && el.isContentEditable && el.getAttribute('role') === 'textbox';
        };

        // Helper to find the active editable element, as it may be replaced by the framework.
        const findEditable = (): HTMLElement | null => {
            // 1. If the original textArea is still connected, prefer it.
            if (textArea.isConnected && isEditableTextbox(textArea)) {
                return textArea;
            }

            // 2. If the currently focused element is a textbox, use that.
            if (isEditableTextbox(document.activeElement)) {
                return document.activeElement as HTMLElement;
            }

            // 3. Fallback: pick the first contenteditable textbox in the document.
            const candidate = document.querySelector<HTMLElement>('[contenteditable="true"][role="textbox"]');
            if (candidate) {
                return candidate;
            }

            return null;
        };

        let editableElement = findEditable();

        if (!editableElement) {
            console.warn('ChatterBox: Editable element was disconnected during typing, attempting to recover.');
            // Try once more after a short wait in case the framework is re-rendering.
            await new Promise(r => setTimeout(r, 30));
            editableElement = findEditable();
        }
        if (!editableElement) {
            console.warn('ChatterBox: Could not recover editable element. Aborting reply typing.');
            alert('ChatterBox: Could not continue typing because the reply box disappeared.');
            return; // Exit gracefully
        }

        // Focus and clear existing content
        editableElement.focus();
        if ((editableElement.textContent || '').trim() !== '') {
            document.execCommand('selectAll', false);
            document.execCommand('delete', false);
        }

        // Type each character
        for (const char of reply) {
            // Re-find the element on each iteration to ensure we have a fresh reference.
            editableElement = findEditable();
            if (!editableElement) {
                console.warn('ChatterBox: Editable element was disconnected during typing.');
                alert('ChatterBox: Reply cancelled because the text box was closed.');
                return; // Exit gracefully
            }

            editableElement.focus();
            document.execCommand('insertText', false, char);

            editableElement.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: char,
                composed: true
            }));

            // Use the configured typing speed
            if (typingSpeed > 0) {
                await new Promise(resolve => setTimeout(resolve, typingSpeed));
            }
        }

        // After typing, re-find the element one last time for final operations.
        editableElement = findEditable();
        if (!editableElement) {
            return; // Silently exit if element is gone.
        }

        // Dispatch a final input event to trigger any logic that depends on the full text.
        editableElement.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
        }));

        // Set cursor to the end
        editableElement.focus();
        const selection = window.getSelection();
        if (selection) {
            const range = document.createRange();
            range.selectNodeContents(editableElement);
            range.collapse(false); // false to collapse to the end
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
}

// Initialize the bot when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ChatterBox());
} else {
    new ChatterBox();
} 