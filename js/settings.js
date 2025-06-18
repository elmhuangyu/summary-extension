console.log("Settings script loaded.");

const settingsForm = document.getElementById('settingsForm');
const openaiApiKeyInput = document.getElementById('openaiApiKey');
const geminiApiKeyInput = document.getElementById('geminiApiKey');
const defaultAiSelect = document.getElementById('defaultAi');
const languageSelect = document.getElementById('language');
const geminiModelSelect = document.getElementById('geminiModel');
const statusMessage = document.getElementById('statusMessage');

// OpenAI-Compatible Providers Elements
const providerNameInput = document.getElementById('providerName');
const providerBaseUrlInput = document.getElementById('providerBaseUrl');
const providerModelInput = document.getElementById('providerModel');
const providerAccessTokenInput = document.getElementById('providerAccessToken');
const addProviderBtn = document.getElementById('addProviderBtn');
const openaiCompatibleProvidersListDiv = document.getElementById('openaiCompatibleProvidersList');

const openaiCompatibleProvidersKey = 'openaiCompatibleProviders';
let currentProviders = []; // Local cache for providers

// Load saved settings when the page opens
document.addEventListener('DOMContentLoaded', () => {
    // Load standard settings
    chrome.storage.local.get(['openaiApiKey', 'geminiApiKey', 'defaultAi', 'language', 'geminiModel', openaiCompatibleProvidersKey], (result) => {
        if (result.openaiApiKey) openaiApiKeyInput.value = result.openaiApiKey;
        if (result.geminiApiKey) geminiApiKeyInput.value = result.geminiApiKey;
        if (result.defaultAi) defaultAiSelect.value = result.defaultAi;
        if (result.language) languageSelect.value = result.language;
        if (result.geminiModel) geminiModelSelect.value = result.geminiModel;

        currentProviders = result[openaiCompatibleProvidersKey] || [];
        renderProviders();
        console.log('Settings loaded:', result);
    });

    // Add provider button listener
    addProviderBtn.addEventListener('click', handleAddProvider);
});

function renderProviders() {
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

async function handleAddProvider() {
    const name = providerNameInput.value.trim();
    const baseUrl = providerBaseUrlInput.value.trim();
    const model = providerModelInput.value.trim();
    const accessToken = providerAccessTokenInput.value.trim(); // Store securely, this is a simplified example

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


    const newProvider = {
        id: Date.now().toString(), // Simple unique ID
        name,
        baseUrl,
        model,
        accessToken // Storing access token directly in local storage is not recommended for production extensions.
                      // Consider using chrome.storage.session or more secure methods if available/appropriate.
    };

    currentProviders.push(newProvider);
    await saveProviders();
    renderProviders();

    // Clear input fields
    providerNameInput.value = '';
    providerBaseUrlInput.value = '';
    providerModelInput.value = '';
    providerAccessTokenInput.value = '';

    statusMessage.textContent = 'Provider added successfully!';
    setTimeout(() => statusMessage.textContent = '', 3000);
}

async function handleDeleteProvider(providerId) {
    currentProviders = currentProviders.filter(p => p.id !== providerId);
    await saveProviders();
    renderProviders();
    statusMessage.textContent = 'Provider deleted successfully!';
    setTimeout(() => statusMessage.textContent = '', 3000);
}

async function saveProviders() {
    return new Promise(resolve => {
        chrome.storage.local.set({ [openaiCompatibleProvidersKey]: currentProviders }, () => {
            console.log('Providers saved:', currentProviders);
            resolve();
        });
    });
}

// Save settings when the form is submitted
settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Get all current settings first to preserve ones not on this form (like providers)
    chrome.storage.local.get(null, (allSettings) => {
        const updatedSettings = {
            ...allSettings, // Preserve existing settings like openaiCompatibleProviders
            openaiApiKey: openaiApiKeyInput.value.trim(),
            geminiApiKey: geminiApiKeyInput.value.trim(),
            defaultAi: defaultAiSelect.value,
            language: languageSelect.value,
            geminiModel: geminiModelSelect.value
        };

        chrome.storage.local.set(updatedSettings, () => {
            console.log('Settings saved:', updatedSettings);
            statusMessage.textContent = 'Settings saved successfully!';
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 3000);
        });
    });
});
