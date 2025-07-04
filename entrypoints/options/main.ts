import { storage } from "#imports";
import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
    AppSettings,
    allowedOpenAiModels,
    allowedGeminiModels,
    loadSettingsFromExtensionLocal,
    supportedLanguage,
    OpenAiCompatibleProvider,
    loadOpenAiCompatibleProviders,
    saveOpenAiCompatibleProviders,
    saveSettings,
} from '@/lib/settings';
import { Provider, Model } from '@/lib/llm';
import '@/components/coloered-button';
import { ColoredButton } from '@/components/coloered-button';

const commonCss = css`
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
    div {
        margin-bottom: 10px;
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
        font-weight: bold;
        color: #555;
        margin: 5px;
    }
    input[type="password"],
    input[type="url"] {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 50%;
        box-sizing: border-box;
    }
`;

const openaiApiKeyUrl = 'https://platform.openai.com/settings/organization/api-keys';
const geminiApiKeyUrl = 'https://aistudio.google.com/apikey';

@customElement('settings-form')
export class SettingsForm extends LitElement {
    @query('#settingsForm')
    private settingsForm!: HTMLFormElement;

    @query('#openaiApiKey')
    private openaiApiKey!: HTMLInputElement;

    @query('#geminiApiKey')
    private geminiApiKey!: HTMLInputElement;

    @query('#privateSites')
    private privateSites!: HTMLTextAreaElement;

    @query('#subServiceAddress')
    private subServiceAddress!: HTMLInputElement;

    @query('#subServiceToken')
    private subServiceToken!: HTMLInputElement;

    @state()
    private settings: AppSettings = new AppSettings();

    private unwatch: () => void = () => { };

    static styles = [
        commonCss,
        css`
        h3 {
            color: #333;
            margin-top: 15px;
            margin-bottom: 10px;
        }
        select {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%;
            box-sizing: border-box; /* Include padding and border in the element's total width and height */
        }
        .checkbox-container input[type="checkbox"] {
            display: inline;
            width: fit-content;
        }
    `];

    connectedCallback() {
        super.connectedCallback();
        this.loadSettings();
        this.unwatch = storage.watch<AppSettings>('local:settings', (newSettings, oldSettings) => {
            this.loadSettings();
            this.requestUpdate();
        });
    }

    disconnectedCallback() {
        this.unwatch();
        super.disconnectedCallback();
    }

    private async loadSettings() {
        this.settings = await loadSettingsFromExtensionLocal();
    }

    private handleSubmit(event: Event) {
        const formData = new FormData(this.settingsForm);
        const newSettings = new AppSettings();
        newSettings.openaiCompatibleProviders = this.settings.openaiCompatibleProviders;
        newSettings.enabledOpenaiModels = [];
        newSettings.enabledGeminiModels = [];

        formData.forEach((value, key) => {
            if (key.startsWith('openaiModel-')) {
                newSettings.enabledOpenaiModels.push(value as string);
            } else if (key.startsWith('geminiModel-')) {
                newSettings.enabledGeminiModels.push(value as string);
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
            } else if (key === 'privateSites') {
                newSettings.privateSites = (value as string).split('\n').map(s => s.trim()).filter(s => s !== '');
            } else if (key === 'subServiceAddress') {
                newSettings.subService.address = value as string;
            } else if (key === 'subServiceToken') {
                newSettings.subService.token = value as string;
            }
        });

        this.settings = newSettings;
        saveSettings(this.settings);
    }

    private async testOpenAiConnection(event: Event) {
        const button = event.target as ColoredButton;
        button.loading = true;

        const apiKey = this.openaiApiKey.value;
        if (!apiKey) {
            return;
        }

        const ai = new Model(Provider.OpenAI, '', '', apiKey, 0);
        if (await ai.check()) {
            button.loading = false;
            button.variant = 'success';
            button.label = 'Success';
            return;
        }
        button.loading = false;
        button.variant = 'danger';
        button.label = 'Failed';
    }

    private openOpenAiApiKeyPage() {
        window.open(openaiApiKeyUrl, '_blank');
    }

    private openGeminiApiKeyPage() {
        window.open(geminiApiKeyUrl, '_blank');
    }

    private async testGeminiConnection(event: Event) {
        const button = event.target as ColoredButton;
        button.loading = true;

        const apiKey = this.geminiApiKey.value;
        if (!apiKey) {
            return;
        }

        const ai = new Model(Provider.Gemini, '', '', apiKey, 0);
        if (await ai.check()) {
            button.loading = false;
            button.variant = 'success';
            button.label = 'Success';
            return;
        }
        button.loading = false;
        button.variant = 'danger';
        button.label = 'Failed';
    }

    private async testSubServiceConnection(event: Event) {
        const button = event.target as ColoredButton;
        button.loading = true;

        const address = this.subServiceAddress.value;
        const token = this.subServiceToken.value;

        if (!address || !token) {
            button.loading = false;
            button.variant = 'danger';
            button.label = 'Missing Info';
            return;
        }

        try {
            const response = await fetch(address, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                }),
            });

            if (response.ok) {
                button.loading = false;
                button.variant = 'success';
                button.label = 'Success';
            } else {
                button.loading = false;
                button.variant = 'danger';
                button.label = `Failed: ${response.status}`;
            }
        } catch (error) {
            console.error('Sub-service connection test failed:', error);
            button.loading = false;
            button.variant = 'danger';
            button.label = 'Failed: Network Error';
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
                        ${supportedLanguage.map(lang => html`
                            <option value="${lang}">${lang}</option>
                        `)}
                    </select>
                </div>

                <div>
                    <label for="defaultAi">Default AI Model:</label>
                    <select
                        id="defaultAi"
                        name="defaultAi"
                        .value=${this.settings.defaultAi}
                    >
                        ${this.settings.getEnabledModels().map(model => html`
                            <option value="${model}" ?selected=${model === this.settings.defaultAi}>${model}</option>
                        `)}
                    </select>
                </div>

                <div>
                    <label for="privateSites">Private Sites (one per line):</label>
                    <textarea
                        id="privateSites"
                        name="privateSites"
                        rows="5"
                        .value=${this.settings.privateSites.join('\n')}
                    ></textarea>
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
                        <colored-button label="Get API Key" @click=${this.openOpenAiApiKeyPage}></colored-button>
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
                        <colored-button label="Get API Key" @click=${this.openGeminiApiKeyPage}></colored-button>
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

                <h2>Sub Service</h2>
                <div>
                    <label for="subServiceAddress">Sub Service Address:</label>
                    <div class="oneline">
                        <input
                            type="url"
                            id="subServiceAddress"
                            name="subServiceAddress"
                            .value=${this.settings.subService.address}
                            placeholder="e.g., https://your-sub-service.com"
                        >
                    </div>
                </div>
                <div>
                    <label for="subServiceToken">Sub Service Token:</label>
                    <div class="oneline">
                        <input
                            type="password"
                            id="subServiceToken"
                            name="subServiceToken"
                            .value=${this.settings.subService.token}
                        >
                        <colored-button label="Test" @click=${this.testSubServiceConnection}></colored-button>
                    </div>
                </div>

                <colored-button label="Save Settings" @click=${this.handleSubmit}></colored-button>
            </form>
        `;
    }
}

@customElement('openai-compatible-providers-form')
export class OpenAiCompatibleProvidersForm extends LitElement {
    @state()
    providers: OpenAiCompatibleProvider[] = [];

    @query('#providerName')
    private providerNameInput!: HTMLInputElement;

    @query('#providerBaseUrl')
    private providerBaseUrlInput!: HTMLInputElement;

    @query('#providerModel')
    private providerModelInput!: HTMLInputElement;

    @query('#providerAccessToken')
    private providerAccessTokenInput!: HTMLInputElement;

    @query('#providerMaxInputToken')
    private providerMaxInputTokenInput!: HTMLInputElement;

    @query('#providerIsPrivate')
    private providerIsPrivateInput!: HTMLInputElement;

    static styles = [
        commonCss,
        css`
        :host {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
        input[type="text"],
        input[type="url"],
        input[type="number"] {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
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
    `];

    connectedCallback() {
        super.connectedCallback();
        this.loadProviders();
    }

    private async loadProviders() {
        this.providers = await loadOpenAiCompatibleProviders();
    }

    private addProvider() {
        const newProviderName = this.providerNameInput.value.trim();
        const newMaxInputToken = parseInt(this.providerMaxInputTokenInput.value.trim());
        const newIsPrivate = this.providerIsPrivateInput.checked;

        // Basic validation
        if (!newProviderName || !this.providerBaseUrlInput.value.trim() || !this.providerModelInput.value.trim() || !this.providerAccessTokenInput.value.trim() || isNaN(newMaxInputToken)) {
            alert('Please fill in all fields for the new provider, including a valid number for Max Input Token.');
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

        const newProvider: OpenAiCompatibleProvider = {
            name: newProviderName, // Name is now the identifier
            baseUrl: this.providerBaseUrlInput.value.trim(),
            model: this.providerModelInput.value.trim(),
            accessToken: this.providerAccessTokenInput.value.trim(),
            maxInputToken: newMaxInputToken,
            isPrivate: newIsPrivate,
        };

        this.providers = [...this.providers, newProvider];
        saveOpenAiCompatibleProviders(this.providers);

        // Clear the form fields
        this.providerNameInput.value = '';
        this.providerBaseUrlInput.value = '';
        this.providerModelInput.value = '';
        this.providerAccessTokenInput.value = '';
        this.providerMaxInputTokenInput.value = '';
        this.providerIsPrivateInput.checked = false;
    }

    private deleteProvider(nameToDelete: string) { // Now accepts 'name' instead of 'id'
        if (confirm(`Are you sure you want to delete the provider "${nameToDelete}"?`)) {
            this.providers = this.providers.filter(provider => provider.name !== nameToDelete);
            saveOpenAiCompatibleProviders(this.providers);
        }
    }

    private async checkConnection(event: Event) {
        const button = event.target as ColoredButton;
        button.loading = true;

        if (this.providerBaseUrlInput.value === '' ||
            this.providerModelInput.value === '' ||
            this.providerAccessTokenInput.value === '' ||
            this.providerMaxInputTokenInput.value === '') {
            return;
        }

        const baseUrl = this.providerBaseUrlInput.value;
        const model = this.providerModelInput.value;
        const apiKey = this.providerAccessTokenInput.value;
        const maxInputToken = parseInt(this.providerMaxInputTokenInput.value);

        const ai = new Model(Provider.OpenAICompatible, baseUrl, model, apiKey, maxInputToken);
        if (await ai.check()) {
            button.loading = false;
            button.variant = 'success';
            button.label = 'Success';
            return;
        }
        button.loading = false;
        button.variant = 'danger';
        button.label = 'Failed';
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
                                    <p>Max Input Token: ${provider.maxInputToken}</p>
                                    <p>Is Private: ${provider.isPrivate ? 'Yes' : 'No'}</p>
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
                    <div>
                        <label for="providerMaxInputToken">Max Input Token:</label>
                        <input
                            type="number"
                            id="providerMaxInputToken"
                            name="providerMaxInputToken"
                            .value=${live(this.providerMaxInputTokenInput?.value || '')}
                            placeholder="e.g., 4096"
                        >
                    </div>
                    <div class="checkbox-container oneline">
                        <input
                            type="checkbox"
                            id="providerIsPrivate"
                            name="providerIsPrivate"
                            .checked=${live(this.providerIsPrivateInput?.checked || false)}
                        >
                        <label for="providerIsPrivate">Is Private</label>
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
