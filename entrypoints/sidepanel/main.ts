import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import 'iconify-icon';
type AiProvider = 'default' | 'openai' | 'gemini';

@customElement('sidepanel-component')
export class SidepanelComponent extends LitElement {
    // responseContent is now a list of strings
    @property({ type: Array })
    responseContent: string[] = ['<p class="welcome-message">Welcome! Ask a question about the page or click Summarize.</p>'];

    @property({ type: String })
    selectedAiProvider: AiProvider = 'default';

    @property({ type: Boolean })
    geminiThinkingModeEnabled: boolean = false;

    @state()
    private showGeminiThinkingMode: boolean = false;

    @property({ type: String })
    chatInputText: string = '';

    @query('#aiProviderPanel')
    private aiProviderPanelSelect!: HTMLSelectElement;

    @query('#geminiThinkingMode')
    private geminiThinkingModeCheckbox!: HTMLInputElement;

    @query('#chatInput')
    private chatInputTextarea!: HTMLTextAreaElement;

    @query('#responseArea')
    private responseAreaDiv!: HTMLDivElement; // Query for the scrollable div


    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            font-family: 'Inter', sans-serif;
            box-sizing: border-box;
            background-color: #f7f7f7;
        }

        .sidepanel-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 15px;
            box-sizing: border-box;
        }

        #responseArea {
            overflow-y: auto;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            color: #333;
            display: flex; /* Use flexbox for messages */
            flex-direction: column; /* Stack messages vertically */
            gap: 10px; /* Space between messages */
            min-height: 0; /* Allow flex item to shrink */
            flex-grow: 1;
        }

        .message-container {
            padding: 8px 12px;
            border-radius: 6px;
            background-color: #f0f0f0; /* Default background for messages */
            word-wrap: break-word; /* Ensure long words break */
        }

        /* Specific styles for welcome message if you keep it */
        .welcome-message-container {
            font-style: italic;
            color: #666;
            text-align: center;
            background-color: transparent; /* Welcome message shouldn't have a background */
            padding: 0;
            margin: 0;
        }

        /* Styling for different message types if needed later (e.g., user vs. AI) */
        .user-message {
            background-color: #e6f7ff; /* Light blue */
            align-self: flex-end; /* Align to the right */
            margin-left: auto; /* Push to right */
            max-width: 85%; /* Don't take full width */
        }
        .ai-message {
            background-color: #e0ffe6; /* Light green */
            align-self: flex-start; /* Align to the left */
            margin-right: auto; /* Push to left */
            max-width: 85%;
        }

        footer {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            background-color: #f7f7f7;
            box-sizing: border-box;
        }

        .ai-selector-panel {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background-color: #e9e9e9;
            border-radius: 8px;
            border: 1px solid #dcdcdc;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
        }
        .ai-selector-panel label {
            font-weight: bold;
            color: #555;
            flex-shrink: 0;
        }
        .ai-selector-panel select {
            flex-grow: 1;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 0.95rem;
            background-color: white;
        }
        #geminiThinkingModeArea {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-left: 10px;
            color: #555;
        }
        #geminiThinkingModeArea input[type="checkbox"] {
            transform: scale(1.1);
        }

        .button-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: space-between;
        }
        .button-row button {
            padding: 10px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            transition: background-color 0.2s ease, transform 0.1s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            flex-grow: 1;
            min-width: 100px;
        }
        .button-row button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        .button-row button:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        #summarizeBtn { background-color: #28a745; color: white; }
        #clearBtn { background-color: #ffc107; color: #333; }
        #settings { background-color: #6c757d; color: white; }

        .chat-area {
            display: flex;
            gap: 10px;
        }
        #chatInput {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            resize: vertical;
            min-height: 40px;
            max-height: 150px;
            box-sizing: border-box;
        }
        #sendChatBtn {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            flex-shrink: 0;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        iconify-icon {
            display: inline-block;
        }
    `;

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.updateGeminiThinkingModeVisibility();
        this.scrollToBottom(); // Scroll to bottom initially
    }

    // Called after every update, useful for keeping scroll position correct
    protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (changedProperties.has('responseContent')) {
            this.scrollToBottom(); // Scroll to bottom when new content is added
        }
    }

    // Public method to append new content to the response area
    public appendResponse(message: string, isUserMessage: boolean = false) {
        // You can add logic here to determine if it's a user or AI message
        // For simplicity, just append with basic styling for now.
        // You might pass a 'type' or 'sender' parameter for more complex rendering.
        const messageClass = isUserMessage ? 'user-message' : 'ai-message';
        const formattedMessage = `<div class="message-container ${messageClass}">${message}</div>`;

        this.responseContent = [...this.responseContent, formattedMessage];
        // The updated() lifecycle hook will handle scrolling after this state update.
    }

    private scrollToBottom() {
        if (this.responseAreaDiv) {
            this.responseAreaDiv.scrollTop = this.responseAreaDiv.scrollHeight;
        }
    }

    private _handleAiProviderChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedAiProvider = selectElement.value as AiProvider;
        this.updateGeminiThinkingModeVisibility();

        this.dispatchEvent(new CustomEvent('ai-provider-changed', {
            bubbles: true,
            composed: true,
            detail: { provider: this.selectedAiProvider }
        }));
    }

    private updateGeminiThinkingModeVisibility() {
        this.showGeminiThinkingMode = this.selectedAiProvider === 'gemini';
        if (!this.showGeminiThinkingMode) {
            this.geminiThinkingModeEnabled = false;
        }
    }

    private _handleGeminiThinkingModeChange(event: Event) {
        const checkbox = event.target as HTMLInputElement;
        this.geminiThinkingModeEnabled = checkbox.checked;

        this.dispatchEvent(new CustomEvent('gemini-thinking-mode-changed', {
            bubbles: true,
            composed: true,
            detail: { enabled: this.geminiThinkingModeEnabled }
        }));
    }

    private _handleSummarizeClick() {
        this.dispatchEvent(new CustomEvent('summarize-page', {
            bubbles: true,
            composed: true
        }));
        // Optional: append a "thinking..." message right after click
        this.appendResponse('<div class="message-container ai-message">Summarizing...</div>');
    }

    private _handleClearClick() {
        this.dispatchEvent(new CustomEvent('clear-response', {
            bubbles: true,
            composed: true
        }));
        // Reset responseContent to just the welcome message
        this.responseContent = ['<p class="welcome-message">Welcome! Ask a question about the page or click Summarize.</p>'];
    }

    private _handleSettingsClick() {
        this.dispatchEvent(new CustomEvent('open-settings', {
            bubbles: true,
            composed: true
        }));
    }

    private _handleChatInputChange(event: Event) {
        this.chatInputText = (event.target as HTMLTextAreaElement).value;
    }

    private _handleSendChatClick() {
        if (this.chatInputText.trim() === '') {
            alert('Please enter a message to send.');
            return;
        }

        const messageToSend = this.chatInputText;
        this.appendResponse(messageToSend, true); // Append user's message

        this.dispatchEvent(new CustomEvent('send-chat-message', {
            bubbles: true,
            composed: true,
            detail: { message: messageToSend, provider: this.selectedAiProvider, thinkingMode: this.geminiThinkingModeEnabled }
        }));
        this.chatInputText = ''; // Clear input after sending
    }

    render() {
        return html`
            <div class="sidepanel-container">
                <div id="responseArea">
                    ${this.responseContent.map(content => unsafeHTML(content))}
                </div>

                <footer>
                    <div class="ai-selector-panel">
                        <label for="aiProviderPanel">
                            <iconify-icon icon="bx:bot" height="2.2em"></iconify-icon>
                        </label>
                        <select
                            id="aiProviderPanel"
                            name="aiProviderPanel"
                            .value=${live(this.selectedAiProvider)}
                            @change=${this._handleAiProviderChange}
                        >
                            <option value="default">(Default)</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Gemini</option>
                        </select>
                        <div id="geminiThinkingModeArea" style="${this.showGeminiThinkingMode ? '' : 'display: none;'}">
                            <input
                                type="checkbox"
                                id="geminiThinkingMode"
                                name="geminiThinkingMode"
                                .checked=${live(this.geminiThinkingModeEnabled)}
                                @change=${this._handleGeminiThinkingModeChange}
                            >
                            <label for="geminiThinkingMode">Enable Thinking</label>
                        </div>
                    </div>

                    <div class="button-row">
                        <button id="summarizeBtn" @click=${this._handleSummarizeClick}>Summarize this page</button>
                        <button id="clearBtn" @click=${this._handleClearClick}>
                            <iconify-icon icon="material-symbols-light:mop-outline" height="2.2em"></iconify-icon>
                        </button>
                        <button id="settings" @click=${this._handleSettingsClick}>
                            <iconify-icon icon="material-symbols:settings-outline-rounded" height="2.2em"></iconify-icon>
                        </button>
                    </div>

                    <div class="chat-area">
                        <textarea
                            id="chatInput"
                            placeholder="Ask a question..."
                            .value=${live(this.chatInputText)}
                            @input=${this._handleChatInputChange}
                            @keydown=${(e: KeyboardEvent) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    this._handleSendChatClick();
                                }
                            }}
                        ></textarea>
                        <button id="sendChatBtn" @click=${this._handleSendChatClick}>
                            <iconify-icon icon="tabler:arrow-up" height="2.2em"></iconify-icon>
                        </button>
                    </div>
                </footer>
            </div>
        `;
    }
}
