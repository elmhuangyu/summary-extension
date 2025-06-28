import { storage } from "#imports";
import { Provider, Model } from "./llm";

export const allowedOpenAiModels = [
    'gpt-4.1-nano',
    'gpt-4.1-mini',
    'gpt-4o-mini',
];

export const allowedGeminiModels = [
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
];

// model -> max input token in b.
const maxInputTokens = new Map<string, number>([
    ['gpt-4.1-nano', 1024 * 1024],
    ['gpt-4.1-mini', 1024 * 1024],
    ['gpt-4o-mini', 128 * 1000],
    ['gemini-2.5-flash-lite-preview-06-17', 1024 * 1024],
    ['gemini-2.5-flash', 1024 * 1024],
    ['gemini-2.5-pro', 1024 * 1024],
    ['gemini-2.0-flash', 1024 * 1024],
]);

export const supportedLanguage = [
    "English",
    "繁体中文",
    "简体中文",
    "French",
    "Spanish",
    "German",
    "Japanese",
];

export interface OpenAiCompatibleProvider {
    name: string;
    baseUrl: string;
    model: string;
    accessToken: string;
    maxInputToken: number;
    isPrivate: boolean;
}

export class AppSettings {
    openaiApiKey: string;
    enabledOpenaiModels: string[];
    geminiApiKey: string;
    enabledGeminiModels: string[];
    defaultAi: string;
    language: string;
    debugMode: boolean;
    openaiCompatibleProviders: OpenAiCompatibleProvider[];
    privateSites: string[];

    constructor() {
        this.openaiApiKey = '';
        this.enabledOpenaiModels = [allowedOpenAiModels[0]];
        this.geminiApiKey = '';
        this.enabledGeminiModels = [allowedGeminiModels[0]];
        this.defaultAi = 'gemini/' + allowedGeminiModels[0];
        this.language = supportedLanguage[0];
        this.debugMode = false;
        this.openaiCompatibleProviders = [];
        this.privateSites = ["mail.google.com"];
    }

    cleanupExpiriedSettings() {
        // remove old allowed models.
        this.enabledOpenaiModels = this.enabledOpenaiModels.filter(
            (model: string) => allowedOpenAiModels.includes(model));
        if (this.openaiApiKey !== '' && this.enabledOpenaiModels.length === 0) {
            this.enabledOpenaiModels = [allowedOpenAiModels[0]];
        }
        this.enabledGeminiModels = this.enabledGeminiModels.filter(
            (model: string) => allowedGeminiModels.includes(model));
        if (this.geminiApiKey !== '' && this.enabledGeminiModels.length === 0) {
            this.enabledGeminiModels = [allowedGeminiModels[0]];
        }
    }

    public getEnabledModels(): string[] {
        const models: string[] = [];

        if (this.geminiApiKey !== '') {
            this.enabledGeminiModels.forEach((model) => {
                models.push('gemini/' + model);
            });
        }

        if (this.openaiApiKey !== '') {
            this.enabledOpenaiModels.forEach((model) => {
                models.push('openai/' + model);
            });
        }

        this.openaiCompatibleProviders.forEach((model) => {
            models.push('custom/' + model.name);
        });

        return models;
    }

    public getModel(name: string): Model | null {
        const parts = name.split('/');
        const gotMaxInputToken = maxInputTokens.get(parts[1]);
        const maxInputToken = gotMaxInputToken ? gotMaxInputToken : 0;
        if (parts[0] === 'openai') {
            return new Model(Provider.OpenAI, '', parts[1], this.openaiApiKey, maxInputToken, false);
        }
        if (parts[0] === 'gemini') {
            return new Model(Provider.Gemini, '', parts[1], this.geminiApiKey, maxInputToken, false);
        }
        for (const p of this.openaiCompatibleProviders) {
            if (p.name == parts[1]) {
                return new Model(Provider.OpenAICompatible, p.baseUrl, p.model, p.accessToken, p.maxInputToken, p.isPrivate);
            }
        }
        return null;
    }

    public getSystemPrompt(): string {
        return `You are a browser extension helps user with the current viewing page.

- User will give you the content of the page.
- Always response in language ${this.language}.`;
    }
}

export async function loadSettingsFromExtensionLocal(): Promise<AppSettings> {
    const settingsData = await storage.getItem<AppSettings>('local:settings');
    const settings = new AppSettings(); // Create a new instance to ensure methods are available
    if (settingsData) {
        Object.assign(settings, settingsData); // Copy properties from stored data
        settings.cleanupExpiriedSettings();
    }
    return settings;
}

export async function saveSettings(settings: AppSettings) {
    await storage.setItem('local:settings', settings);
    await storage.setItem('local:debugMode', settings.debugMode);
}

export async function loadOpenAiCompatibleProviders(): Promise<OpenAiCompatibleProvider[]> {
    const settings = await loadSettingsFromExtensionLocal();
    return settings.openaiCompatibleProviders;
}

export async function saveOpenAiCompatibleProviders(providers: OpenAiCompatibleProvider[]) {
    const settings = await loadSettingsFromExtensionLocal();
    settings.openaiCompatibleProviders = providers;
    await saveSettings(settings);
}
