// Content script for ChatterBox (LinkedIn)
// Adds template buttons to the "Add a note" connection modal and post comment areas

import { DEFAULT_TEMPLATES, DEFAULT_LINKEDIN_POST_TEMPLATES, ReplyTemplate } from './types';

interface LinkedInTemplate {
    id: string;
    name: string;
    message?: string; // legacy field
    prompt?: string;  // aligned with popup definitions
    icon?: string;
}

// Default templates – adjust as desired. In the future these could be user-editable via popup.
const DEFAULT_LINKEDIN_TEMPLATES: LinkedInTemplate[] = [
    {
        id: 'greeting1',
        name: 'Message #1',
        message: 'Hi {name}, I came across your profile and would love to connect to share insights and opportunities.'
    },
    {
        id: 'greeting2',
        name: 'Message #2',
        message: 'Hello {name}! I found your work fascinating and would be happy to connect and keep in touch.'
    }
];

class ChatterBoxLinkedIn {
    private templates: LinkedInTemplate[] = DEFAULT_LINKEDIN_TEMPLATES;
    private postReplyTemplates: ReplyTemplate[] = DEFAULT_LINKEDIN_POST_TEMPLATES;
    private observer: MutationObserver | null = null;
    private injectedModals = new WeakSet<HTMLTextAreaElement>();
    private injectedCommentAreas = new WeakSet<HTMLElement>();
    private currentRecipientName: string | null = null;
    private lastUrl: string = location.href;

    constructor() {
        this.init();
    }

    private async init() {
        // Check if chrome APIs are available
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.runtime) {
            console.error('ChatterBox LinkedIn: Chrome extension APIs not available');
            return;
        }

        try {
            // Load custom LinkedIn templates stored under a dedicated key.
            const result = await chrome.storage.sync.get(['linkedinTemplates', 'linkedinPostTemplates']);
            if (result.linkedinTemplates && Array.isArray(result.linkedinTemplates)) {
                this.templates = result.linkedinTemplates;
            }
            // Load LinkedIn post reply templates
            if (result.linkedinPostTemplates && Array.isArray(result.linkedinPostTemplates)) {
                this.postReplyTemplates = result.linkedinPostTemplates;
            }
        } catch (error) {
            console.error('ChatterBox LinkedIn: Failed to load templates from storage:', error);
            // Continue with default templates if storage fails
        }

        this.captureRecipientNameOnClicks();
        this.monitorUrlChanges();
        this.setupFocusListener(); // Add focus-based detection like X/Twitter
        this.startObserving();
        // Initial scan – in case modal or comment areas are already present when the script loads.
        this.scanNode(document.body);
    }

    /**
     * Set up focus listener to detect when user clicks in comment areas
     */
    private setupFocusListener() {
        document.addEventListener('focus', (event) => {
            const target = event.target as HTMLElement;

            // Check if this is a LinkedIn comment input area
            if (this.isLinkedInCommentArea(target)) {
                this.injectPostReplyButtons(target);
            }
        }, true); // Use capture phase to catch events early
    }

    /**
     * Check if the focused element is a LinkedIn comment input area
     */
    private isLinkedInCommentArea(element: HTMLElement): boolean {
        if (!element) return false;

        // Check if it's contenteditable (LinkedIn's rich text editor)
        if (element.isContentEditable) {
            // Check various indicators that this is a LinkedIn comment area
            const isCommentArea = (
                // Has aria-label related to comments
                element.getAttribute('aria-label')?.toLowerCase().includes('comment') ||
                // Has placeholder about adding comment
                element.getAttribute('placeholder')?.toLowerCase().includes('comment') ||
                // Is inside a comment-related container
                element.closest('[class*="comment"]') !== null ||
                // Has LinkedIn's specific classes
                element.classList.contains('tiptap') ||
                element.classList.contains('ProseMirror') ||
                // Check parent elements for comment indicators
                element.closest('[aria-label*="Add a comment"]') !== null ||
                element.closest('[aria-label*="comment"]') !== null
            );

            return isCommentArea;
        }

        // Check if it's a textarea in a comment context
        if (element instanceof HTMLTextAreaElement) {
            const isTextareaComment = (
                element.placeholder?.toLowerCase().includes('comment') ||
                element.closest('[class*="comment"]') !== null
            );
            return isTextareaComment;
        }

        return false;
    }

    /**
     * Use a MutationObserver to detect new modals being added.
     */
    private startObserving() {
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanNode(node as HTMLElement);
                        }
                    });
                }
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Recursively scan the provided node (and its descendants) for textareas and comment boxes.
     */
    private scanNode(root: HTMLElement) {
        // Look for connection modal textarea
        const textareas = root.querySelectorAll<HTMLTextAreaElement>('textarea#custom-message');
        textareas.forEach((ta) => this.injectButtons(ta));

        // Also handle the case where the root itself is the textarea.
        if (root instanceof HTMLTextAreaElement && root.id === 'custom-message') {
            this.injectButtons(root);
        }

        // Look for post comment areas
        this.scanForCommentAreas(root);
    }

    /**
     * Scan for LinkedIn post comment areas where we should inject reply buttons
     */
    private scanForCommentAreas(root: HTMLElement) {
        // LinkedIn comment selectors based on the provided HTML structure
        const commentSelectors = [
            // Target the main comment editor container based on your provided HTML
            '[aria-label="Text editor for creating comment"]',
            // Alternative selectors for different LinkedIn versions
            '.comments-comment-box__form',
            '.comments-comment-box-comment__text-editor',
            '[data-test-id="comments-comment-texteditor"]',
            '.comments-comment-box textarea',
            '.comments-comment-box [contenteditable="true"]',
            'form[data-test-id="comment-form"]',
            '.comment-form',
            '[aria-label*="Add a comment"]',
            '[placeholder*="Add a comment"]',
            // New selectors based on the provided HTML structure
            '[data-testid="ui-core-tiptap-text-editor-wrapper"]',
            '.tiptap.ProseMirror[contenteditable="true"]'
        ];

        for (const selector of commentSelectors) {
            const elements = root.querySelectorAll(selector);
            elements.forEach((element) => {
                if (element instanceof HTMLElement) {
                    this.injectPostReplyButtons(element);
                }
            });
        }

        // Also check if the root itself matches any of these selectors
        for (const selector of commentSelectors) {
            if (root.matches && root.matches(selector)) {
                this.injectPostReplyButtons(root);
                break;
            }
        }
    }

    /**
     * Injects template buttons adjacent to the textarea inside the modal.
     */
    private injectButtons(textArea: HTMLTextAreaElement) {
        // Prevent duplicate injection for the same modal/textarea.
        if (this.injectedModals.has(textArea)) {
            return;
        }

        // The modal structure may change – attempt to insert after the textarea or within a suitable container.
        const container = document.createElement('div');
        container.className = 'reply-bot-container';
        container.innerHTML = '<div class="reply-bot-buttons"></div>';

        const buttonsDiv = container.querySelector('.reply-bot-buttons') as HTMLElement;
        this.templates.forEach((template) => {
            const button = this.createTemplateButton(template, textArea);
            buttonsDiv.appendChild(button);
        });

        // Prefer inserting right after the textarea for simple layout.
        if (textArea.parentElement) {
            textArea.parentElement.appendChild(container);
        } else {
            // Fallback: insert before modal action bar if available.
            const modal = textArea.closest('div[role="dialog"]');
            const actionBar = modal?.querySelector('.artdeco-modal__actionbar');
            actionBar?.parentElement?.insertBefore(container, actionBar);
        }

        this.injectedModals.add(textArea);
    }

    /**
     * Creates an individual template button.
     */
    private createTemplateButton(template: LinkedInTemplate, textArea: HTMLTextAreaElement): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'reply-bot-button';
        button.textContent = `${template.icon || ''} ${template.name}`.trim();
        button.title = `Insert ${template.name}`;

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const msg = template.message ?? template.prompt ?? '';
            this.insertMessage(msg, textArea);
        });

        return button;
    }

    /**
     * Inserts the chosen message into the textarea, firing input events so that LinkedIn UI updates.
     */
    private insertMessage(message: string, textArea: HTMLTextAreaElement) {
        textArea.focus();
        const safeMessage = message || '';
        let personalizedMessage: string;
        if (this.currentRecipientName) {
            personalizedMessage = safeMessage.replace(/\{name\}/gi, this.currentRecipientName);
        } else {
            // Remove placeholder and any adjoining punctuation/extra spaces.
            personalizedMessage = safeMessage
                .replace(/\s*[,;:\-]?\s*\{name\}\s*/gi, ' ') // remove placeholder and neighbor punctuation
                .replace(/\s{2,}/g, ' ') // collapse double spaces
                .trim();
        }

        textArea.value = personalizedMessage;

        // Dispatch an input event so React/Svelte/etc. knows the value changed.
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        textArea.dispatchEvent(inputEvent);

        // Also dispatch change event for good measure.
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        textArea.dispatchEvent(changeEvent);
    }

    /**
     * Global click listener to capture the recipient's name when user presses Connect/Message.
     */
    private captureRecipientNameOnClicks() {
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (!(target instanceof HTMLElement)) return;

            // Traverse up to button element
            const button = target.closest('button');
            if (!button) return;

            const label = (button.getAttribute('aria-label') || '').toLowerCase();

            // Patterns we expect:
            // "invite {name} to connect", "connect with {name}", or "message {name}"
            const connectMatch = label.match(/invite\s+(.+?)\s+to\s+connect/);
            const connectMatch2 = label.match(/connect\s+(?:with\s+)?(.+)/);
            const messageMatch = label.match(/message\s+(.+)/);

            let rawName: string | undefined;
            if (connectMatch && connectMatch[1]) rawName = connectMatch[1];
            else if (connectMatch2 && connectMatch2[1]) rawName = connectMatch2[1];
            else if (messageMatch && messageMatch[1]) rawName = messageMatch[1];

            // Fallback: grab name from profile header (h1) if available
            if (!rawName) {
                const header = document.querySelector('h1.inline.t-24, h1.text-heading-xlarge');
                if (header && header.textContent) {
                    rawName = header.textContent.trim();
                }
            }

            if (rawName) {
                // Extract first word as first name, remove non-alphabetic chars, capitalize.
                const firstWord = rawName.trim().split(/\s+/)[0] || '';
                const cleaned = firstWord.replace(/[^a-zA-Z'’\-]/g, '');
                if (cleaned.length > 0) {
                    this.currentRecipientName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                } else {
                    this.currentRecipientName = null;
                }
            }
        }, true); // capture phase to ensure we run before modal logic
    }

    /**
     * Clears cached recipient name when navigating to a new URL (SPA behavior).
     */
    private monitorUrlChanges() {
        const checkUrl = () => {
            if (location.href !== this.lastUrl) {
                this.lastUrl = location.href;
                this.currentRecipientName = null;
            }
        };
        // Observe history API changes via popstate
        window.addEventListener('popstate', checkUrl);
        // Periodic fallback (some SPA frameworks use pushState without events we can catch)
        setInterval(checkUrl, 1000);
    }

    /**
     * Injects post reply buttons for LinkedIn comment areas
     */
    private injectPostReplyButtons(commentElement: HTMLElement) {
        // Prevent duplicate injection
        if (this.injectedCommentAreas.has(commentElement)) {
            return;
        }

        // Find the appropriate container to insert buttons ABOVE the comment area
        let insertionTarget: HTMLElement | null = null;

        // Strategy: Find a parent container that we can insert buttons above
        // We want to avoid inserting inside the comment editor itself

        // Strategy: Find the ENTIRE comment section container, not just the input area
        // Based on the HTML you provided, we need to find the parent of the comment input area

        // Start from the focused element and walk up to find the full comment section
        let current = commentElement;
        while (current && current !== document.body) {
            // Look for the parent container that contains both the comment input and other comment elements
            // This should be a div that contains the comment input area but is not the input itself
            const parent = current.parentElement;
            if (parent) {
                // Check if this parent contains comment-related elements and is a good insertion target
                const hasCommentStructure =
                    parent.querySelector('[aria-label*="comment"]') ||
                    parent.querySelector('[data-testid*="comment"]') ||
                    parent.classList.toString().includes('comment') ||
                    parent.querySelector('.reply-bot-container'); // Already has our buttons

                // Make sure it's not too small (avoid text spans) and not the input itself
                if (hasCommentStructure &&
                    parent.offsetHeight > 30 &&
                    !parent.isContentEditable &&
                    parent.tagName === 'DIV') {

                    // Walk up one more level to get outside the immediate comment area
                    const grandParent = parent.parentElement;
                    if (grandParent && grandParent.offsetHeight > parent.offsetHeight) {
                        insertionTarget = parent;
                        break;
                    }
                }
            }
            current = current.parentElement as HTMLElement;
        }

        // Fallback: if we didn't find a good target, find the nearest block-level container
        if (!insertionTarget) {
            current = commentElement;
            let depth = 0;
            while (current && current !== document.body && depth < 8) {
                if (current.tagName === 'DIV' &&
                    current.offsetHeight > 50 &&
                    !current.isContentEditable) {
                    insertionTarget = current;
                    break;
                }
                current = current.parentElement as HTMLElement;
                depth++;
            }
        }

        if (!insertionTarget) {
            console.error('ChatterBoxLinkedIn: Could not find suitable insertion target');
            return;
        }

        // The input element is the one that was focused (commentElement)
        const inputElement = commentElement;

        // Check if we've already added buttons near this area (more thorough check)
        let existingButtons = insertionTarget.parentElement?.querySelector('.reply-bot-container.linkedin-post-replies');
        if (!existingButtons) {
            // Also check if buttons exist as a sibling or in nearby area
            existingButtons = insertionTarget.querySelector('.reply-bot-container.linkedin-post-replies');
        }
        if (!existingButtons && insertionTarget.parentElement) {
            // Check siblings
            const siblings = insertionTarget.parentElement.children;
            for (let i = 0; i < siblings.length; i++) {
                if (siblings[i].classList.contains('reply-bot-container')) {
                    existingButtons = siblings[i] as HTMLElement;
                    break;
                }
            }
        }

        if (existingButtons) {
            this.injectedCommentAreas.add(commentElement);
            return;
        }

        // Create button container
        const container = document.createElement('div');
        container.className = 'reply-bot-container linkedin-post-replies';
        container.style.cssText = `
            margin: 8px 0 4px 0; 
            padding: 0; 
            position: relative;
            z-index: 10;
            max-width: fit-content;
        `;
        container.innerHTML = '<div class="reply-bot-buttons"></div>';

        const buttonsDiv = container.querySelector('.reply-bot-buttons') as HTMLElement;
        buttonsDiv.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap; align-items: center; justify-content: flex-start;';

        this.postReplyTemplates.forEach((template) => {
            const button = this.createPostReplyButton(template, inputElement);
            buttonsDiv.appendChild(button);
        });

        // Insert the button container ABOVE the insertion target
        let inserted = false;

        if (insertionTarget.parentElement) {
            // Insert above the comment section
            insertionTarget.parentElement.insertBefore(container, insertionTarget);
            inserted = true;
        } else {
            // Fallback: try to insert at the top of the insertion target
            insertionTarget.insertBefore(container, insertionTarget.firstChild);
            inserted = true;
        }

        if (inserted) {
            this.injectedCommentAreas.add(commentElement);
        }
    }

    /**
     * Creates a template button for post replies
     */
    private createPostReplyButton(template: ReplyTemplate, inputElement: HTMLElement): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'reply-bot-button linkedin-post';
        button.textContent = `${template.icon || ''} ${template.name}`.trim();
        button.title = `Generate ${template.name} comment`;

        // Add inline styles with bigger, cleaner design
        button.style.cssText = `
            background: #0073b1; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 16px; 
            cursor: pointer; 
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            margin: 0 2px;
        `;

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.generatePostReply(e, template, inputElement);
        });

        // Add hover effect
        button.addEventListener('mouseenter', () => {
            button.style.background = '#005885';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#0073b1';
        });

        return button;
    }

    /**
     * Generates AI-powered post reply similar to X implementation
     */
    private async generatePostReply(event: MouseEvent, template: ReplyTemplate, inputElement: HTMLElement) {
        const button = event.currentTarget as HTMLButtonElement;
        const originalText = button.textContent;

        // Check if chrome APIs are available before proceeding
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            alert('Extension error: Please refresh the page and try again.');
            return;
        }

        try {
            // Show loading state
            button.textContent = '⏳ Generating...';
            button.disabled = true;

            // Get the post content and container context
            const postContext = this.getLinkedInPostContext(inputElement);

            if (!postContext.content) {
                throw new Error('Could not find post content to reply to. Try clicking directly in the comment box first.');
            }

            console.log('ChatterBox LinkedIn: Generating reply for post:', postContext.content.substring(0, 100) + '...');

            // Send request to background script
            const request = {
                tweetContent: postContext.content, // Using same interface as X for now
                template
            };

            const response = await this.sendMessageWithRetry({
                action: 'generateReply',
                data: request
            });

            if (!response) {
                throw new Error('No response from extension. Please refresh the page and try again.');
            }

            if (response.error) {
                throw new Error(response.error);
            }

            if (!response.reply || response.reply.trim() === '') {
                throw new Error('Generated reply is empty. Please try again.');
            }

            console.log('ChatterBox LinkedIn: Generated reply:', response.reply);

            // Insert the generated reply with post context for accurate input finding
            await this.insertPostReply(response.reply, inputElement, postContext.container);

            // Reset button
            button.textContent = originalText;
            button.disabled = false;

        } catch (error) {
            console.error('Error generating LinkedIn post reply:', error);

            let errorMessage = 'Failed to generate reply';
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            alert(`ChatterBox Error: ${errorMessage}`);

            // Reset button
            if (button) {
                button.textContent = originalText;
                button.disabled = false;
            }
        }
    }

    /**
     * Inserts the generated reply into LinkedIn comment input using robust typing simulation
     */
    private async insertPostReply(reply: string, inputElement: HTMLElement, postContainer?: HTMLElement | null) {
        if (!reply || reply.trim() === '') {
            console.error('LinkedIn: Cannot insert empty reply');
            return;
        }

        // Get typing speed from storage
        const { advancedSettings } = await chrome.storage.sync.get(['advancedSettings']);
        const typingSpeed = advancedSettings?.typingSpeed ?? 5;

        // Helper to check if an element is the editable LinkedIn comment input
        const isEditableCommentInput = (el: Element | null): el is HTMLElement => {
            return !!el && el instanceof HTMLElement && (
                (el.isContentEditable && (
                    el.getAttribute('aria-label')?.toLowerCase().includes('comment') ||
                    el.classList.contains('tiptap') ||
                    el.classList.contains('ProseMirror') ||
                    el.closest('[aria-label*="comment"]') !== null
                )) ||
                (el instanceof HTMLTextAreaElement && el.placeholder?.toLowerCase().includes('comment'))
            );
        };

        // Helper to find the active editable element, as it may be replaced by LinkedIn's framework
        const findEditableInput = (): HTMLElement | null => {
            // 1. If the original inputElement is still connected, prefer it
            if (inputElement.isConnected && isEditableCommentInput(inputElement)) {
                return inputElement;
            }

            // 2. If we have post container context, look for comment inputs within that specific post
            if (postContainer) {
                const selectors = [
                    '[aria-label="Text editor for creating comment"]',
                    '.tiptap.ProseMirror[contenteditable="true"]',
                    '[data-testid="ui-core-tiptap-text-editor-wrapper"] [contenteditable="true"]',
                    'textarea[placeholder*="comment" i]',
                    '[contenteditable="true"][aria-label*="comment" i]'
                ];

                for (const selector of selectors) {
                    const candidate = postContainer.querySelector<HTMLElement>(selector);
                    if (candidate && isEditableCommentInput(candidate)) {
                        return candidate;
                    }
                }
            }

            // 3. If the currently focused element is a comment input, use that (but only if it's in the right post)
            if (isEditableCommentInput(document.activeElement)) {
                const activeElement = document.activeElement as HTMLElement;
                // If we have post container context, verify the focused element is within it
                if (postContainer) {
                    if (postContainer.contains(activeElement)) {
                        return activeElement;
                    }
                } else {
                    // No post container context, use focused element as fallback
                    return activeElement;
                }
            }

            // 4. Fallback: Look for LinkedIn comment inputs globally (least preferred)
            if (!postContainer) {
                const selectors = [
                    '[aria-label="Text editor for creating comment"]',
                    '.tiptap.ProseMirror[contenteditable="true"]',
                    '[data-testid="ui-core-tiptap-text-editor-wrapper"] [contenteditable="true"]',
                    'textarea[placeholder*="comment" i]',
                    '[contenteditable="true"][aria-label*="comment" i]'
                ];

                for (const selector of selectors) {
                    const candidate = document.querySelector<HTMLElement>(selector);
                    if (candidate && isEditableCommentInput(candidate)) {
                        return candidate;
                    }
                }
            }

            return null;
        };

        let editableElement = findEditableInput();

        if (!editableElement) {
            console.warn('LinkedIn: Editable element was disconnected during typing, attempting to recover.');
            // Try once more after a short wait in case LinkedIn is re-rendering
            await new Promise(r => setTimeout(r, 50));
            editableElement = findEditableInput();
        }

        if (!editableElement) {
            console.warn('LinkedIn: Could not recover editable element. Aborting reply typing.');
            alert('LinkedIn: Could not continue typing because the comment box disappeared.');
            return;
        }

        // Focus and clear existing content
        editableElement.focus();

        if (editableElement.isContentEditable) {
            // Clear contenteditable element
            if ((editableElement.textContent || '').trim() !== '') {
                editableElement.textContent = '';
                // Alternative clearing method for robust clearing
                if (document.getSelection) {
                    const selection = document.getSelection();
                    if (selection) {
                        selection.selectAllChildren(editableElement);
                        selection.deleteFromDocument();
                    }
                }
            }

            // Type each character with robust element re-discovery
            for (const char of reply) {
                // Re-find the element on each iteration to ensure we have a fresh reference
                editableElement = findEditableInput();
                if (!editableElement) {
                    console.warn('LinkedIn: Editable element was disconnected during typing.');
                    alert('LinkedIn: Reply cancelled because the comment box was closed.');
                    return;
                }

                editableElement.focus();

                // Use document.execCommand for better LinkedIn compatibility
                document.execCommand('insertText', false, char);

                // Dispatch input event for LinkedIn's event handlers
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
        } else if (editableElement instanceof HTMLTextAreaElement || editableElement instanceof HTMLInputElement) {
            // Handle textarea/input elements
            editableElement.value = '';

            for (const char of reply) {
                // Re-find the element on each iteration
                editableElement = findEditableInput();
                if (!editableElement || !(editableElement instanceof HTMLTextAreaElement || editableElement instanceof HTMLInputElement)) {
                    console.warn('LinkedIn: Text input element was disconnected during typing.');
                    alert('LinkedIn: Reply cancelled because the text input was closed.');
                    return;
                }

                editableElement.focus();
                editableElement.value += char;

                // Dispatch input event
                editableElement.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true
                }));

                if (typingSpeed > 0) {
                    await new Promise(resolve => setTimeout(resolve, typingSpeed));
                }
            }
        }

        // After typing, re-find the element one last time for final operations
        editableElement = findEditableInput();
        if (!editableElement) {
            return; // Silently exit if element is gone
        }

        // Dispatch a final input event to trigger any logic that depends on the full text
        editableElement.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
        }));

        // Set cursor to the end for contenteditable elements
        if (editableElement.isContentEditable) {
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

    /**
     * Gets the LinkedIn post context (content + container) we're commenting on
     */
    private getLinkedInPostContext(inputElement?: HTMLElement): { content: string | null; container: HTMLElement | null } {
        // If we have the input element context, try to find the specific post being replied to
        if (inputElement) {
            // Walk up the DOM from the comment input to find the post container
            let current = inputElement;
            let postContainer: HTMLElement | null = null;

            // Look for the parent post container (similar to how X/Twitter finds the article)
            while (current && current !== document.body) {
                // LinkedIn post containers - check multiple patterns used by LinkedIn
                const isPostContainer = (
                    // Role-based identification
                    current.getAttribute('role') === 'listitem' ||

                    // Class-based identification  
                    current.classList.contains('feed-shared-update-v2') ||
                    current.classList.contains('feed-shared-update') ||
                    current.classList.contains('occludable-update') ||
                    current.classList.contains('feed-shared-activity') ||

                    // Attribute-based identification
                    current.hasAttribute('componentkey') ||
                    current.getAttribute('data-view-name') === 'main-feed-activity-card' ||
                    current.getAttribute('data-view-name') === 'feed-shared-update' ||
                    current.hasAttribute('data-urn') ||

                    // Structure-based identification (must be a container with substantial size)
                    (current.tagName === 'DIV' &&
                        current.offsetHeight > 200 &&
                        current.querySelector('[data-view-name="feed-commentary"]') !== null)
                );

                if (isPostContainer) {
                    postContainer = current;
                    break;
                }
                current = current.parentElement as HTMLElement;
            }

            // If we found the post container, search for content within it ONLY
            if (postContainer) {
                // More specific and ordered content selectors - prioritize main content areas
                const contentSelectors = [
                    // Primary content areas (most specific first)
                    '[data-view-name="feed-commentary"] .break-words',
                    '[data-testid="expandable-text-box"]',
                    '.feed-shared-text__text-view .break-words',
                    '.feed-shared-article__description .break-words',

                    // Secondary content areas
                    '[data-view-name="feed-commentary"]',
                    '.feed-shared-text__text-view',
                    '.feed-shared-text',
                    '.feed-shared-article__description',

                    // Fallback broader selectors within the post container
                    '.break-words',
                    'span[dir="ltr"]'
                ];

                for (const selector of contentSelectors) {
                    // Search ONLY within the identified post container
                    const elements = postContainer.querySelectorAll(selector);

                    for (let i = 0; i < elements.length; i++) {
                        const element = elements[i];
                        const text = element.textContent?.trim();

                        // More rigorous content validation
                        if (text &&
                            text.length > 20 && // Minimum content length
                            text.length < 5000 && // Maximum to avoid huge content blocks
                            // Filter out obvious UI elements and interactions
                            !text.toLowerCase().includes('comment') &&
                            !text.toLowerCase().includes('like') &&
                            !text.toLowerCase().includes('share') &&
                            !text.toLowerCase().includes('repost') &&
                            !text.toLowerCase().includes('follow') &&
                            !text.toLowerCase().includes('connect') &&
                            !text.toLowerCase().includes('view profile') &&
                            !text.toLowerCase().includes('see more') &&
                            !text.toLowerCase().includes('see less') &&
                            !text.match(/^\d+\s*(like|comment|share|repost)/i) &&
                            !text.match(/^(like|comment|share|repost|send)\s*$/i) &&
                            // Filter out pure navigation/UI text
                            !text.match(/^(•|·|\|)\s*/) &&
                            // Ensure it has some meaningful content (letters/words)
                            text.match(/[a-zA-Z]{3,}/)) {

                            return { content: text, container: postContainer };
                        }
                    }
                }

                console.warn('ChatterBox LinkedIn: Post container found but no valid content detected');
                // If we found the container but no good content, don't fall back to global search
                // This prevents grabbing content from other posts
                return { content: null, container: postContainer };
            } else {
                console.warn('ChatterBox LinkedIn: Could not find post container for input element');
            }
        } else {
            console.warn('ChatterBox LinkedIn: No input element provided for context');
        }

        // Only use global search as absolute fallback when no input element context is available
        // This should rarely be used in practice
        console.log('ChatterBox LinkedIn: Falling back to global content search (less reliable)');
        const globalSelectors = [
            '[data-view-name="feed-commentary"] .break-words',
            '[data-testid="expandable-text-box"]',
            '.feed-shared-text__text-view .break-words'
        ];

        for (const selector of globalSelectors) {
            const elements = document.querySelectorAll(selector);

            // Only take the first element to minimize risk of wrong content
            if (elements.length > 0) {
                const element = elements[0];
                const text = element.textContent?.trim();

                if (text &&
                    text.length > 20 &&
                    text.length < 5000 &&
                    !text.toLowerCase().includes('comment') &&
                    !text.toLowerCase().includes('like') &&
                    !text.toLowerCase().includes('share') &&
                    text.match(/[a-zA-Z]{3,}/)) {

                    console.log('ChatterBox LinkedIn: Using global fallback content:', text.substring(0, 100) + '...');
                    return { content: text, container: null };
                }
            }
        }

        console.error('ChatterBox LinkedIn: No valid post content found');
        return { content: null, container: null };
    }


    /**
     * Sends message to background script with retry logic
     */
    private async sendMessageWithRetry(request: any, maxRetries = 3, delayMs = 200): Promise<any> {
        // Check if chrome.runtime is available
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
            throw new Error('Extension context is not available. Please refresh the page and try again.');
        }

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await chrome.runtime.sendMessage(request);

                // Check if we got a valid response
                if (response === undefined && attempt < maxRetries - 1) {
                    console.warn(`ChatterBox LinkedIn: Got undefined response, retrying... (attempt ${attempt + 1})`);
                    await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
                    continue;
                }

                return response;
            } catch (error) {
                console.warn(`ChatterBox LinkedIn: sendMessage attempt ${attempt + 1} failed:`, error);

                if (error instanceof Error) {
                    // Check for extension context invalidation
                    if (error.message.includes('Extension context invalidated') ||
                        error.message.includes('message port closed') ||
                        error.message.includes('Could not establish connection')) {

                        if (attempt === maxRetries - 1) {
                            throw new Error('Extension was reloaded or disconnected. Please refresh the page and try again.');
                        }

                        await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
                        continue;
                    }
                }

                throw error;
            }
        }
        throw new Error('Failed to communicate with extension background script after multiple attempts.');
    }
}

// Initialize the bot once the page is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatterBoxLinkedIn();
    });
} else {
    new ChatterBoxLinkedIn();
} 