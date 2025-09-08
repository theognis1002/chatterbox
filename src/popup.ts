// Popup script for ChatterBox
import { loadDefaultSystemPrompt } from './utils/promptLoader';
import { DEFAULT_TEMPLATES, DEFAULT_LINKEDIN_POST_TEMPLATES, ReplyTemplate } from './types';

interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
    typingSpeed: number;
}

const DEFAULT_SETTINGS: AdvancedSettings = {
    temperature: 0.7,
    maxTokens: 50,
    presencePenalty: 0.6,
    frequencyPenalty: 0.3,
    typingSpeed: 5
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
    private generalTab!: HTMLButtonElement;
    private templatesTab!: HTMLButtonElement;
    private generalContent!: HTMLElement;
    private templatesContent!: HTMLElement;
    private templatesXList!: HTMLElement;
    private addXTemplateButton!: HTMLButtonElement;
    private resetXTemplatesButton!: HTMLButtonElement;
    private xTemplates: ReplyTemplate[] = [];
    private templatesLinkedInList!: HTMLElement;
    private addLinkedInTemplateButton!: HTMLButtonElement;
    private resetLinkedInTemplatesButton!: HTMLButtonElement;
    private linkedinTemplates: ReplyTemplate[] = [];
    private templatesLinkedInPostList!: HTMLElement;
    private addLinkedInPostTemplateButton!: HTMLButtonElement;
    private resetLinkedInPostTemplatesButton!: HTMLButtonElement;
    private linkedinPostTemplates: ReplyTemplate[] = [];
    private typingSpeedInput!: HTMLInputElement;
    private xTemplatesSubTab!: HTMLButtonElement;
    private linkedinTemplatesSubTab!: HTMLButtonElement;
    private linkedinPostTemplatesSubTab!: HTMLButtonElement;
    private templatesXContent!: HTMLElement;
    private templatesLinkedInContent!: HTMLElement;
    private templatesLinkedInPostContent!: HTMLElement;

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
        this.generalTab = document.getElementById('generalTab') as HTMLButtonElement;
        this.templatesTab = document.getElementById('templatesTab') as HTMLButtonElement;
        this.generalContent = document.getElementById('generalContent') as HTMLElement;
        this.templatesContent = document.getElementById('templatesContent') as HTMLElement;
        this.templatesXList = document.getElementById('templatesXList') as HTMLElement;
        this.addXTemplateButton = document.getElementById('addXTemplateButton') as HTMLButtonElement;
        this.resetXTemplatesButton = document.getElementById('resetXTemplatesButton') as HTMLButtonElement;
        this.templatesLinkedInList = document.getElementById('templatesLinkedInList') as HTMLElement;
        this.addLinkedInTemplateButton = document.getElementById('addLinkedInTemplateButton') as HTMLButtonElement;
        this.resetLinkedInTemplatesButton = document.getElementById('resetLinkedInTemplatesButton') as HTMLButtonElement;
        this.templatesLinkedInPostList = document.getElementById('templatesLinkedInPostList') as HTMLElement;
        this.addLinkedInPostTemplateButton = document.getElementById('addLinkedInPostTemplateButton') as HTMLButtonElement;
        this.resetLinkedInPostTemplatesButton = document.getElementById('resetLinkedInPostTemplatesButton') as HTMLButtonElement;
        this.xTemplatesSubTab = document.getElementById('xTemplatesSubTab') as HTMLButtonElement;
        this.linkedinTemplatesSubTab = document.getElementById('linkedinTemplatesSubTab') as HTMLButtonElement;
        this.linkedinPostTemplatesSubTab = document.getElementById('linkedinPostTemplatesSubTab') as HTMLButtonElement;
        this.typingSpeedInput = document.getElementById('typingSpeed') as HTMLInputElement;
        this.templatesXContent = document.getElementById('templatesXContent') as HTMLElement;
        this.templatesLinkedInContent = document.getElementById('templatesLinkedInContent') as HTMLElement;
        this.templatesLinkedInPostContent = document.getElementById('templatesLinkedInPostContent') as HTMLElement;
    }

    private async init() {
        // Load the default prompt
        this.defaultSystemPrompt = await loadDefaultSystemPrompt();

        // Load existing settings
        await this.loadSettings();

        // Set up event listeners
        this.setupEventListeners();

        // Load and render templates
        await this.loadTemplates();
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

        // Tab switching
        this.generalTab.addEventListener('click', () => this.switchTab('general'));
        this.templatesTab.addEventListener('click', () => this.switchTab('templates'));

        // Sub-tab switching within Templates tab
        this.xTemplatesSubTab.addEventListener('click', () => this.switchTemplatesSubTab('x'));
        this.linkedinTemplatesSubTab.addEventListener('click', () => this.switchTemplatesSubTab('linkedin'));
        this.linkedinPostTemplatesSubTab.addEventListener('click', () => this.switchTemplatesSubTab('linkedinPost'));

        // Template management for X
        this.addXTemplateButton.addEventListener('click', () => this.addTemplate('x'));
        this.resetXTemplatesButton.addEventListener('click', () => this.resetTemplates('x'));

        // Template management for LinkedIn
        this.addLinkedInTemplateButton.addEventListener('click', () => this.addTemplate('linkedin'));
        this.resetLinkedInTemplatesButton.addEventListener('click', () => this.resetTemplates('linkedin'));

        // Template management for LinkedIn Posts
        this.addLinkedInPostTemplateButton.addEventListener('click', () => this.addTemplate('linkedinPost'));
        this.resetLinkedInPostTemplatesButton.addEventListener('click', () => this.resetTemplates('linkedinPost'));

        // Advanced settings value display updates
        const temperatureValue = document.getElementById('temperatureValue');
        const presencePenaltyValue = document.getElementById('presencePenaltyValue');
        const frequencyPenaltyValue = document.getElementById('frequencyPenaltyValue');
        const typingSpeedValue = document.getElementById('typingSpeedValue');

        this.temperatureInput.addEventListener('input', () => {
            temperatureValue!.textContent = this.temperatureInput.value;
        });

        this.presencePenaltyInput.addEventListener('input', () => {
            presencePenaltyValue!.textContent = this.presencePenaltyInput.value;
        });

        this.frequencyPenaltyInput.addEventListener('input', () => {
            frequencyPenaltyValue!.textContent = this.frequencyPenaltyInput.value;
        });

        this.typingSpeedInput.addEventListener('input', () => {
            typingSpeedValue!.textContent = this.typingSpeedInput.value;
        });

        // Save settings when values change
        this.temperatureInput.addEventListener('change', () => this.saveAdvancedSettings());
        this.maxTokensInput.addEventListener('change', () => this.saveAdvancedSettings());
        this.presencePenaltyInput.addEventListener('change', () => this.saveAdvancedSettings());
        this.frequencyPenaltyInput.addEventListener('change', () => this.saveAdvancedSettings());
        this.typingSpeedInput.addEventListener('change', () => this.saveAdvancedSettings());

        // Reset advanced settings
        const resetAdvancedButton = document.getElementById('resetAdvancedButton');
        resetAdvancedButton?.addEventListener('click', () => this.resetAdvancedSettings());
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
            this.typingSpeedInput.value = settings.typingSpeed.toString();

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
                frequencyPenalty: parseFloat(this.frequencyPenaltyInput.value),
                typingSpeed: parseFloat(this.typingSpeedInput.value)
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
        this.typingSpeedInput.value = DEFAULT_SETTINGS.typingSpeed.toString();
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

    private switchTab(tab: 'general' | 'templates') {
        // Update tab buttons
        this.generalTab.classList.toggle('active', tab === 'general');
        this.templatesTab.classList.toggle('active', tab === 'templates');

        // Update content visibility
        this.generalContent.classList.toggle('active', tab === 'general');
        this.templatesContent.classList.toggle('active', tab === 'templates');
    }

    private async loadTemplates() {
        try {
            const result = await chrome.storage.sync.get(['templates', 'linkedinTemplates', 'linkedinPostTemplates']);
            this.xTemplates = result.templates || [...DEFAULT_TEMPLATES];

            this.linkedinTemplates = result.linkedinTemplates || [
                {
                    id: 'connect1',
                    name: 'Message #1',
                    prompt: 'Hi {name}, I came across your profile and would love to connect to share insights and opportunities.',
                    icon: '🔗'
                },
                {
                    id: 'connect2',
                    name: 'Message #2',
                    prompt: 'Hello {name}! I found your work fascinating and would be happy to connect and keep in touch.',
                    icon: '🔗'
                }
            ];

            this.linkedinPostTemplates = result.linkedinPostTemplates || [...DEFAULT_LINKEDIN_POST_TEMPLATES];

            this.renderTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    private renderTemplates() {
        // Render X templates
        this.templatesXList.innerHTML = '';
        this.xTemplates.forEach((template, index) => {
            const templateEl = this.createTemplateElement(template, index, 'x');
            this.templatesXList.appendChild(templateEl);
        });

        // Render LinkedIn templates
        this.templatesLinkedInList.innerHTML = '';
        this.linkedinTemplates.forEach((template, index) => {
            const templateEl = this.createTemplateElement(template, index, 'linkedin');
            this.templatesLinkedInList.appendChild(templateEl);
        });

        // Render LinkedIn Post templates
        this.templatesLinkedInPostList.innerHTML = '';
        this.linkedinPostTemplates.forEach((template, index) => {
            const templateEl = this.createTemplateElement(template, index, 'linkedinPost');
            this.templatesLinkedInPostList.appendChild(templateEl);
        });
    }

    private createTemplateElement(template: ReplyTemplate, index: number, platform: 'x' | 'linkedin' | 'linkedinPost'): HTMLElement {
        const div = document.createElement('div');
        div.className = 'template-item';
        div.innerHTML = `
            <div class="template-header">
                <div class="template-name">
                    <span class="template-icon">${template.icon || '📝'}</span>
                    <span>${template.name}</span>
                </div>
                <div class="template-actions">
                    <button class="template-action-button edit">Edit</button>
                    <button class="template-action-button delete">Delete</button>
                </div>
            </div>
            <div class="template-fields" style="display: none;">
                <div class="template-field">
                    <label>Name:</label>
                    <input type="text" class="template-name-input" value="${template.name}">
                </div>
                <div class="template-field">
                    <label>Icon:</label>
                    <input type="text" class="template-icon-input" value="${template.icon || ''}">
                </div>
                <div class="template-field">
                    <label>Prompt:</label>
                    <textarea class="template-prompt-input">${template.prompt}</textarea>
                </div>
                <button class="template-action-button save">Save Changes</button>
            </div>
        `;

        // Add event listeners
        const editButton = div.querySelector('.edit') as HTMLButtonElement;
        const deleteButton = div.querySelector('.delete') as HTMLButtonElement;
        const saveButton = div.querySelector('.save') as HTMLButtonElement;
        const fields = div.querySelector('.template-fields') as HTMLElement;

        editButton.addEventListener('click', () => {
            fields.style.display = fields.style.display === 'none' ? 'flex' : 'none';
        });

        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this template?')) {
                this.deleteTemplate(index, platform);
            }
        });

        saveButton.addEventListener('click', () => {
            const nameInput = div.querySelector('.template-name-input') as HTMLInputElement;
            const iconInput = div.querySelector('.template-icon-input') as HTMLInputElement;
            const promptInput = div.querySelector('.template-prompt-input') as HTMLTextAreaElement;

            this.updateTemplate(index, {
                ...template,
                name: nameInput.value,
                icon: iconInput.value,
                prompt: promptInput.value
            }, platform);

            fields.style.display = 'none';
        });

        return div;
    }

    private async updateTemplate(index: number, template: ReplyTemplate, platform: 'x' | 'linkedin' | 'linkedinPost') {
        if (platform === 'x') {
            this.xTemplates[index] = template;
        } else if (platform === 'linkedin') {
            this.linkedinTemplates[index] = template;
        } else if (platform === 'linkedinPost') {
            this.linkedinPostTemplates[index] = template;
        }
        await this.saveTemplates();
        this.renderTemplates();
    }

    private async deleteTemplate(index: number, platform: 'x' | 'linkedin' | 'linkedinPost') {
        if (platform === 'x') {
            this.xTemplates.splice(index, 1);
        } else if (platform === 'linkedin') {
            this.linkedinTemplates.splice(index, 1);
        } else if (platform === 'linkedinPost') {
            this.linkedinPostTemplates.splice(index, 1);
        }
        await this.saveTemplates();
        this.renderTemplates();
    }

    private async addTemplate(platform: 'x' | 'linkedin' | 'linkedinPost') {
        const newTemplate: ReplyTemplate = {
            id: `custom-${Date.now()}`,
            name: platform === 'x' ? 'New Template' : platform === 'linkedin' ? 'New Message' : 'New Post Template',
            prompt: platform === 'x' ? 'Enter your custom prompt here' : platform === 'linkedin' ? 'Enter your message here' : 'Enter your LinkedIn post comment prompt here',
            icon: platform === 'x' ? '📝' : platform === 'linkedin' ? '🔗' : '💼'
        };

        if (platform === 'x') {
            this.xTemplates.push(newTemplate);
        } else if (platform === 'linkedin') {
            this.linkedinTemplates.push(newTemplate);
        } else if (platform === 'linkedinPost') {
            this.linkedinPostTemplates.push(newTemplate);
        }

        await this.saveTemplates();
        this.renderTemplates();

        // Scroll to the new template list bottom
        let listEl: HTMLElement;
        if (platform === 'x') {
            listEl = this.templatesXList;
        } else if (platform === 'linkedin') {
            listEl = this.templatesLinkedInList;
        } else {
            listEl = this.templatesLinkedInPostList;
        }
        listEl.scrollTop = listEl.scrollHeight;
    }

    private async resetTemplates(platform: 'x' | 'linkedin' | 'linkedinPost') {
        if (confirm('Are you sure you want to reset templates to default?')) {
            if (platform === 'x') {
                this.xTemplates = [...DEFAULT_TEMPLATES];
            } else if (platform === 'linkedin') {
                this.linkedinTemplates = [
                    {
                        id: 'connect1',
                        name: 'Share Insights',
                        prompt: 'Hi {name}, I came across your profile and would love to connect to share insights and opportunities.',
                        icon: '👋'
                    },
                    {
                        id: 'connect2',
                        name: 'Work Interest',
                        prompt: 'Hello {name}! I found your work fascinating and would be happy to connect and keep in touch.',
                        icon: '🔗'
                    }
                ];
            } else if (platform === 'linkedinPost') {
                this.linkedinPostTemplates = [...DEFAULT_LINKEDIN_POST_TEMPLATES];
            }
            await this.saveTemplates();
            this.renderTemplates();
        }
    }

    private async saveTemplates() {
        try {
            await chrome.storage.sync.set({
                templates: this.xTemplates,
                linkedinTemplates: this.linkedinTemplates,
                linkedinPostTemplates: this.linkedinPostTemplates
            });
        } catch (error) {
            console.error('Error saving templates:', error);
            this.showStatus('Error saving templates', 'error');
        }
    }

    private async saveAdvancedSettings() {
        const advancedSettings = {
            temperature: parseFloat(this.temperatureInput.value),
            maxTokens: parseInt(this.maxTokensInput.value),
            presencePenalty: parseFloat(this.presencePenaltyInput.value),
            frequencyPenalty: parseFloat(this.frequencyPenaltyInput.value),
            typingSpeed: parseInt(this.typingSpeedInput.value)
        };

        await chrome.storage.sync.set({ advancedSettings });
        this.showStatus('Settings saved!', 'success');
    }

    private switchTemplatesSubTab(tab: 'x' | 'linkedin' | 'linkedinPost') {
        // Update tab buttons
        this.xTemplatesSubTab.classList.toggle('active', tab === 'x');
        this.linkedinTemplatesSubTab.classList.toggle('active', tab === 'linkedin');
        this.linkedinPostTemplatesSubTab.classList.toggle('active', tab === 'linkedinPost');

        // Update content visibility
        this.templatesXContent.style.display = tab === 'x' ? 'block' : 'none';
        this.templatesLinkedInContent.style.display = tab === 'linkedin' ? 'block' : 'none';
        this.templatesLinkedInPostContent.style.display = tab === 'linkedinPost' ? 'block' : 'none';
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    new PopupManager();
}); 