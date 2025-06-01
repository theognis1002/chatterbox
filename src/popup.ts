// Popup script for Twitter Reply Bot

class PopupManager {
    private apiKeyInput: HTMLInputElement;
    private saveButton: HTMLButtonElement;
    private statusMessage: HTMLElement;

    constructor() {
        this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
        this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
        this.statusMessage = document.getElementById('statusMessage') as HTMLElement;

        this.init();
    }

    private async init() {
        // Load existing API key
        await this.loadApiKey();

        // Set up event listeners
        this.saveButton.addEventListener('click', () => this.saveApiKey());
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
    }

    private async loadApiKey() {
        try {
            const result = await chrome.storage.sync.get(['apiKey']);
            if (result.apiKey) {
                this.apiKeyInput.value = result.apiKey;
            }
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }

    private async saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();

        if (!apiKey) {
            this.showStatus('Please enter an API key', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showStatus('Invalid API key format', 'error');
            return;
        }

        try {
            this.saveButton.disabled = true;
            this.saveButton.textContent = 'Saving...';

            await chrome.storage.sync.set({ apiKey });

            this.showStatus('API key saved successfully!', 'success');

            // Reset button after 1 second
            setTimeout(() => {
                this.saveButton.disabled = false;
                this.saveButton.textContent = 'Save API Key';
            }, 1000);

        } catch (error) {
            console.error('Error saving API key:', error);
            this.showStatus('Error saving API key', 'error');
            this.saveButton.disabled = false;
            this.saveButton.textContent = 'Save API Key';
        }
    }

    private showStatus(message: string, type: 'success' | 'error') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';

        // Hide after 3 seconds
        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 3000);
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
}); 