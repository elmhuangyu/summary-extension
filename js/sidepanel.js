console.log("Sidepanel script loaded.");

const aiProviderSelectPanel = document.getElementById('aiProviderPanel');
const responseArea = document.getElementById('responseArea');
const loadingIndicator = document.getElementById('loadingIndicator');
const summarizeBtn = document.getElementById('summarizeBtn');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

let currentAiProvider = 'default'; // Will be updated from storage
let currentLanguage = 'en'; // Will be updated from storage
let pageMarkdown = null; // To cache page content

// --- Utility functions to add messages to the response area ---
function addMessageToPanel(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(type === 'user' ? 'user-message' : (type === 'error' ? 'error-message' : 'ai-message'));
    // Simple text display. For Markdown from AI, this would need a Markdown parser.
    // For now, replacing newlines with <br> for basic formatting.
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    responseArea.appendChild(messageDiv);
    responseArea.scrollTop = responseArea.scrollHeight; // Scroll to bottom
}

// --- Load settings and initialize ---
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['defaultAi', 'language', 'openaiApiKey', 'geminiApiKey'], (settings) => {
        if (settings.defaultAi) {
            currentAiProvider = settings.defaultAi;
            // Update panel selector if a default is set, but keep '(Default)' selected initially
            // The actual AI provider for a request will be determined by currentAiProvider.
        }
        if (settings.language) {
            currentLanguage = settings.language;
        }
        console.log('Sidepanel loaded settings:', { defaultAi: settings.defaultAi, language: settings.language });

        // Check if API keys are set, if not, prompt user.
        if (!settings.openaiApiKey && !settings.geminiApiKey) {
            addMessageToPanel("Welcome! Please configure your AI provider API keys in the extension settings (right-click the extension icon and choose 'Options').", "ai-message");
        } else if (currentAiProvider === 'openai' && !settings.openaiApiKey) {
            addMessageToPanel("OpenAI is your default provider, but the API key is missing. Please set it in options.", "error-message");
        } else if (currentAiProvider === 'gemini' && !settings.geminiApiKey) {
            addMessageToPanel("Gemini is your default provider, but the API key is missing. Please set it in options.", "error-message");
        }
    });

    // Set AI provider based on panel dropdown
    aiProviderSelectPanel.addEventListener('change', (event) => {
        currentAiProvider = event.target.value;
        console.log("AI Provider changed in panel to:", currentAiProvider);
        addMessageToPanel(`Switched to ${currentAiProvider === 'default' ? 'default AI provider' : event.target.options[event.target.selectedIndex].text}.`, 'ai-message');
    });
});

// --- Helper to get page content ---
async function getPageContentFromContentScript() {
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
    const summary = await callAIService('summarize', content, currentAiProvider, currentLanguage);
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
    const answer = await callAIService('chat', { question: question, context: content }, currentAiProvider, currentLanguage);
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
