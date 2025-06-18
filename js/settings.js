console.log("Settings script loaded.");

const settingsForm = document.getElementById('settingsForm');
const openaiApiKeyInput = document.getElementById('openaiApiKey');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const defaultAiSelect = document.getElementById('defaultAi');
const languageSelect = document.getElementById('language');
const statusMessage = document.getElementById('statusMessage');

// Load saved settings when the page opens
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['openaiApiKey', 'geminiApiKey', 'defaultAi', 'language'], (result) => {
        if (result.openaiApiKey) {
            openaiApiKeyInput.value = result.openaiApiKey;
        }
        if (result.geminiApiKey) {
            geminiApiKeyInput.value = result.geminiApiKey;
        }
        if (result.defaultAi) {
            defaultAiSelect.value = result.defaultAi;
        }
        if (result.language) {
            languageSelect.value = result.language;
        }
        console.log('Settings loaded:', result);
    });
});

// Save settings when the form is submitted
settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = {
        openaiApiKey: openaiApiKeyInput.value.trim(),
        geminiApiKey: geminiApiKeyInput.value.trim(),
        defaultAi: defaultAiSelect.value,
        language: languageSelect.value
    };

    chrome.storage.local.set(settings, () => {
        console.log('Settings saved:', settings);
        statusMessage.textContent = 'Settings saved successfully!';
        setTimeout(() => {
            statusMessage.textContent = '';
        }, 3000);
    });
});
