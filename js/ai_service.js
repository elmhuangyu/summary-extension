// js/ai_service.js
console.log("ai_service.js loaded");

async function getStoredSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['openaiApiKey', 'geminiApiKey', 'defaultAi', 'language', 'geminiModel'], resolve);
    });
}

// --- OpenAI API Integration ---
async function callOpenAI(apiKey, messages, maxTokens = 2000, model = "gpt-3.5-turbo") {
    // 'messages' is expected to be an array of {role, content} objects,
    // including any system messages for language or persona.
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('OpenAI API Error:', errorData);
            throw new Error(`OpenAI API request failed: ${errorData.error ? errorData.error.message : response.statusText}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        } else {
            console.error('OpenAI API Error: Invalid response structure', data);
            throw new Error('Invalid response structure from OpenAI API.');
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}

// --- Gemini API Integration ---
async function callGemini(apiKey, contents, language, geminiModel, maxOutputTokens = 2048) { // Added geminiModel
    const modelName = geminiModel || "gemini-1.5-pro"; // Use selected model or fallback
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: contents, // Expects array of {role: "user"/"model", parts: [{text: "..."}]}
        system_instruction: { // Preferred way to set language/behavior for Gemini
            parts: [{ text: `Please respond in ${language}.` }]
        },
        generationConfig: {
            maxOutputTokens: maxOutputTokens,
            temperature: 0.7
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('Gemini API Error:', errorData);
            throw new Error(`Gemini API request failed: ${errorData.error ? errorData.error.message : response.statusText}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0 &&
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text.trim();
        } else if (data.candidates && data.candidates.length > 0 && data.candidates[0].finishReason === "SAFETY") {
            console.warn('Gemini API: Content generation stopped due to safety reasons.', data.candidates[0].safetyRatings);
            // Attempt to get any partial response if available, otherwise return safety message
            if (data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                 return data.candidates[0].content.parts[0].text.trim() + "\n\n[Response may be incomplete due to safety settings.]";
            }
            return "Response blocked or incomplete due to safety settings. Please adjust content or settings if appropriate.";
        } else {
            console.error('Gemini API Error: Invalid response structure', data);
            throw new Error('Invalid response structure from Gemini API.');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

// --- Main AI Service Function ---
async function callAIService(type, data, preferredProvider, preferredLanguage) {
    const settings = await getStoredSettings();
    let providerToUse = preferredProvider;

    if (providerToUse === 'default') {
        providerToUse = settings.defaultAi || 'openai';
    }
    const languageToUse = preferredLanguage || settings.language || 'en';

    if (providerToUse === 'openai') {
        if (!settings.openaiApiKey) {
            return Promise.reject(new Error("OpenAI API key is not set. Please configure it in settings."));
        }

        let openAIMessages = [
            // System prompt for language is now added here for OpenAI
            { role: "system", content: `You are a helpful assistant. Please respond in ${languageToUse}.` }
        ];
        if (type === 'summarize') {
            openAIMessages.push({ role: "user", content: `Please summarize the following content:

${data}` }); // data is pageMarkdown
        } else if (type === 'chat') {
            // data = { question: userQuestion, context?: pageMarkdown, history?: chatHistoryArray }
            // Simplified: no full history array from sidepanel.js yet
            if (data.context) {
                openAIMessages.push({ role: "user", content: `Based on the following content:
${data.context}

Question: ${data.question}` });
            } else {
                openAIMessages.push({ role: "user", content: data.question });
            }
        } else {
            return Promise.reject(new Error("Invalid AI service type requested for OpenAI."));
        }
        return callOpenAI(settings.openaiApiKey, openAIMessages);

    } else if (providerToUse === 'gemini') {
        if (!settings.geminiApiKey) {
            return Promise.reject(new Error("Gemini API key is not set. Please configure it in settings."));
        }

        let geminiContents = [];
        // For Gemini, chat history is part of the 'contents' array.
        // 'system_instruction' is used for language.
        if (type === 'summarize') {
            // For summarization, the 'contents' will be a single user turn.
            geminiContents.push({ role: "user", parts: [{ text: `Please summarize the following content:

${data}` }] });
        } else if (type === 'chat') {
            // data = { question: userQuestion, context?: pageMarkdown, history?: chatHistoryArray }
            // Simplified: no full history array from sidepanel.js yet
            if (data.context) {
                geminiContents.push({ role: "user", parts: [{ text: `Based on the following content:
${data.context}

Question: ${data.question}` }] });
            } else {
                geminiContents.push({ role: "user", parts: [{ text: data.question }] });
            }
        } else {
            return Promise.reject(new Error("Invalid AI service type requested for Gemini."));
        }
        return callGemini(settings.geminiApiKey, geminiContents, languageToUse, settings.geminiModel);

    } else {
        return Promise.reject(new Error("Unknown or unsupported AI provider selected."));
    }
}
