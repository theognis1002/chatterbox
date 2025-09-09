// Popup script for ChatterBox
import { loadXSystemPrompt } from './utils/promptLoader';
import { DEFAULT_X_TEMPLATES, DEFAULT_LINKEDIN_POST_TEMPLATES, ReplyTemplate, OPENROUTER_MODELS, ModelOption } from './types';

interface AdvancedSettings {
    temperature: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
    typingSpeed: number;
}

const DEFAULT_SETTINGS: AdvancedSettings = {
    temperature: 0.0,
    maxTokens: 50,
    presencePenalty: 0.25,
    frequencyPenalty: 0.25,
    typingSpeed: 5
};

class PopupManager {
    private openrouterApiKeyInput!: HTMLInputElement;
    private saveButton!: HTMLButtonElement;
    private statusMessage!: HTMLElement;
    private modelSelect!: HTMLSelectElement;
    private modelDescription!: HTMLElement;

    // Tab elements
    private generalTab!: HTMLButtonElement;
    private xSettingsTab!: HTMLButtonElement;
    private linkedinSettingsTab!: HTMLButtonElement;
    private generalContent!: HTMLElement;
    private xSettingsContent!: HTMLElement;
    private linkedinSettingsContent!: HTMLElement;

    // X Settings
    private xSystemPromptInput!: HTMLTextAreaElement;
    private resetXPromptButton!: HTMLButtonElement;
    private xAdvancedToggle!: HTMLButtonElement;
    private xAdvancedContent!: HTMLElement;
    private xTemperatureInput!: HTMLInputElement;
    private xMaxTokensInput!: HTMLInputElement;
    private xPresencePenaltyInput!: HTMLInputElement;
    private xFrequencyPenaltyInput!: HTMLInputElement;
    private xTypingSpeedInput!: HTMLInputElement;
    private resetXAdvancedButton!: HTMLButtonElement;
    private xTemplatesList!: HTMLElement;
    private addXTemplateButton!: HTMLButtonElement;
    private resetXTemplatesButton!: HTMLButtonElement;

    // LinkedIn Settings
    private linkedinSystemPromptInput!: HTMLTextAreaElement;
    private resetLinkedInPromptButton!: HTMLButtonElement;
    private linkedinAdvancedToggle!: HTMLButtonElement;
    private linkedinAdvancedContent!: HTMLElement;
    private linkedinTemperatureInput!: HTMLInputElement;
    private linkedinMaxTokensInput!: HTMLInputElement;
    private linkedinPresencePenaltyInput!: HTMLInputElement;
    private linkedinFrequencyPenaltyInput!: HTMLInputElement;
    private linkedinTypingSpeedInput!: HTMLInputElement;
    private resetLinkedInAdvancedButton!: HTMLButtonElement;
    private linkedinConnectionTemplatesList!: HTMLElement;
    private addLinkedInConnectionTemplateButton!: HTMLButtonElement;
    private resetLinkedInConnectionTemplatesButton!: HTMLButtonElement;
    private linkedinPostTemplatesList!: HTMLElement;
    private addLinkedInPostTemplateButton!: HTMLButtonElement;
    private resetLinkedInPostTemplatesButton!: HTMLButtonElement;

    private defaultSystemPrompt: string = 'Loading...';
    private xTemplates: ReplyTemplate[] = [];
    private linkedinConnectionTemplates: ReplyTemplate[] = [];
    private linkedinPostTemplates: ReplyTemplate[] = [];

    constructor() {
        this.initializeElements();
        this.init();
    }

    private initializeElements() {
        // General tab elements
        this.openrouterApiKeyInput = document.getElementById('openrouterApiKey') as HTMLInputElement;
        this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
        this.statusMessage = document.getElementById('statusMessage') as HTMLElement;
        this.modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
        this.modelDescription = document.getElementById('modelDescription') as HTMLElement;

        // Tab elements
        this.generalTab = document.getElementById('generalTab') as HTMLButtonElement;
        this.xSettingsTab = document.getElementById('xSettingsTab') as HTMLButtonElement;
        this.linkedinSettingsTab = document.getElementById('linkedinSettingsTab') as HTMLButtonElement;
        this.generalContent = document.getElementById('generalContent') as HTMLElement;
        this.xSettingsContent = document.getElementById('xSettingsContent') as HTMLElement;
        this.linkedinSettingsContent = document.getElementById('linkedinSettingsContent') as HTMLElement;

        // X Settings elements
        this.xSystemPromptInput = document.getElementById('xSystemPrompt') as HTMLTextAreaElement;
        this.resetXPromptButton = document.getElementById('resetXPromptButton') as HTMLButtonElement;
        this.xAdvancedToggle = document.getElementById('xAdvancedToggle') as HTMLButtonElement;
        this.xAdvancedContent = document.getElementById('xAdvancedContent') as HTMLElement;
        this.xTemperatureInput = document.getElementById('xTemperature') as HTMLInputElement;
        this.xMaxTokensInput = document.getElementById('xMaxTokens') as HTMLInputElement;
        this.xPresencePenaltyInput = document.getElementById('xPresencePenalty') as HTMLInputElement;
        this.xFrequencyPenaltyInput = document.getElementById('xFrequencyPenalty') as HTMLInputElement;
        this.xTypingSpeedInput = document.getElementById('xTypingSpeed') as HTMLInputElement;
        this.resetXAdvancedButton = document.getElementById('resetXAdvancedButton') as HTMLButtonElement;
        this.xTemplatesList = document.getElementById('xTemplatesList') as HTMLElement;
        this.addXTemplateButton = document.getElementById('addXTemplateButton') as HTMLButtonElement;
        this.resetXTemplatesButton = document.getElementById('resetXTemplatesButton') as HTMLButtonElement;

        // LinkedIn Settings elements
        this.linkedinSystemPromptInput = document.getElementById('linkedinSystemPrompt') as HTMLTextAreaElement;
        this.resetLinkedInPromptButton = document.getElementById('resetLinkedInPromptButton') as HTMLButtonElement;
        this.linkedinAdvancedToggle = document.getElementById('linkedinAdvancedToggle') as HTMLButtonElement;
        this.linkedinAdvancedContent = document.getElementById('linkedinAdvancedContent') as HTMLElement;
        this.linkedinTemperatureInput = document.getElementById('linkedinTemperature') as HTMLInputElement;
        this.linkedinMaxTokensInput = document.getElementById('linkedinMaxTokens') as HTMLInputElement;
        this.linkedinPresencePenaltyInput = document.getElementById('linkedinPresencePenalty') as HTMLInputElement;
        this.linkedinFrequencyPenaltyInput = document.getElementById('linkedinFrequencyPenalty') as HTMLInputElement;
        this.linkedinTypingSpeedInput = document.getElementById('linkedinTypingSpeed') as HTMLInputElement;
        this.resetLinkedInAdvancedButton = document.getElementById('resetLinkedInAdvancedButton') as HTMLButtonElement;
        this.linkedinConnectionTemplatesList = document.getElementById('linkedinConnectionTemplatesList') as HTMLElement;
        this.addLinkedInConnectionTemplateButton = document.getElementById('addLinkedInConnectionTemplateButton') as HTMLButtonElement;
        this.resetLinkedInConnectionTemplatesButton = document.getElementById('resetLinkedInConnectionTemplatesButton') as HTMLButtonElement;
        this.linkedinPostTemplatesList = document.getElementById('linkedinPostTemplatesList') as HTMLElement;
        this.addLinkedInPostTemplateButton = document.getElementById('addLinkedInPostTemplateButton') as HTMLButtonElement;
        this.resetLinkedInPostTemplatesButton = document.getElementById('resetLinkedInPostTemplatesButton') as HTMLButtonElement;
    }

    private async init() {
        // Load the default prompt
        this.defaultSystemPrompt = await loadXSystemPrompt();

        // Load existing settings
        await this.loadSettings();

        // Set up event listeners
        this.setupEventListeners();

        // Load and render templates
        await this.loadTemplates();
    }

    private setupEventListeners() {
        // General tab listeners
        this.saveButton.addEventListener('click', () => this.saveSettings());
        this.openrouterApiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveSettings();
            }
        });
        this.modelSelect.addEventListener('change', () => {
            this.updateModelDescription();
            this.saveSettings();
        });

        // Tab switching
        this.generalTab.addEventListener('click', () => this.switchTab('general'));
        this.xSettingsTab.addEventListener('click', () => this.switchTab('x'));
        this.linkedinSettingsTab.addEventListener('click', () => this.switchTab('linkedin'));

        // X Settings listeners
        this.xSystemPromptInput.addEventListener('change', () => this.saveXSettings());
        this.resetXPromptButton.addEventListener('click', () => this.resetXSystemPrompt());
        this.xAdvancedToggle.addEventListener('click', () => this.toggleAdvancedSettings('x'));

        // X Advanced settings listeners
        this.xTemperatureInput.addEventListener('input', () => this.updateRangeValue('x', 'temperature'));
        this.xPresencePenaltyInput.addEventListener('input', () => this.updateRangeValue('x', 'presencePenalty'));
        this.xFrequencyPenaltyInput.addEventListener('input', () => this.updateRangeValue('x', 'frequencyPenalty'));
        this.xTypingSpeedInput.addEventListener('input', () => this.updateRangeValue('x', 'typingSpeed'));

        // Save X advanced settings on change
        [this.xTemperatureInput, this.xMaxTokensInput, this.xPresencePenaltyInput,
        this.xFrequencyPenaltyInput, this.xTypingSpeedInput].forEach(input => {
            input.addEventListener('change', () => this.saveXSettings());
        });

        this.resetXAdvancedButton.addEventListener('click', () => this.resetXAdvancedSettings());

        // X Templates listeners
        this.addXTemplateButton.addEventListener('click', () => this.addTemplate('x'));
        this.resetXTemplatesButton.addEventListener('click', () => this.resetTemplates('x'));

        // LinkedIn Settings listeners
        this.linkedinSystemPromptInput.addEventListener('change', () => this.saveLinkedInSettings());
        this.resetLinkedInPromptButton.addEventListener('click', () => this.resetLinkedInSystemPrompt());
        this.linkedinAdvancedToggle.addEventListener('click', () => this.toggleAdvancedSettings('linkedin'));

        // LinkedIn Advanced settings listeners
        this.linkedinTemperatureInput.addEventListener('input', () => this.updateRangeValue('linkedin', 'temperature'));
        this.linkedinPresencePenaltyInput.addEventListener('input', () => this.updateRangeValue('linkedin', 'presencePenalty'));
        this.linkedinFrequencyPenaltyInput.addEventListener('input', () => this.updateRangeValue('linkedin', 'frequencyPenalty'));
        this.linkedinTypingSpeedInput.addEventListener('input', () => this.updateRangeValue('linkedin', 'typingSpeed'));

        // Save LinkedIn advanced settings on change
        [this.linkedinTemperatureInput, this.linkedinMaxTokensInput, this.linkedinPresencePenaltyInput,
        this.linkedinFrequencyPenaltyInput, this.linkedinTypingSpeedInput].forEach(input => {
            input.addEventListener('change', () => this.saveLinkedInSettings());
        });

        this.resetLinkedInAdvancedButton.addEventListener('click', () => this.resetLinkedInAdvancedSettings());

        // LinkedIn Templates listeners
        this.addLinkedInConnectionTemplateButton.addEventListener('click', () => this.addTemplate('linkedinConnection'));
        this.resetLinkedInConnectionTemplatesButton.addEventListener('click', () => this.resetTemplates('linkedinConnection'));
        this.addLinkedInPostTemplateButton.addEventListener('click', () => this.addTemplate('linkedinPost'));
        this.resetLinkedInPostTemplatesButton.addEventListener('click', () => this.resetTemplates('linkedinPost'));
    }

    private async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'openrouterApiKey',
                'model',
                'xSettings',
                'linkedinSettings'
            ]);

            if (result.openrouterApiKey) {
                this.openrouterApiKeyInput.value = result.openrouterApiKey;
            }
            if (result.model) {
                this.modelSelect.value = result.model;
            } else {
                // Set default model
                this.modelSelect.value = 'openai/gpt-4.1';
            }

            // Load X settings
            const xSettings = result.xSettings || {
                systemPrompt: this.defaultSystemPrompt,
                advancedSettings: DEFAULT_SETTINGS
            };
            this.xSystemPromptInput.value = xSettings.systemPrompt || this.defaultSystemPrompt;
            this.loadAdvancedSettings('x', xSettings.advancedSettings || DEFAULT_SETTINGS);

            // Load LinkedIn settings  
            const linkedinSettings = result.linkedinSettings || {
                systemPrompt: 'You are a professional LinkedIn user focused on meaningful business connections.',
                advancedSettings: { ...DEFAULT_SETTINGS, maxTokens: 60 }
            };
            this.linkedinSystemPromptInput.value = linkedinSettings.systemPrompt;
            this.loadAdvancedSettings('linkedin', linkedinSettings.advancedSettings || { ...DEFAULT_SETTINGS, maxTokens: 60 });

            // Update range values
            this.updateAllRangeValues();
            this.updateModelDescription();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    private loadAdvancedSettings(platform: 'x' | 'linkedin', settings: AdvancedSettings) {
        if (platform === 'x') {
            this.xTemperatureInput.value = settings.temperature.toString();
            this.xMaxTokensInput.value = settings.maxTokens.toString();
            this.xPresencePenaltyInput.value = settings.presencePenalty.toString();
            this.xFrequencyPenaltyInput.value = settings.frequencyPenalty.toString();
            this.xTypingSpeedInput.value = settings.typingSpeed.toString();
        } else {
            this.linkedinTemperatureInput.value = settings.temperature.toString();
            this.linkedinMaxTokensInput.value = settings.maxTokens.toString();
            this.linkedinPresencePenaltyInput.value = settings.presencePenalty.toString();
            this.linkedinFrequencyPenaltyInput.value = settings.frequencyPenalty.toString();
            this.linkedinTypingSpeedInput.value = settings.typingSpeed.toString();
        }
    }

    private async saveSettings() {
        const openrouterApiKey = this.openrouterApiKeyInput.value.trim();
        const model = this.modelSelect.value;

        // Validate OpenRouter API key
        if (!openrouterApiKey) {
            this.showStatus('Please enter an OpenRouter API key', 'error');
            return;
        }
        if (!openrouterApiKey.startsWith('sk-or-v1-')) {
            this.showStatus('Invalid OpenRouter API key format (should start with sk-or-v1-)', 'error');
            return;
        }

        try {
            this.saveButton.disabled = true;
            this.saveButton.textContent = 'Saving...';

            await chrome.storage.sync.set({
                openrouterApiKey,
                model
            });

            this.showStatus('Settings saved successfully!', 'success');

            setTimeout(() => {
                this.saveButton.disabled = false;
                this.saveButton.textContent = 'Save Settings';
            }, 1000);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
            this.saveButton.disabled = false;
            this.saveButton.textContent = 'Save Settings';
        }
    }

    private async saveXSettings() {
        try {
            const advancedSettings: AdvancedSettings = {
                temperature: parseFloat(this.xTemperatureInput.value),
                maxTokens: parseInt(this.xMaxTokensInput.value),
                presencePenalty: parseFloat(this.xPresencePenaltyInput.value),
                frequencyPenalty: parseFloat(this.xFrequencyPenaltyInput.value),
                typingSpeed: parseFloat(this.xTypingSpeedInput.value)
            };

            const xSettings = {
                systemPrompt: this.xSystemPromptInput.value.trim() || this.defaultSystemPrompt,
                advancedSettings,
                templates: this.xTemplates
            };

            await chrome.storage.sync.set({ xSettings });
            this.showStatus('X settings saved!', 'success');
        } catch (error) {
            console.error('Error saving X settings:', error);
            this.showStatus('Error saving X settings', 'error');
        }
    }

    private async saveLinkedInSettings() {
        try {
            const advancedSettings: AdvancedSettings = {
                temperature: parseFloat(this.linkedinTemperatureInput.value),
                maxTokens: parseInt(this.linkedinMaxTokensInput.value),
                presencePenalty: parseFloat(this.linkedinPresencePenaltyInput.value),
                frequencyPenalty: parseFloat(this.linkedinFrequencyPenaltyInput.value),
                typingSpeed: parseFloat(this.linkedinTypingSpeedInput.value)
            };

            const linkedinSettings = {
                systemPrompt: this.linkedinSystemPromptInput.value.trim() || 'You are a professional LinkedIn user focused on meaningful business connections.',
                advancedSettings,
                templates: this.linkedinPostTemplates
            };

            await chrome.storage.sync.set({
                linkedinSettings,
                linkedinTemplates: this.linkedinConnectionTemplates
            });
            this.showStatus('LinkedIn settings saved!', 'success');
        } catch (error) {
            console.error('Error saving LinkedIn settings:', error);
            this.showStatus('Error saving LinkedIn settings', 'error');
        }
    }

    private switchTab(tab: 'general' | 'x' | 'linkedin') {
        // Update tab buttons
        this.generalTab.classList.toggle('active', tab === 'general');
        this.xSettingsTab.classList.toggle('active', tab === 'x');
        this.linkedinSettingsTab.classList.toggle('active', tab === 'linkedin');

        // Update content visibility
        this.generalContent.classList.toggle('active', tab === 'general');
        this.xSettingsContent.classList.toggle('active', tab === 'x');
        this.linkedinSettingsContent.classList.toggle('active', tab === 'linkedin');
    }

    private toggleAdvancedSettings(platform: 'x' | 'linkedin') {
        const content = platform === 'x' ? this.xAdvancedContent : this.linkedinAdvancedContent;
        const toggle = platform === 'x' ? this.xAdvancedToggle : this.linkedinAdvancedToggle;

        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        toggle.setAttribute('aria-expanded', (!isExpanded).toString());

        const icon = toggle.querySelector('.toggle-icon');
        if (icon) {
            icon.textContent = isExpanded ? '▶' : '▼';
        }
    }

    private updateRangeValue(platform: 'x' | 'linkedin', type: 'temperature' | 'presencePenalty' | 'frequencyPenalty' | 'typingSpeed') {
        const valueElement = document.getElementById(`${platform}${type.charAt(0).toUpperCase() + type.slice(1)}Value`);
        const inputElement = document.getElementById(`${platform}${type.charAt(0).toUpperCase() + type.slice(1)}`);

        if (valueElement && inputElement) {
            valueElement.textContent = (inputElement as HTMLInputElement).value;
        }
    }

    private updateAllRangeValues() {
        // Update X range values
        this.updateRangeValue('x', 'temperature');
        this.updateRangeValue('x', 'presencePenalty');
        this.updateRangeValue('x', 'frequencyPenalty');
        this.updateRangeValue('x', 'typingSpeed');

        // Update LinkedIn range values
        this.updateRangeValue('linkedin', 'temperature');
        this.updateRangeValue('linkedin', 'presencePenalty');
        this.updateRangeValue('linkedin', 'frequencyPenalty');
        this.updateRangeValue('linkedin', 'typingSpeed');
    }

    private resetXSystemPrompt() {
        this.xSystemPromptInput.value = this.defaultSystemPrompt;
        this.saveXSettings();
    }

    private resetLinkedInSystemPrompt() {
        this.linkedinSystemPromptInput.value = 'You are a professional LinkedIn user focused on meaningful business connections.';
        this.saveLinkedInSettings();
    }

    private resetXAdvancedSettings() {
        this.xTemperatureInput.value = DEFAULT_SETTINGS.temperature.toString();
        this.xMaxTokensInput.value = DEFAULT_SETTINGS.maxTokens.toString();
        this.xPresencePenaltyInput.value = DEFAULT_SETTINGS.presencePenalty.toString();
        this.xFrequencyPenaltyInput.value = DEFAULT_SETTINGS.frequencyPenalty.toString();
        this.xTypingSpeedInput.value = DEFAULT_SETTINGS.typingSpeed.toString();
        this.updateAllRangeValues();
        this.saveXSettings();
    }

    private resetLinkedInAdvancedSettings() {
        this.linkedinTemperatureInput.value = DEFAULT_SETTINGS.temperature.toString();
        this.linkedinMaxTokensInput.value = '60'; // LinkedIn default higher
        this.linkedinPresencePenaltyInput.value = DEFAULT_SETTINGS.presencePenalty.toString();
        this.linkedinFrequencyPenaltyInput.value = DEFAULT_SETTINGS.frequencyPenalty.toString();
        this.linkedinTypingSpeedInput.value = DEFAULT_SETTINGS.typingSpeed.toString();
        this.updateAllRangeValues();
        this.saveLinkedInSettings();
    }

    private showStatus(message: string, type: 'success' | 'error') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';

        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 3000);
    }


    private updateModelDescription() {
        const selectedModelId = this.modelSelect.value;
        let description = '';

        // Find model in OpenRouter models list
        const selectedModel = OPENROUTER_MODELS.find(m => m.id === selectedModelId);

        if (selectedModel) {
            description = selectedModel.description || '';
        }

        this.modelDescription.textContent = description;
    }

    private async loadTemplates() {
        try {
            const result = await chrome.storage.sync.get(['xSettings', 'linkedinSettings', 'linkedinTemplates']);

            // Load X templates from xSettings
            this.xTemplates = result.xSettings?.templates || [...DEFAULT_X_TEMPLATES];

            // Load LinkedIn connection templates (separate key for backward compatibility)
            this.linkedinConnectionTemplates = result.linkedinTemplates || [
                {
                    id: 'connect1',
                    name: 'Message #1',
                    prompt: 'Hi {name}, I came across your profile and would love to connect to share insights and opportunities.',
                    icon: '💬'
                },
                {
                    id: 'connect2',
                    name: 'Message #2',
                    prompt: 'Hello {name}! I found your work fascinating and would be happy to connect and keep in touch.',
                    icon: '🔗'
                }
            ];

            // Load LinkedIn post reply templates from linkedinSettings
            this.linkedinPostTemplates = result.linkedinSettings?.templates || [...DEFAULT_LINKEDIN_POST_TEMPLATES];

            this.renderTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    private renderTemplates() {
        // Render X templates
        this.xTemplatesList.innerHTML = '';
        this.xTemplates.forEach((template, index) => {
            const templateEl = this.createTemplateElement(template, index, 'x');
            this.xTemplatesList.appendChild(templateEl);
        });

        // Render LinkedIn connection templates
        this.linkedinConnectionTemplatesList.innerHTML = '';
        this.linkedinConnectionTemplates.forEach((template, index) => {
            const templateEl = this.createTemplateElement(template, index, 'linkedinConnection');
            this.linkedinConnectionTemplatesList.appendChild(templateEl);
        });

        // Render LinkedIn post templates
        this.linkedinPostTemplatesList.innerHTML = '';
        this.linkedinPostTemplates.forEach((template, index) => {
            const templateEl = this.createTemplateElement(template, index, 'linkedinPost');
            this.linkedinPostTemplatesList.appendChild(templateEl);
        });
    }

    private createTemplateElement(template: ReplyTemplate, index: number, platform: 'x' | 'linkedinConnection' | 'linkedinPost'): HTMLElement {
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

    private async updateTemplate(index: number, template: ReplyTemplate, platform: 'x' | 'linkedinConnection' | 'linkedinPost') {
        if (platform === 'x') {
            this.xTemplates[index] = template;
            await this.saveXSettings();
        } else if (platform === 'linkedinConnection') {
            this.linkedinConnectionTemplates[index] = template;
            await this.saveLinkedInSettings();
        } else if (platform === 'linkedinPost') {
            this.linkedinPostTemplates[index] = template;
            await this.saveLinkedInSettings();
        }
        this.renderTemplates();
    }

    private async deleteTemplate(index: number, platform: 'x' | 'linkedinConnection' | 'linkedinPost') {
        if (platform === 'x') {
            this.xTemplates.splice(index, 1);
            await this.saveXSettings();
        } else if (platform === 'linkedinConnection') {
            this.linkedinConnectionTemplates.splice(index, 1);
            await this.saveLinkedInSettings();
        } else if (platform === 'linkedinPost') {
            this.linkedinPostTemplates.splice(index, 1);
            await this.saveLinkedInSettings();
        }
        this.renderTemplates();
    }

    private async addTemplate(platform: 'x' | 'linkedinConnection' | 'linkedinPost') {
        const newTemplate: ReplyTemplate = {
            id: `custom-${Date.now()}`,
            name: platform === 'x' ? 'New Template' : platform === 'linkedinConnection' ? 'New Connection Message' : 'New Post Template',
            prompt: platform === 'x' ? 'Enter your custom prompt here' : platform === 'linkedinConnection' ? 'Hi {name}, enter your message here' : 'Enter your LinkedIn post comment prompt here',
            icon: platform === 'x' ? '📝' : platform === 'linkedinConnection' ? '💬' : '💼'
        };

        if (platform === 'x') {
            this.xTemplates.push(newTemplate);
            await this.saveXSettings();
        } else if (platform === 'linkedinConnection') {
            this.linkedinConnectionTemplates.push(newTemplate);
            await this.saveLinkedInSettings();
        } else if (platform === 'linkedinPost') {
            this.linkedinPostTemplates.push(newTemplate);
            await this.saveLinkedInSettings();
        }

        this.renderTemplates();

        // Scroll to the new template
        let listEl: HTMLElement;
        if (platform === 'x') {
            listEl = this.xTemplatesList;
        } else if (platform === 'linkedinConnection') {
            listEl = this.linkedinConnectionTemplatesList;
        } else {
            listEl = this.linkedinPostTemplatesList;
        }
        listEl.scrollTop = listEl.scrollHeight;
    }

    private async resetTemplates(platform: 'x' | 'linkedinConnection' | 'linkedinPost') {
        if (confirm('Are you sure you want to reset templates to default?')) {
            if (platform === 'x') {
                this.xTemplates = [...DEFAULT_X_TEMPLATES];
                await this.saveXSettings();
            } else if (platform === 'linkedinConnection') {
                this.linkedinConnectionTemplates = [
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
                await this.saveLinkedInSettings();
            } else if (platform === 'linkedinPost') {
                this.linkedinPostTemplates = [...DEFAULT_LINKEDIN_POST_TEMPLATES];
                await this.saveLinkedInSettings();
            }
            this.renderTemplates();
        }
    }


}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    new PopupManager();
}); 