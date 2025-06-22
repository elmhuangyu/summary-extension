import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import 'iconify-icon';
import '@/utils/settings';

@customElement('sidepanel-component')
export class SidepanelComponent extends LitElement {
    // responseContent is now a list of strings
    @property({ type: Array })
    private responseContent: string[] = ['<p class="welcome-message">Welcome! Ask a question about the page or click Summarize.</p>'];

    @property({ type: String })
    private selectedAiProvider: string = '';

    @property({ type: Boolean })
    private thinkingModeEnabled: boolean = false;

    @state()
    private showThinkingMode: boolean = false;

    @property({ type: String })
    private chatInputText: string = '';

    @property({ type: String })
    private warningMessage: string = '';

    @query('#aiProviderPanel')
    private aiProviderPanelSelect!: HTMLSelectElement;

    @query('#thinkingMode')
    private geminiThinkingModeCheckbox!: HTMLInputElement;

    @query('#chatInput')
    private chatInputTextarea!: HTMLTextAreaElement;

    @query('#responseArea')
    private responseAreaDiv!: HTMLDivElement; // Query for the scrollable div

    @state()
    private settings: AppSettings = new AppSettings();

    private settingsUnwatch: () => void = () => { };


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
            padding: 8px;
            box-sizing: border-box;
        }

        #responseArea {
            overflow-y: auto;
            padding: 5px;
            margin-bottom: 15px;
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
            word-wrap: break-word; /* Ensure long words break */
        }

        .warning-message {
            color: red;
            font-weight: bold;
            text-align: left;
            padding: 5px;
            background: #FFFFC5;
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
            gap: 5px;
            flex-grow: 1;
        }
        .ai-selector-panel label {
            font-weight: bold;
            color: #555;
            flex-shrink: 0;
        }
        .ai-selector-panel select {
            flex-grow: 1;
            padding: 2px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background-color: white;
        }
        #thinkingModeArea {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #555;
        }
        #thinkingModeArea input[type="checkbox"] {
            transform: scale(1.1);
        }

        .onerow {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: space-between;
        }

        #summarizeBtn {
            background-color: #28a745;
            color: white;
            flex-grow: 1;
        }
        /* ChatGPT style buttons */
        #clearBtn, #settings, #sendChatBtn {
            background-color: transparent;
            border: none;
            box-shadow: none;
            padding: 0;
            color: #666; /* A neutral color for icons */
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: unset; /* Remove min-width constraint */
            flex-grow: 0; /* Don't let them grow */
        }
        #clearBtn:hover, #settings:hover, #sendChatBtn:hover {
            color: #333; /* Darker on hover */
            background-color: rgba(0,0,0,0.05); /* Slight background on hover */
            transform: none; /* No transform on hover */
        }
        #clearBtn:active, #settings:active, #sendChatBtn:active {
            transform: none; /* No transform on active */
            box-shadow: none; /* No shadow on active */
        }

        .chat-area {
            display: flex;
            flex-direction: column;
            gap: 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
        }
        #chatInput {
            flex-grow: 1;
            padding: 10px;
            resize: vertical;
            min-height: 40px;
            max-height: 150px;
            box-sizing: border-box;
            border: none; /* Remove border */
            background-color: transparent; /* Remove background */
        }
        #chatInput:focus {
            outline: none; /* Remove outline on focus */
            border: none; /* Ensure no border on focus */
            background-color: transparent; /* Ensure no background on focus */
        }
        /* The #sendChatBtn styles are now part of the combined rule above */
        iconify-icon {
            display: inline-block;
            /* Ensure icons are centered within their new button styles */
            vertical-align: middle;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.loadSettings();
        this.settingsUnwatch = storage.watch<AppSettings>('local:settings', (newSettings, oldSettings) => {
            this.loadSettings();
            this.requestUpdate();
        });
    }

    disconnectedCallback() {
        this.settingsUnwatch();
        super.disconnectedCallback();
    }

    private async loadSettings() {
        this.settings = await loadSettingsFromExtensionLocal();
        if (this.selectedAiProvider === '') {
            this.selectedAiProvider = this.settings.defaultAi;
            if (this.selectedAiProvider.includes('gemini-2.5')) {
                this.showThinkingMode = true;
            }
        }
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.updateThinkingModeVisibility();
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
        this.selectedAiProvider = selectElement.value;
        this.updateThinkingModeVisibility();
    }

    private updateThinkingModeVisibility() {
        this.showThinkingMode = this.selectedAiProvider.includes('gemini-2.5');
        if (!this.showThinkingMode) {
            this.thinkingModeEnabled = false;
        }
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
        browser.runtime.openOptionsPage();
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
            detail: { message: messageToSend, provider: this.selectedAiProvider, thinkingMode: this.thinkingModeEnabled }
        }));
        this.chatInputText = ''; // Clear input after sending
    }

    render() {
        return html`
            <div class="sidepanel-container">
                ${this.warningMessage ? html`
                    <div id="warning" class="warning-message">
                        <iconify-icon
                            icon="mdi:alert"
                        ></iconify-icon>
                        ${this.warningMessage}
                    </div>
                ` : ''}
                <div id="responseArea">
                    ${this.responseContent.map(content => unsafeHTML(content))}
                </div>

                <footer>
                    <div class="ai-selector-panel">
                        <select
                            id="aiProviderPanel"
                            name="aiProviderPanel"
                            .value=${this.selectedAiProvider}
                            @change=${this._handleAiProviderChange}
                        >
                        ${this.settings.getEnabledModels().map(model => html`
                            <option value="${model}" ?selected=${model === this.selectedAiProvider}>
                                ${model.split('/')[1]}
                            </option>
                        `)}
                        </select>
                        <div id="thinkingModeArea" style="${this.showThinkingMode ? '' : 'display: none;'}">
                            <input
                                type="checkbox"
                                id="thinkingMode"
                                name="thinkingMode"
                                .checked=${live(this.thinkingModeEnabled)}
                            >
                            <label for="thinkingMode">Thinking</label>
                        </div>
                    </div>
                    
                    <div class="onerow">
                        <button id="summarizeBtn" @click=${this._handleSummarizeClick}>Summarize this page</button>
                        <button id="clearBtn" @click=${this._handleClearClick}>
                            <iconify-icon icon="material-symbols:mop-outline" height="2em"></iconify-icon>
                        </button>
                        <button id="settings" @click=${this._handleSettingsClick}>
                            <iconify-icon icon="material-symbols:settings-outline-rounded" height="2em"></iconify-icon>
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
                        <div class="onerow">
                            <button id="sendChatBtn" @click=${this._handleSendChatClick}>
                                <iconify-icon icon="tabler:arrow-up" height="2em"></iconify-icon>
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        `;
    }
}
