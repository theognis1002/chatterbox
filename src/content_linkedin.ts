// Content script for Chatterbox (LinkedIn)
// Adds template buttons to the "Add a note" connection modal and post comment areas

import { DEFAULT_TEMPLATES, GenerateReplyRequest, GenerateReplyResponse, ReplyTemplate } from './types';

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

class ChatterboxLinkedIn {
    private templates: LinkedInTemplate[] = DEFAULT_LINKEDIN_TEMPLATES;
    private postReplyTemplates: ReplyTemplate[] = DEFAULT_TEMPLATES;
    private observer: MutationObserver | null = null;
    private injectedModals = new WeakSet<HTMLTextAreaElement>();
    private injectedCommentAreas = new WeakSet<HTMLElement>();
    private currentRecipientName: string | null = null;
    private lastUrl: string = location.href;

    constructor() {
        this.init();
    }

    private async init() {
        // Load custom LinkedIn templates stored under a dedicated key.
        const result = await chrome.storage.sync.get(['linkedinTemplates', 'templates']);
        if (result.linkedinTemplates && Array.isArray(result.linkedinTemplates)) {
            this.templates = result.linkedinTemplates;
        }
        // Load post reply templates (same as X/Twitter)
        if (result.templates && Array.isArray(result.templates)) {
            this.postReplyTemplates = result.templates;
        }

        this.captureRecipientNameOnClicks();
        this.monitorUrlChanges();
        this.startObserving();
        // Initial scan – in case modal or comment areas are already present when the script loads.
        this.scanNode(document.body);
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
        textareas.forEach((ta) => this.injectConnectionButtons(ta));

        // Also handle the case where the root itself is the textarea.
        if (root instanceof HTMLTextAreaElement && root.id === 'custom-message') {
            this.injectConnectionButtons(root);
        }

        // Look for post comment areas
        this.scanForCommentAreas(root);
    }

    /**
     * Scan for LinkedIn post comment areas where we should inject reply buttons
     */
    private scanForCommentAreas(root: HTMLElement) {
        // LinkedIn comment selectors - target various comment input patterns
        const commentSelectors = [
            '.comments-comment-box__form',
            '.comments-comment-box-comment__text-editor',
            '[data-test-id="comments-comment-texteditor"]',
            '.comments-comment-box textarea',
            '.comments-comment-box [contenteditable="true"]',
            'form[data-test-id="comment-form"]',
            '.comment-form',
            '[aria-label*="Add a comment"]',
            '[placeholder*="Add a comment"]'
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
}

// Initialize the bot once the page is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ChatterboxLinkedIn());
} else {
    new ChatterboxLinkedIn();
} 