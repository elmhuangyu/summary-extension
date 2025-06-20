import { storage } from "#imports";

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

export interface OpenAiCompatibleProvider {
    name: string;
    baseUrl: string;
    model: string;
    accessToken: string;
}

export interface AppSettings {
    openaiApiKey: string;
    enabledOpenaiModels: string[];
    geminiApiKey: string;
    enabledGeminiModels: string[];
    defaultAi: string;
    language: string;
    debugMode: boolean;
    openaiCompatibleProviders: OpenAiCompatibleProvider[];
}

export const defaultSettings: AppSettings = {
    openaiApiKey: '',
    enabledOpenaiModels: [allowedOpenAiModels[0]],
    geminiApiKey: '',
    enabledGeminiModels: [allowedGeminiModels[0]],
    defaultAi: 'gemini/'+allowedGeminiModels[0],
    language: supportedLanguage[0],
    debugMode: false,
    openaiCompatibleProviders: [],
};

export async function loadSettingsFromExtensionLocal(): Promise<AppSettings> {
    const settings = await storage.getItem<AppSettings>('local:settings');
    if (!settings) {
        return defaultSettings;
    }

    cleanupExpiriedSettings(settings);
    
    return settings;
}

function cleanupExpiriedSettings(settings: AppSettings) {
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
}

export async function saveSettings(settings:AppSettings) {
    await storage.setItem('local:settings', settings);
}

export async function loadOpenAiCompatibleProviders(): Promise<OpenAiCompatibleProvider[]> {
    const settings = await loadSettingsFromExtensionLocal();
    return settings.openaiCompatibleProviders;
}

export async function saveOpenAiCompatibleProviders(providers:OpenAiCompatibleProvider[] ) {
    const settings = await loadSettingsFromExtensionLocal();
    settings.openaiCompatibleProviders = providers;
    await saveSettings(settings);
}