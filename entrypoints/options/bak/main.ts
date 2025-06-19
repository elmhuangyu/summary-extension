interface Provider {
    id: string;
    name: string;
    baseUrl: string;
    model: string;
    accessToken: string; // Note: Storing access token directly in local storage is not recommended for production extensions.
}

const settingsForm = document.getElementById('settingsForm') as HTMLFormElement | null;
const openaiApiKeyInput = document.getElementById('openaiApiKey') as HTMLInputElement | null;
const geminiApiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement | null;
const defaultAiSelect = document.getElementById('defaultAi') as HTMLSelectElement | null;
const languageSelect = document.getElementById('language') as HTMLSelectElement | null;
const geminiModelSelect = document.getElementById('geminiModel') as HTMLSelectElement | null;
const statusMessage = document.getElementById('statusMessage') as HTMLParagraphElement | null;
const debugModeCheckbox = document.getElementById('debugMode') as HTMLInputElement | null;

// OpenAI-Compatible Providers Elements
const providerNameInput = document.getElementById('providerName') as HTMLInputElement | null;
const providerBaseUrlInput = document.getElementById('providerBaseUrl') as HTMLInputElement | null;
const providerModelInput = document.getElementById('providerModel') as HTMLInputElement | null;
const providerAccessTokenInput = document.getElementById('providerAccessToken') as HTMLInputElement | null;
const addProviderBtn = document.getElementById('addProviderBtn') as HTMLButtonElement | null;
const openaiCompatibleProvidersListDiv = document.getElementById('openaiCompatibleProvidersList') as HTMLDivElement | null;

const openaiCompatibleProvidersKey = 'openaiCompatibleProviders';
let currentProviders: Provider[] = []; // Local cache for providers

// Load saved settings when the page opens
document.addEventListener('DOMContentLoaded', () => {
    // Load standard settings
    // Assuming 'browser' is available globally or imported from 'webextension-polyfill'
    // You might need to install @types/webextension-polyfill
    browser.storage.local.get(['openaiApiKey', 'geminiApiKey', 'defaultAi', 'language', 'geminiModel', 'debugMode', openaiCompatibleProvidersKey]).then((result: any) => {
        if (openaiApiKeyInput && result.openaiApiKey) openaiApiKeyInput.value = result.openaiApiKey;
        if (geminiApiKeyInput && result.geminiApiKey) geminiApiKeyInput.value = result.geminiApiKey;
        if (defaultAiSelect && result.defaultAi) defaultAiSelect.value = result.defaultAi;
        if (languageSelect && result.language) languageSelect.value = result.language;
        if (geminiModelSelect && result.geminiModel) geminiModelSelect.value = result.geminiModel;
        if (debugModeCheckbox && result.debugMode) debugModeCheckbox.checked = result.debugMode;

        currentProviders = result[openaiCompatibleProvidersKey] || [];
        renderProviders();
    });

    // Add provider button listener
    if (addProviderBtn) {
        addProviderBtn.addEventListener('click', handleAddProvider);
    }
});

function renderProviders(): void {
    if (!openaiCompatibleProvidersListDiv) return;

    openaiCompatibleProvidersListDiv.innerHTML = ''; // Clear current list

    if (currentProviders.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No custom providers added yet.';
        openaiCompatibleProvidersListDiv.appendChild(p);
        return;
    }

    const ul = document.createElement('ul');
    currentProviders.forEach(provider => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${provider.name}</strong><br>
            <small>URL: ${provider.baseUrl}, Model: ${provider.model}</small>
        `;
        // Mask access token for display if needed - for now, not showing it.

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-provider-btn'); // For styling if needed
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.dataset.providerId = provider.id;
        deleteBtn.addEventListener('click', () => handleDeleteProvider(provider.id));

        li.appendChild(deleteBtn);
        ul.appendChild(li);
    });
    openaiCompatibleProvidersListDiv.appendChild(ul);
}

async function handleAddProvider(): Promise<void> {
    const name = providerNameInput?.value.trim() || '';
    const baseUrl = providerBaseUrlInput?.value.trim() || '';
    const model = providerModelInput?.value.trim() || '';
    const accessToken = providerAccessTokenInput?.value.trim() || ''; // Store securely, this is a simplified example

    if (!name || !baseUrl || !model || !accessToken) {
        alert('Please fill in all fields for the provider.');
        return;
    }

    // Rudimentary validation for URL (more robust validation might be needed)
    try {
        new URL(baseUrl);
    } catch (_) {
        alert('Please enter a valid Base URL.');
        return;
    }

    // Check for duplicate names (optional, but good practice)
    if (currentProviders.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('A provider with this name already exists. Please choose a unique name.');
        return;
    }

    const newProvider: Provider = {
        id: Date.now().toString(), // Simple unique ID
        name,
        baseUrl,
        model,
        accessToken // Storing access token directly in local storage is not recommended for production extensions.
                      // Consider using browser.storage.session or more secure methods if available/appropriate.
    };

    currentProviders.push(newProvider);
    await saveProviders();
    renderProviders();

    // Clear input fields
    if (providerNameInput) providerNameInput.value = '';
    if (providerBaseUrlInput) providerBaseUrlInput.value = '';
    if (providerModelInput) providerModelInput.value = '';
    if (providerAccessTokenInput) providerAccessTokenInput.value = '';

    if (statusMessage) {
        statusMessage.textContent = 'Provider added successfully!';
        setTimeout(() => {
            if (statusMessage) statusMessage.textContent = '';
        }, 3000);
    }
}

async function handleDeleteProvider(providerId: string): Promise<void> {
    currentProviders = currentProviders.filter(p => p.id !== providerId);
    await saveProviders();
    renderProviders();
    if (statusMessage) {
        statusMessage.textContent = 'Provider deleted successfully!';
        setTimeout(() => {
            if (statusMessage) statusMessage.textContent = '';
        }, 3000);
    }
}

async function saveProviders(): Promise<void> {
    // Assuming 'browser' is available globally or imported from 'webextension-polyfill'
    return browser.storage.local.set({ [openaiCompatibleProvidersKey]: currentProviders });
}

// Save settings when the form is submitted
if (settingsForm) {
    settingsForm.addEventListener('submit', async (event: SubmitEvent) => {
        event.preventDefault();

        // Get all current settings first to preserve ones not on this form (like providers)
        // Assuming 'browser' is available globally or imported from 'webextension-polyfill'
        const allSettings = await browser.storage.local.get(null);

        const updatedSettings = {
            ...allSettings, // Preserve existing settings like openaiCompatibleProviders
            openaiApiKey: openaiApiKeyInput?.value.trim() || '',
            geminiApiKey: geminiApiKeyInput?.value.trim() || '',
            defaultAi: defaultAiSelect?.value || '',
            language: languageSelect?.value || '',
            geminiModel: geminiModelSelect?.value || '',
            debugMode: debugModeCheckbox?.checked || false
        };

        await browser.storage.local.set(updatedSettings);

        if (statusMessage) {
            statusMessage.textContent = 'Settings saved successfully!';
            setTimeout(() => {
                if (statusMessage) statusMessage.textContent = '';
            }, 3000);
        }
    });
}

// Basic HTML escaping function to prevent XSS when rendering provider details
