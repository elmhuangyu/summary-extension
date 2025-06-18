# AI Page Assistant - Chrome Extension

AI Page Assistant is a Chrome extension that helps you understand web pages better by leveraging the power of AI. You can summarize the current page or chat with an AI about its content.

## Features

- **Page Summarization**: Get a quick summary of the active web page.
- **Contextual Chat**: Ask questions about the content of the current page.
- **Multiple AI Providers**:
    - Support for OpenAI compatible APIs (e.g., GPT-3.5-turbo, GPT-4).
    - Support for Google's Gemini API (e.g., Gemini 1.5 Pro).
- **Customizable Settings**:
    - Configure API keys for your chosen AI providers.
    - Set a default AI provider.
    - Choose the language for AI responses.
- **Side Panel Interface**: All interactions happen in a convenient Chrome side panel.
- **Turndown Integration**: Uses the Turndown library to convert page HTML to clean Markdown for better AI processing.

## Installation

Since this extension is under development and not yet on the Chrome Web Store, you'll need to install it manually as an unpacked extension:

1.  **Download the Extension Files**:
    *   Clone this repository or download the source code as a ZIP file and extract it to a local directory.

2.  **Enable Developer Mode in Chrome**:
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Toggle the **Developer mode** switch in the top-right corner to **On**.

3.  **Load the Unpacked Extension**:
    *   Click the **Load unpacked** button that appears.
    *   Navigate to the directory where you saved/extracted the extension files (the directory containing `manifest.json`).
    *   Select the directory.

The AI Page Assistant extension should now be installed and visible in your list of extensions. Its icon will appear in the Chrome toolbar.

## Configuration

Before you can use the AI features, you need to configure your API keys:

1.  **Open Settings**:
    *   The settings page should open automatically the first time you install the extension.
    *   Alternatively, right-click on the extension's icon in the Chrome toolbar and select **Options**.

2.  **Enter API Keys**:
    *   **OpenAI API Key**: If you plan to use an OpenAI model, enter your API key.
    *   **Gemini API Key**: If you plan to use a Gemini model, enter your Gemini API key.

3.  **Set Preferences**:
    *   **Default AI**: Choose whether OpenAI or Gemini should be your default AI provider.
    *   **Response Language**: Select the language in which you want the AI to generate summaries and chat responses.

4.  **Save Settings**: Click the **Save Settings** button.

## How to Use

1.  **Open the Side Panel**:
    *   Navigate to any web page you want to analyze.
    *   Click the AI Page Assistant icon in your Chrome toolbar. The side panel will open.

2.  **Summarize Page**:
    *   Click the **Summarize this page** button in the side panel.
    *   The extension will process the page content and display a summary from the selected AI.

3.  **Chat about Page**:
    *   Type your question about the current page into the chat box at the bottom of the side panel.
    *   Press **Enter** or click the **Send** button.
    *   The AI will use the page content as context to answer your question.

4.  **Switch AI Provider (for current session)**:
    *   You can temporarily switch the AI provider for the current session using the dropdown menu at the top of the side panel. This overrides your default setting for the active session only.

## Supported AI Models

-   **OpenAI**:
    -   Uses the Chat Completions API (e.g., `gpt-3.5-turbo`, `gpt-4`). Ensure your API key has access to these models.
-   **Gemini**:
    -   Uses the Gemini API (specifically `gemini-1.5-pro` model). Ensure your API key has access.
    -   Supports text generation for summarization and chat.

## Development Notes

-   **Content Extraction**: The extension attempts to identify the main content of a page by looking for tags like `<article>` and `<main>`, and by removing common non-content elements (scripts, styles, navs, footers).
-   **HTML to Markdown**: Page content is converted to Markdown using the [Turndown library](https://github.com/mixmark-io/turndown) before being sent to the AI, which generally improves the quality of AI processing.
-   **API Key Security**: API keys are stored locally using `chrome.storage.local`. For direct client-side API calls, be mindful that keys could be exposed if a user inspects the extension's network traffic. For broader distribution, a backend proxy would be a more secure approach.

## Troubleshooting

-   **"Error fetching page content"**:
    -   Some pages may be restricted by Chrome (e.g., `chrome://` pages, Chrome Web Store) and cannot be processed.
    -   Ensure the page is fully loaded before trying to summarize or chat.
-   **AI Errors (e.g., "OpenAI API request failed", "Gemini API request failed")**:
    -   Double-check that your API key is correctly entered in the settings and is active for the selected provider.
    -   Ensure your API key has the necessary permissions/quota for the models being used.
    -   Check your internet connection.
-   **Side Panel Not Opening**:
    -   Ensure the extension is enabled in `chrome://extensions`.
    -   If you've just updated the manifest or background script, you might need to reload the extension from the `chrome://extensions` page.

## Contributing

Contributions, issues, and feature requests are welcome. (This section can be expanded if the project becomes open source).

---

This README provides a good starting point. It can be further improved with screenshots and more detailed technical information as the extension evolves.
