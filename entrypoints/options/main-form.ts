import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { storage } from '#imports';
import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';

const allowedOpenAiModels = [
    'gpt-4.1-nano',
    'gpt-4.1-mini',
    'gpt-4o-mini',
];

const allowedGeminiModels = [
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
];

interface AppSettings {
    openaiApiKey: string;
    enabledOpenaiModels: string[];
    geminiApiKey: string;
    enabledGeminiModels: string[];
    defaultAi: string;
    language: string;
    debugMode: boolean;
}

@customElement('settings-form')
export class SettingsForm extends LitElement {
    @query('#settingsForm')
    private settingsForm!: HTMLFormElement;

    @query('#openaiApiKey')
    openaiApiKey!: HTMLInputElement;

    @query('#geminiApiKey')
    geminiApiKey!: HTMLInputElement;

    @property({ type: Object })
    settings: AppSettings = {
        openaiApiKey: '',
        enabledOpenaiModels: ['gpt-4.1-nano'], // Default to gpt-4.1-nano enabled
        geminiApiKey: '',
        enabledGeminiModels: [allowedGeminiModels[0]], // Default to gemini-2.5-flash-lite-preview-06-17 enabled
        defaultAi: 'gemini',
        language: 'en',
        debugMode: false,
    };

    static styles = css`
        :host {
            display: block;
            font-family: sans-serif;
            max-width: 600px;
            margin: 20px;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        h2 {
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-top: 20px;
            margin-bottom: 15px;
        }
        h2:first-of-type {
            margin-top: 0;
        }
        h3 {
            color: #333;
            margin-top: 15px;
            margin-bottom: 10px;
        }
        div {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
        }
        div.oneline {
            margin: 0;
            display: flex;
            flex-direction: row;
            gap: 5px;
        }
        label {
            margin: 5px;
            font-weight: bold;
            color: #555;
        }
        input[type="password"],
        select {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            width: 100%;
            box-sizing: border-box; /* Include padding and border in the element's total width and height */
        }
        .checkbox-container input[type="checkbox"] {
            display: inline;
            width: fit-content;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.loadSettings();
    }

    private async loadSettings() {
        const settings = await storage.getItem<AppSettings>('local:settings');
        if (settings) {
            this.settings = settings;
            // remove old allowed models.
            this.settings.enabledOpenaiModels = this.settings.enabledOpenaiModels.filter(
                model => allowedOpenAiModels.includes(model));
            if (this.settings.openaiApiKey !== '' && this.settings.enabledOpenaiModels.length === 0) {
                this.settings.enabledOpenaiModels = [allowedOpenAiModels[0]];
            }
            this.settings.enabledGeminiModels = this.settings.enabledGeminiModels.filter(
                model => allowedGeminiModels.includes(model));
            if (this.settings.geminiApiKey !== '' && this.settings.enabledGeminiModels.length === 0) {
                this.settings.enabledGeminiModels = [allowedGeminiModels[0]];
            }
        }
    }

    private saveSettings() {
        storage.setItem('local:settings', this.settings);
    }

    private handleSubmit(event: Event) {
        const formData = new FormData(this.settingsForm);
        const newSettings: Partial<AppSettings> = {};

        // Initialize arrays for enabled models, ensuring they are always present even if no checkboxes are checked
        newSettings.enabledOpenaiModels = [];
        newSettings.enabledGeminiModels = [];

        formData.forEach((value, key) => {
            if (key.startsWith('openaiModel-')) {
                (newSettings.enabledOpenaiModels as string[]).push(value as string);
            } else if (key.startsWith('geminiModel-')) {
                (newSettings.enabledGeminiModels as string[]).push(value as string);
            } else if (key === 'debugMode') {
                newSettings.debugMode = (value === 'on');
            } else if (key === 'openaiApiKey') {
                newSettings.openaiApiKey = value as string;
            } else if (key === 'geminiApiKey') {
                newSettings.geminiApiKey = value as string;
            } else if (key === 'defaultAi') {
                newSettings.defaultAi = value as string;
            } else if (key === 'language') {
                newSettings.language = value as string;
            }
        });

        this.settings = { ...this.settings, ...newSettings as AppSettings };
        this.saveSettings();
    }

    private async testOpenAiConnection(event: Event) {
        const button = event.target as ColoredButton;

        const apiKey = this.openaiApiKey.value;
        if (!apiKey) {
            return;
        }

        const ai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });
        try {
            await ai.models.list();
            button.variant = 'success';
            button.label = 'Success';
        } catch {
            button.variant = 'danger';
            button.label = 'Failed';
        }
    }

    private async testGeminiConnection(event: Event) {
        const button = event.target as ColoredButton;

        const apiKey = this.geminiApiKey.value;
        if (!apiKey) {
            return;
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        try {
            await ai.models.list();
            button.variant = 'success';
            button.label = 'Success';
        } catch (e) {
            button.variant = 'danger';
            button.label = 'Failed';
        }
    }

    render() {
        return html`
            <form id="settingsForm" @submit=${(e: Event) => e.preventDefault()}>
                <h2>Preferences</h2>
                <div class="checkbox-container oneline">
                    <input
                        type="checkbox"
                        id="debugMode"
                        name="debugMode"
                        .checked=${this.settings.debugMode}
                    >
                    <label for="debugMode">Debug Mode: will enable console.log()</label>
                </div>
                <div class="oneline">
                    <label for="language">Response Language:</label>
                    <select
                        id="language"
                        name="language"
                        .value=${this.settings.language}
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                    </select>
                </div>

                <div>
                    <label for="defaultAi">Default AI Model:</label>
                    <select
                        id="defaultAi"
                        name="defaultAi"
                        .value=${this.settings.defaultAi}
                    >
                        <option value="openai">OpenAI</option>
                        <option value="gemini">Gemini</option>
                    </select>
                </div>

                <h2>AI Provider</h2>
                <h3>OpenAI</h3>
                <div>
                    <label for="openaiApiKey">OpenAI API Key:</label>
                    <div class="oneline">
                        <input
                            type="password"
                            id="openaiApiKey"
                            name="openaiApiKey"
                            .value=${this.settings.openaiApiKey}
                        >
                        <colored-button label="Test" @click=${this.testOpenAiConnection}></colored-button>
                    </div>
                </div>
                <div>
                    <label>Enable OpenAI Models:</label>
                    <div class="checkbox-container">
                        ${allowedOpenAiModels.map(model => html`
                            <div class="oneline">
                                <input
                                    type="checkbox"
                                    id="openaiModel-${model}"
                                    name="openaiModel-${model}"
                                    value="${model}"
                                    .checked=${this.settings.enabledOpenaiModels.includes(model)}
                                >
                                <label for="openaiModel-${model}">${model}</label>
                            </div>
                        `)}
                    </div>
                </div>

                <h3>Gemini</h3>
                <div>
                    <label for="geminiApiKey">Gemini API Key:</label>
                    <div class="oneline">
                        <input
                            type="password"
                            id="geminiApiKey"
                            name="geminiApiKey"
                            .value=${this.settings.geminiApiKey}
                        >
                        <colored-button label="Test" @click=${this.testGeminiConnection}></colored-button>
                    </div>
                </div>
                <div>
                    <label>Enable Gemini Models:</label>
                    <div class="checkbox-container">
                        ${allowedGeminiModels.map(model => html`
                            <div class="oneline">
                                <input
                                    type="checkbox"
                                    id="geminiModel-${model}"
                                    name="geminiModel-${model}"
                                    value="${model}"
                                    .checked=${this.settings.enabledGeminiModels.includes(model)}
                                >
                                <label for="geminiModel-${model}">${model}</label>
                            </div>
                        `)}
                    </div>
                </div>

                <colored-button label="Save Settings" @click=${this.handleSubmit}></colored-button>
            </form>
        `;
    }
}

interface OpenAiProvider {
    name: string;
    baseUrl: string;
    model: string;
    accessToken: string;
}

@customElement('openai-providers-form')
export class OpenAiProvidersForm extends LitElement {
    @state()
    providers: OpenAiProvider[] = [];

    @query('#providerName')
    private providerNameInput!: HTMLInputElement;

    @query('#providerBaseUrl')
    private providerBaseUrlInput!: HTMLInputElement;

    @query('#providerModel')
    private providerModelInput!: HTMLInputElement;

    @query('#providerAccessToken')
    private providerAccessTokenInput!: HTMLInputElement;

    static styles = css`
        :host {
            display: block;
            font-family: sans-serif;
            max-width: 600px;
            margin: 20px;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            background-color: #f9f9f9;
        }
        h2 {
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-top: 0;
            margin-bottom: 15px;
        }
        fieldset {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
        }
        legend {
            font-weight: bold;
            color: #007bff;
            padding: 0 10px;
        }
        div {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
        }
        label {
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        input[type="text"],
        input[type="url"],
        input[type="password"] {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            width: 100%;
            box-sizing: border-box;
        }
        #openaiCompatibleProvidersList {
            margin-top: 20px;
        }
        .provider-item {
            background-color: #e9f7ff;
            border: 1px solid #cceeff;
            border-radius: 6px;
            padding: 10px 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
        }
        .provider-details {
            flex-grow: 1;
            margin-bottom: 0;
        }
        .provider-details strong {
            color: #0056b3;
        }
        .provider-details p {
            margin: 3px 0;
            font-size: 0.9em;
            color: #666;
            word-break: break-all; /* Helps with long URLs */
        }
        .provider-item button.delete-btn {
            background-color: #dc3545;
            color: white;
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            margin-left: 15px;
            flex-shrink: 0; /* Prevent button from shrinking */
        }
        div.oneline {
            margin: 0;
            display: flex;
            flex-direction: row;
            gap: 5px;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.loadProviders();
    }

    private async loadProviders() {
        const data = await storage.getItem<OpenAiProvider[]>('local:openAiProviders');
        if (data) {
            this.providers = data;
        }
    }

    private async saveProviders() {
        await storage.setItem("local:openAiProviders", this.providers);
    }

    private addProvider() {
        const newProviderName = this.providerNameInput.value.trim();

        // Basic validation
        if (!newProviderName || !this.providerBaseUrlInput.value.trim() || !this.providerModelInput.value.trim() || !this.providerAccessTokenInput.value.trim()) {
            alert('Please fill in all fields for the new provider.');
            return;
        }
        if (!this.providerBaseUrlInput.value.trim().startsWith('http://') && !this.providerBaseUrlInput.value.trim().startsWith('https://')) {
            alert('Base URL must start with http:// or https://');
            return;
        }

        // Validate uniqueness of the name
        if (this.providers.some(p => p.name.toLowerCase() === newProviderName.toLowerCase())) {
            alert(`A provider with the name "${newProviderName}" already exists. Please choose a unique name.`);
            return;
        }

        const newProvider: OpenAiProvider = {
            name: newProviderName, // Name is now the identifier
            baseUrl: this.providerBaseUrlInput.value.trim(),
            model: this.providerModelInput.value.trim(),
            accessToken: this.providerAccessTokenInput.value.trim(),
        };

        this.providers = [...this.providers, newProvider];
        this.saveProviders();

        // Clear the form fields
        this.providerNameInput.value = '';
        this.providerBaseUrlInput.value = '';
        this.providerModelInput.value = '';
        this.providerAccessTokenInput.value = '';
    }

    private deleteProvider(nameToDelete: string) { // Now accepts 'name' instead of 'id'
        if (confirm(`Are you sure you want to delete the provider "${nameToDelete}"?`)) {
            this.providers = this.providers.filter(provider => provider.name !== nameToDelete);
            this.saveProviders();
        }
    }

    private async checkConnection(event: Event) {
        const button = event.target as ColoredButton;

        if (this.providerBaseUrlInput.value === '' || this.providerAccessTokenInput.value === '') {
            return;
        }

        const baseUrl = this.providerBaseUrlInput.value;
        const apiKey = this.providerAccessTokenInput.value;

        const ai = new OpenAI({
            baseURL: baseUrl,
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });
        try {
            await ai.models.list();
            button.variant = 'success';
            button.label = 'Success';
        } catch {
            button.variant = 'danger';
            button.label = 'Failed';
        }
    }

    render() {
        return html`
            <form id="openaiProvidersForm" @submit=${(e: Event) => e.preventDefault()}>
                <h2>OpenAI-Compatible Providers</h2>
                <div id="openaiCompatibleProvidersList">
                    ${this.providers.length === 0
                ? html`<p>No providers added yet.</p>`
                : this.providers.map(provider => html`
                            <div class="provider-item">
                                <div class="provider-details">
                                    <strong>${provider.name}</strong> <!-- Displaying name prominently -->
                                    <p>URL: ${provider.baseUrl}</p>
                                    <p>Model: ${provider.model}</p>
                                </div>
                                <colored-button
                                    label="Delete"
                                    variant="danger"
                                    @click=${() => this.deleteProvider(provider.name)}
                                >
                                </colored-button>
                            </div>
                        `)}
                </div>

                <fieldset>
                    <legend>Add New OpenAI-Compatible Provider</legend>
                    <div>
                        <label for="providerName">Name:</label>
                        <input
                            type="text"
                            id="providerName"
                            name="providerName"
                            .value=${live(this.providerNameInput?.value || '')}
                            placeholder="e.g., My Custom OpenAI"
                        >
                    </div>
                    <div>
                        <label for="providerBaseUrl">Base URL:</label>
                        <input
                            type="url"
                            id="providerBaseUrl"
                            name="providerBaseUrl"
                            .value=${live(this.providerBaseUrlInput?.value || '')}
                            placeholder="e.g., https://api.example.com/v1"
                        >
                    </div>
                    <div>
                        <label for="providerModel">Model Name:</label>
                        <input
                            type="text"
                            id="providerModel"
                            name="providerModel"
                            .value=${live(this.providerModelInput?.value || '')}
                            placeholder="e.g., gpt-3.5-turbo"
                        >
                    </div>
                    <div>
                        <label for="providerAccessToken">Access Token:</label>
                        <input
                            type="password"
                            id="providerAccessToken"
                            name="providerAccessToken"
                            .value=${live(this.providerAccessTokenInput?.value || '')}
                        >
                    </div>
                    <div class="oneline">
                    <colored-button label="Add Provider" @click=${this.addProvider}></colored-button>
                    <colored-button label="Test Connection" @click=${this.checkConnection}></colored-button>
                    </div>
                </fieldset>
            </form>
        `;
    }
}

// Define a type for the button variants for better type safety
type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';

@customElement('colored-button')
export class ColoredButton extends LitElement {
    static styles = css`
    button {
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        color: white; /* Default text color for dark backgrounds */
        transition: background-color 0.2s ease, opacity 0.2s ease;
        font-family: inherit; /* Inherit font from parent */
        display: inline-flex; /* Use flex to align content and icon if any */
        align-items: center;
        justify-content: center;
    }
    button:hover {
        opacity: 0.9;
    }
    button:active {
        opacity: 0.8;
    }

    /* --- Variant Styles --- */
    .primary { background-color: #007bff; } /* Blue */
    .success { background-color: #28a745; } /* Green */
    .danger { background-color: #dc3545; }  /* Red */
    .warning { background-color: #ffc107; color: #333; } /* Yellow, often needs darker text */
    .info { background-color: #17a2b8; }    /* Cyan/Teal */
    .dark { background-color: #343a40; }    /* Dark Gray */
    .light { background-color: #f8f9fa; color: #333; border: 1px solid #ddd; } /* Light, often needs darker text and border */
    `;

    /**
     * Type of the button
     * Defaults to 'button'.
     */
    @property({ type: String })
    btntype: string = 'button';

    /**
     * The text displayed on the button.
     * Defaults to 'Button'.
     */
    @property({ type: String })
    label: string = 'Button';

    /**
     * The color variant of the button.
     * Choose from 'primary', 'success', 'danger', 'warning', 'info', 'dark', 'light'.
     * Defaults to 'primary'.
     */
    @property({ type: String })
    variant: ButtonVariant = 'primary';

    /**
     * Whether the button is disabled.
     */
    @property({ type: Boolean })
    disabled: boolean = false;

    render() {
        return html`
        <button type="${this.btntype}" class="${this.variant}">
            <slot>${this.label}</slot>
        </button>
        `;
    }
}
