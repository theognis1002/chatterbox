// Popup script for Twitter Reply Bot
import { loadDefaultSystemPrompt } from './utils/promptLoader';

interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
}

const DEFAULT_SETTINGS: AdvancedSettings = {
    temperature: 0.7,
    maxTokens: 50,
    presencePenalty: 0.6,
    frequencyPenalty: 0.3
};

class PopupManager {
    private apiKeyInput!: HTMLInputElement;
    private saveButton!: HTMLButtonElement;
    private statusMessage!: HTMLElement;
    private modelSelect!: HTMLSelectElement;
    private systemPromptInput!: HTMLTextAreaElement;
    private resetPromptButton!: HTMLButtonElement;
    private advancedToggle!: HTMLButtonElement;
    private advancedContent!: HTMLElement;
    private temperatureInput!: HTMLInputElement;
    private temperatureValue!: HTMLElement;
    private maxTokensInput!: HTMLInputElement;
    private presencePenaltyInput!: HTMLInputElement;
    private presencePenaltyValue!: HTMLElement;
    private frequencyPenaltyInput!: HTMLInputElement;
    private frequencyPenaltyValue!: HTMLElement;
    private resetAdvancedButton!: HTMLButtonElement;
    private defaultSystemPrompt: string = 'Loading...';

    constructor() {
        this.initializeElements();
        this.init();
    }

    private initializeElements() {
        this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
        this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
        this.statusMessage = document.getElementById('statusMessage') as HTMLElement;
        this.modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
        this.systemPromptInput = document.getElementById('systemPrompt') as HTMLTextAreaElement;
        this.resetPromptButton = document.getElementById('resetPromptButton') as HTMLButtonElement;
        this.advancedToggle = document.getElementById('advancedToggle') as HTMLButtonElement;
        this.advancedContent = document.getElementById('advancedContent') as HTMLElement;
        this.temperatureInput = document.getElementById('temperature') as HTMLInputElement;
        this.temperatureValue = document.getElementById('temperatureValue') as HTMLElement;
        this.maxTokensInput = document.getElementById('maxTokens') as HTMLInputElement;
        this.presencePenaltyInput = document.getElementById('presencePenalty') as HTMLInputElement;
        this.presencePenaltyValue = document.getElementById('presencePenaltyValue') as HTMLElement;
        this.frequencyPenaltyInput = document.getElementById('frequencyPenalty') as HTMLInputElement;
        this.frequencyPenaltyValue = document.getElementById('frequencyPenaltyValue') as HTMLElement;
        this.resetAdvancedButton = document.getElementById('resetAdvancedButton') as HTMLButtonElement;
    }

    private async init() {
        // Load the default prompt
        this.defaultSystemPrompt = await loadDefaultSystemPrompt();

        // Load existing settings
        await this.loadSettings();

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.saveButton.addEventListener('click', () => this.saveSettings());
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveSettings();
            }
        });
        this.modelSelect.addEventListener('change', () => this.saveSettings());
        this.systemPromptInput.addEventListener('change', () => this.saveSettings());
        this.resetPromptButton.addEventListener('click', () => this.resetSystemPrompt());

        // Advanced settings listeners
        this.advancedToggle.addEventListener('click', () => this.toggleAdvancedSettings());
        this.temperatureInput.addEventListener('input', () => this.updateRangeValue('temperature'));
        this.presencePenaltyInput.addEventListener('input', () => this.updateRangeValue('presencePenalty'));
        this.frequencyPenaltyInput.addEventListener('input', () => this.updateRangeValue('frequencyPenalty'));
        this.resetAdvancedButton.addEventListener('click', () => this.resetAdvancedSettings());

        // Save on any advanced setting change
        const advancedInputs = [
            this.temperatureInput,
            this.maxTokensInput,
            this.presencePenaltyInput,
            this.frequencyPenaltyInput
        ];
        advancedInputs.forEach(input => {
            input.addEventListener('change', () => this.saveSettings());
        });
    }

    private async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'apiKey',
                'model',
                'systemPrompt',
                'advancedSettings'
            ]);

            if (result.apiKey) {
                this.apiKeyInput.value = result.apiKey;
            }
            if (result.model) {
                this.modelSelect.value = result.model;
            }
            this.systemPromptInput.value = result.systemPrompt || this.defaultSystemPrompt;

            // Load advanced settings
            const settings: AdvancedSettings = result.advancedSettings || DEFAULT_SETTINGS;
            this.temperatureInput.value = settings.temperature.toString();
            this.maxTokensInput.value = settings.maxTokens.toString();
            this.presencePenaltyInput.value = settings.presencePenalty.toString();
            this.frequencyPenaltyInput.value = settings.frequencyPenalty.toString();

            // Update range values
            this.updateAllRangeValues();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    private async saveSettings() {
        const apiKey = this.apiKeyInput.value.trim();
        const model = this.modelSelect.value;
        const systemPrompt = this.systemPromptInput.value.trim();

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

            const advancedSettings: AdvancedSettings = {
                temperature: parseFloat(this.temperatureInput.value),
                maxTokens: parseInt(this.maxTokensInput.value),
                presencePenalty: parseFloat(this.presencePenaltyInput.value),
                frequencyPenalty: parseFloat(this.frequencyPenaltyInput.value)
            };

            await chrome.storage.sync.set({
                apiKey,
                model,
                systemPrompt: systemPrompt || this.defaultSystemPrompt,
                advancedSettings
            });

            this.showStatus('Settings saved successfully!', 'success');

            setTimeout(() => {
                this.saveButton.disabled = false;
                this.saveButton.textContent = 'Save API Key';
            }, 1000);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
            this.saveButton.disabled = false;
            this.saveButton.textContent = 'Save API Key';
        }
    }

    private toggleAdvancedSettings() {
        const isExpanded = this.advancedContent.style.display !== 'none';
        this.advancedContent.style.display = isExpanded ? 'none' : 'block';
        this.advancedToggle.setAttribute('aria-expanded', (!isExpanded).toString());
    }

    private updateRangeValue(type: 'temperature' | 'presencePenalty' | 'frequencyPenalty') {
        const input = this[`${type}Input`] as HTMLInputElement;
        const value = this[`${type}Value`] as HTMLElement;
        value.textContent = input.value;
    }

    private updateAllRangeValues() {
        this.updateRangeValue('temperature');
        this.updateRangeValue('presencePenalty');
        this.updateRangeValue('frequencyPenalty');
    }

    private resetSystemPrompt() {
        this.systemPromptInput.value = this.defaultSystemPrompt;
        this.saveSettings();
    }

    private resetAdvancedSettings() {
        this.temperatureInput.value = DEFAULT_SETTINGS.temperature.toString();
        this.maxTokensInput.value = DEFAULT_SETTINGS.maxTokens.toString();
        this.presencePenaltyInput.value = DEFAULT_SETTINGS.presencePenalty.toString();
        this.frequencyPenaltyInput.value = DEFAULT_SETTINGS.frequencyPenalty.toString();
        this.updateAllRangeValues();
        this.saveSettings();
    }

    private showStatus(message: string, type: 'success' | 'error') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';

        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 3000);
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
}); 