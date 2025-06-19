console.log("Sidepanel script loaded.");

const aiProviderSelectPanel = document.getElementById('aiProviderPanel');
const responseArea = document.getElementById('responseArea');
const loadingIndicator = document.getElementById('loadingIndicator');
const summarizeBtn = document.getElementById('summarizeBtn');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const geminiThinkingModeCheckbox = document.getElementById('geminiThinkingMode');
const geminiThinkingModeArea = document.getElementById('geminiThinkingModeArea');

let currentAiProvider = 'default'; // Will be updated from storage
let currentGeminiModel = ''; // Will be updated from storage
let currentLanguage = 'en'; // Will be updated from storage
let pageMarkdown = null; // To cache page content

// --- Utility functions to add messages to the response area ---
function addMessageToPanel(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(type);
    // Simple text display. For Markdown from AI, this would need a Markdown parser.
    // For now, replacing newlines with <br> for basic formatting.
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    responseArea.appendChild(messageDiv);
    responseArea.scrollTop = responseArea.scrollHeight; // Scroll to bottom
}

// --- Load settings and initialize ---
document.addEventListener('DOMContentLoaded', () => {
    // Order of operations:
    // 1. Load all relevant settings from storage.
    // 2. Update global variables (currentAiProvider, currentLanguage, currentGeminiModel).
    // 3. Populate AI Provider dropdown.
    // 4. Call updateGeminiThinkingModeVisibility to set initial state of the checkbox area.
    // 5. Set up event listeners.

    chrome.storage.local.get(['defaultAi', 'language', 'openaiApiKey', 'geminiApiKey', 'geminiModel', 'openaiCompatibleProviders'], (settings) => {
        if (settings.language) { // Language is independent
            currentLanguage = settings.language;
        }
        // currentAiProvider will be set by populateAiProviderDropdown based on stored default or its current value
        // currentGeminiModel will also be set/updated

        const customProviders = settings.openaiCompatibleProviders || [];
        // Initialize currentAiProvider before populating, use stored default if available
        // The populate function will then try to select this value or 'default'.
        currentAiProvider = settings.defaultAi || 'default'; // Start with the stored default preference for provider
        currentGeminiModel = settings.geminiModel || "gemini-2.0-flash"; // Default Gemini model

        populateAiProviderDropdown(customProviders, settings.defaultAi); // This will set aiProviderSelectPanel.value

        // After populating and setting the panel's value, update currentAiProvider based on the panel.
        // This is important if the stored defaultAi was a custom provider that got removed,
        // populateAiProviderDropdown would reset to 'default', and we need currentAiProvider to reflect that.
        currentAiProvider = aiProviderSelectPanel.value;


        console.log('Sidepanel loaded settings:', {
            defaultAi: settings.defaultAi,
            language: settings.language,
            geminiModel: settings.geminiModel,
            effectiveGeminiModel: currentGeminiModel,
            initialAiProviderInPanel: currentAiProvider, // Reflects what's selected in panel
            customProvidersCount: customProviders.length
        });

        updateGeminiThinkingModeVisibility(); // Set initial visibility based on the potentially updated currentAiProvider

        // Check if API keys are set for the *effective* provider
        // This logic might need refinement if 'default' points to a custom provider with missing keys
        let effectiveProviderForAPIKeyCheck = currentAiProvider;
        if (currentAiProvider === 'default') {
            effectiveProviderForAPIKeyCheck = settings.defaultAi || 'openai'; // Check keys for the actual default
        }

        const isCustomProvider = customProviders.some(p => p.name === effectiveProviderForAPIKeyCheck);

        if (!settings.openaiApiKey && !settings.geminiApiKey && !customProviders.some(p => p.accessToken)) {
            addMessageToPanel("Welcome! Please configure your AI provider API keys or add a custom provider in the extension settings.", "ai-message");
        } else if (effectiveProviderForAPIKeyCheck === 'openai' && !settings.openaiApiKey) {
            addMessageToPanel("OpenAI is your selected provider, but the API key is missing. Please set it in options.", "error-message");
        } else if (effectiveProviderForAPIKeyCheck === 'gemini' && !settings.geminiApiKey) {
            addMessageToPanel("Gemini is your selected provider, but the API key is missing. Please set it in options.", "error-message");
        } else if (isCustomProvider) {
            const providerDetails = customProviders.find(p => p.name === effectiveProviderForAPIKeyCheck);
            if (!providerDetails || !providerDetails.accessToken || !providerDetails.baseUrl || !providerDetails.model) {
                addMessageToPanel(`The custom provider "${effectiveProviderForAPIKeyCheck}" is missing required configuration (e.g., access token). Please check settings.`, "error-message");
            }
        }
    });

    // Set AI provider based on panel dropdown
    aiProviderSelectPanel.addEventListener('change', (event) => {
        currentAiProvider = event.target.value; // This is correct, can be 'default', 'openai', 'gemini', or a custom name
        console.log("AI Provider changed in panel to:", currentAiProvider);
        // The message should reflect the actual provider if 'default' is chosen.
        // This requires re-evaluating the default provider. For simplicity, keep as is or enhance later.
        addMessageToPanel(`Switched to ${event.target.options[event.target.selectedIndex].text}.`, 'ai-message');
        updateGeminiThinkingModeVisibility(); // Update visibility on provider change
    });

    // Also listen for changes from options page
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            let needsUIRefresh = false;
            if (changes.geminiModel) {
                currentGeminiModel = changes.geminiModel.newValue || "gemini-2.0-flash";
                console.log("Gemini model changed via storage: ", currentGeminiModel);
                needsUIRefresh = true;
            }
            if (changes.defaultAi) {
                console.log("Default AI provider changed via storage: ", changes.defaultAi.newValue);
                // No direct change to currentAiProvider here, populateAiProviderDropdown will handle selection
                needsUIRefresh = true;
            }
            if (changes.openaiCompatibleProviders) {
                console.log("Custom providers changed via storage.");
                needsUIRefresh = true;
            }

            if (needsUIRefresh) {
                // Reload all relevant settings to ensure consistency
                chrome.storage.local.get(['defaultAi', 'geminiModel', 'openaiCompatibleProviders'], (newSettings) => {
                    currentGeminiModel = newSettings.geminiModel || "gemini-2.0-flash";
                    const customProviders = newSettings.openaiCompatibleProviders || [];
                    // currentAiProvider is preserved unless the selected option is removed
                    // populateAiProviderDropdown will handle re-selecting or falling back to 'default'
                    populateAiProviderDropdown(customProviders, newSettings.defaultAi);
                    currentAiProvider = aiProviderSelectPanel.value; // Reflect dropdown's actual state
                    updateGeminiThinkingModeVisibility();
                    console.log("Sidepanel UI updated due to storage change.");
                });
            }
        }
    });
});

function populateAiProviderDropdown(customProviders, defaultAiSetting) {
    const previouslySelectedValue = aiProviderSelectPanel.value || currentAiProvider || defaultAiSetting || 'default';
    aiProviderSelectPanel.innerHTML = ''; // Clear existing options

    // Add default options
    const defaultOption = document.createElement('option');
    defaultOption.value = 'default';
    defaultOption.textContent = `(Default)${defaultAiSetting ? ` - ${defaultAiSetting.substring(0,20)}` : ''}`; // Show which one is default
    aiProviderSelectPanel.appendChild(defaultOption);

    const openaiOption = document.createElement('option');
    openaiOption.value = 'openai';
    openaiOption.textContent = 'OpenAI (Official)';
    aiProviderSelectPanel.appendChild(openaiOption);

    const geminiOption = document.createElement('option');
    geminiOption.value = 'gemini';
    geminiOption.textContent = 'Gemini (Official)';
    aiProviderSelectPanel.appendChild(geminiOption);

    // Add custom providers
    customProviders.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.name; // Use unique name as value
        option.textContent = provider.name; // Display name
        aiProviderSelectPanel.appendChild(option);
    });

    // Set selected option
    if (Array.from(aiProviderSelectPanel.options).some(opt => opt.value === previouslySelectedValue)) {
        aiProviderSelectPanel.value = previouslySelectedValue;
    } else {
        aiProviderSelectPanel.value = 'default'; // Fallback if previously selected is removed
    }
    // Ensure currentAiProvider global variable matches the actual selection
    // currentAiProvider = aiProviderSelectPanel.value; // This will be set by the event listener or after this call in DOMContentLoaded
}


function updateGeminiThinkingModeVisibility() {
    // Determine the actual provider to check against, considering "(Default)" selection
    let providerToCheck = aiProviderSelectPanel.value; // This is the value from the dropdown ('default', 'openai', 'gemini', 'customName')

    if (providerToCheck === 'default') {
        // Need to get the *actual* default provider name from storage to check if it's Gemini
        chrome.storage.local.get(['defaultAi', 'geminiModel'], (settings) => {
            const actualDefaultProvider = settings.defaultAi || 'openai'; // Fallback to openai if no defaultAi is set
            currentGeminiModel = settings.geminiModel || "gemini-2.0-flash"; // Ensure currentGeminiModel is fresh

            if (actualDefaultProvider === 'gemini' && currentGeminiModel && currentGeminiModel.startsWith("gemini-2.5")) {
                geminiThinkingModeArea.style.display = 'block';
            } else {
                geminiThinkingModeArea.style.display = 'none';
                geminiThinkingModeCheckbox.checked = false;
            }
            console.log(`Gemini Thinking Mode (default flow): actualDefault=${actualDefaultProvider}, model=${currentGeminiModel}, visible=${geminiThinkingModeArea.style.display === 'block'}`);
        });
    } else if (providerToCheck === 'gemini') {
        // If 'Gemini (Official)' is directly selected, use currentGeminiModel (already loaded from storage)
        chrome.storage.local.get(['geminiModel'], (settings) => { // Ensure model is fresh
            currentGeminiModel = settings.geminiModel || "gemini-2.0-flash";
            if (currentGeminiModel && currentGeminiModel.startsWith("gemini-2.5")) {
                geminiThinkingModeArea.style.display = 'block';
            } else {
                geminiThinkingModeArea.style.display = 'none';
                geminiThinkingModeCheckbox.checked = false;
            }
            console.log(`Gemini Thinking Mode (direct gemini): model=${currentGeminiModel}, visible=${geminiThinkingModeArea.style.display === 'block'}`);
        });
    } else {
        // OpenAI or Custom provider selected
        geminiThinkingModeArea.style.display = 'none';
        geminiThinkingModeCheckbox.checked = false;
        console.log(`Gemini Thinking Mode (openai/custom): provider=${providerToCheck}, visible=false`);
    }
}

// --- Helper to get page content ---
async function getPageContentFromContentScript() {
    // Corrected: Removed the duplicated API key check logic and misplaced });
    // The function should start with its own logic.
    loadingIndicator.style.display = 'block';
    responseArea.querySelector('.welcome-message')?.remove(); // Remove welcome message
    try {
        const activeTab = await new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    resolve(tabs[0]);
                } else {
                    reject(new Error("No active tab found."));
                }
            });
        });

        if (!activeTab || !activeTab.id) {
            throw new Error("Cannot identify active tab.");
        }

        // Ensure content script is ready (especially on first load or after updates)
        // A simple way is to try sending a ping or just proceed. Robust checks are complex.
        // For now, we assume content script is active on compatible pages.

        const response = await chrome.tabs.sendMessage(activeTab.id, { action: "getPageContent" });
        if (response && response.content) {
            pageMarkdown = response.content;
            console.log("Received markdown from content script (length):", pageMarkdown.length);
            if (pageMarkdown.startsWith("Error:")) {
                 addMessageToPanel(`Could not fetch page content: ${pageMarkdown}`, 'error-message');
                 return null;
            }
            return pageMarkdown;
        } else {
            throw new Error("No content received from content script.");
        }
    } catch (error) {
        console.error("Error getting page content:", error);
        addMessageToPanel(`Error fetching page content: ${error.message}. Ensure the page is fully loaded and try again. Some pages (e.g., chrome:// pages, store pages) are restricted.`, 'error-message');
        return null;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// --- Event Handlers ---
summarizeBtn.addEventListener('click', async () => {
    addMessageToPanel("Summarizing page...", 'user-message');
    const content = pageMarkdown || await getPageContentFromContentScript();
    if (content) {
        // Placeholder for AI call
        console.log("Summarize button clicked. Content acquired. Ready for AI call.");
        loadingIndicator.style.display = 'block';
try {
    let enableThinking = false;
    if (geminiThinkingModeArea.style.display === 'block' && geminiThinkingModeCheckbox.checked) {
        enableThinking = true;
    }
    const summary = await callAIService('summarize', content, currentAiProvider, currentLanguage, enableThinking);
    addMessageToPanel(summary, 'ai-message');
} catch (error) {
    console.error("Summarization error:", error);
    addMessageToPanel(`Error during summarization: ${error.message}`, 'error-message');
} finally {
            loadingIndicator.style.display = 'none';
}
    } else {
        // Error message already shown by getPageContentFromContentScript
    }
});

sendChatBtn.addEventListener('click', async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    addMessageToPanel(question, 'user-message');
    chatInput.value = ''; // Clear input

    // Get page content if not already fetched, or if a specific strategy requires fresh context for chat
    // For now, use cached content if available for chat efficiency.
    const content = pageMarkdown || await getPageContentFromContentScript();

    if (content || question.toLowerCase().includes("hello") || question.toLowerCase().includes("hi")) { // Allow greeting without content
        console.log("Chat message sent. Content acquired (if any). Ready for AI call.");
        loadingIndicator.style.display = 'block';
try {
    let enableThinking = false;
    if (geminiThinkingModeArea.style.display === 'block' && geminiThinkingModeCheckbox.checked) {
        enableThinking = true;
    }
    const answer = await callAIService('chat', { question: question, context: content }, currentAiProvider, currentLanguage, enableThinking);
    addMessageToPanel(answer, 'ai-message');
} catch (error) {
    console.error("Chat error:", error);
    addMessageToPanel(`Error during chat: ${error.message}`, 'error-message');
} finally {
            loadingIndicator.style.display = 'none';
}
    } else {
         // Error message handled by getPageContentFromContentScript or specific check.
    }
});

// Allow sending chat with Enter key in textarea
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent newline in textarea
        sendChatBtn.click();
    }
});

console.log("Sidepanel event listeners and functions set up.");

// Ensure ai_service.js is loaded before sidepanel.js in html/sidepanel.html
// e.g. <script src="../js/ai_service.js"></script> <script src="../js/sidepanel.js"></script>
// For now, we assume callAIService is globally available from ai_service.js
