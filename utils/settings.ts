import { AppSettings } from "#imports";

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

export const supportedLanguage = [
    "English",
    "繁体中文",
    "简体中文",
    "French",
    "Spanish",
    "German",
    "Japanese",
];

export interface AppSettings {
    openaiApiKey: string;
    enabledOpenaiModels: string[];
    geminiApiKey: string;
    enabledGeminiModels: string[];
    defaultAi: string;
    language: string;
    debugMode: boolean;
}

export const defaultSettings: AppSettings = {
    openaiApiKey: '',
    enabledOpenaiModels: [allowedOpenAiModels[0]],
    geminiApiKey: '',
    enabledGeminiModels: [allowedGeminiModels[0]],
    defaultAi: 'gemini',
    language: supportedLanguage[0],
    debugMode: false,
};

export async function loadSettingsFromExtensionLocal(): Promise<AppSettings> {
    const settings = await storage.getItem<AppSettings>('local:settings');
    if (!settings) {
        return defaultSettings;
    }
    // remove old allowed models.
    settings.enabledOpenaiModels = settings.enabledOpenaiModels.filter(
        (model: string) => allowedOpenAiModels.includes(model));
    if (settings.openaiApiKey !== '' && settings.enabledOpenaiModels.length === 0) {
        settings.enabledOpenaiModels = [allowedOpenAiModels[0]];
    }
    settings.enabledGeminiModels = settings.enabledGeminiModels.filter(
        (model: string) => allowedGeminiModels.includes(model));
    if (settings.geminiApiKey !== '' && settings.enabledGeminiModels.length === 0) {
        settings.enabledGeminiModels = [allowedGeminiModels[0]];
    }
    return settings;
}

export interface OpenAiCompatibleProvider {
    name: string;
    baseUrl: string;
    model: string;
    accessToken: string;
}

export async function loadOpenAiCompatibleProviders(): Promise<OpenAiCompatibleProvider[]> {
    const providers = await storage.getItem<OpenAiCompatibleProvider[]>('local:openAiProviders');
    return providers ? providers : [];
}