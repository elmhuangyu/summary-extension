import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import 'iconify-icon';
import '@/utils/settings';
import { tabInfo, emptyTab, getCurrentWindowId, getCurrentActiveTab } from './tab-helper';
import './warning-message';
import { WarningMessageComponent } from './warning-message';
import { debugLog } from '@/utils/debug';

@customElement('sidepanel-component')
export class SidepanelComponent extends LitElement {
    // responseContent is now a list of strings
    @property({ type: Array })
    private responseContent: string[] = ['<p class="welcome-message">Welcome! Ask a question about the page or click Summarize.</p>'];

    @property({ type: String })
    private selectedAiProvider: string = '';

    @property({ type: Boolean })
    private thinkingModeEnabled: boolean = false;

    @property({ type: Boolean })
    private showThinkingMode: boolean = false;

    @property({ type: String })
    private chatInputText: string = '';

    @query('#warningMessage')
    private warningMessage!: WarningMessageComponent;

    @query('#aiProviderPanel')
    private aiProviderPanelSelect!: HTMLSelectElement;

    @query('#thinkingMode')
    private geminiThinkingModeCheckbox!: HTMLInputElement;

    @query('#chatInput')
    private chatInputTextarea!: HTMLTextAreaElement;

    @query('#responseArea')
    private responseAreaDiv!: HTMLDivElement; // Query for the scrollable div

    @property({ type: Object })
    private settings: AppSettings = new AppSettings();

    private settingsUnwatch: () => void = () => { };

    @property({ type: Object })
    private currentTab: tabInfo = emptyTab;

    @state()
    private windowId: number = 0;

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
            justify-content: space-between;
            flex-direction: row;
        }

        #summarizeBtn {
            background-color: #28a745;
            color: white;
            flex-grow: 1;
        }
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
        #tabInfo {
            flex-grow: 1;
            padding: 5px;
            margin: 2px;
            display: flex; /* Make tabInfo a flex container to align its children */
            min-width: 0; /* Allow flex item to shrink below its content size */
            gap: 2px;
        }
        .tab-title-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 1; /* Allow it to shrink */
            min-width: 0; /* Important for flex items with overflow */
        }
        #favicon {
            height: 1.1em;
            width: 1.1em;
            vertical-align: middle;
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
        this.setupListeners();
    }

    disconnectedCallback() {
        this.settingsUnwatch();
        super.disconnectedCallback();
    }

    private setupListeners() {
        this.settingsUnwatch = storage.watch<AppSettings>('local:settings', (newSettings, oldSettings) => {
            this.loadSettings();
            this.requestUpdate();
        });

        browser.tabs.onActivated.addListener(activeInfo => {
            this.handleTabChange(activeInfo);
        });
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (tab.status === 'complete') {
                this.handleTabChange({ tabId, windowId: tab.windowId });
            }
        });
    }

    private async loadSettings() {
        this.settings = await loadSettingsFromExtensionLocal();
        // don't over-write if user have set the model they want to use.
        if (this.selectedAiProvider === '') {
            this.selectedAiProvider = this.settings.defaultAi;
            // TODO: use better way to hint model support thinking.
            if (this.selectedAiProvider.includes('gemini-2.5')) {
                this.showThinkingMode = true;
            }
        }
        this.warningMessage.noModel = this.settings.getEnabledModels().length === 0;
        this.updateInvalidTabWarning();
    }

    private async readWindowAndTabInfo() {
        const windowId = await getCurrentWindowId();
        if (windowId) {
            this.windowId = windowId;
        }
        this.currentTab = await getCurrentActiveTab();
        this.updateInvalidTabWarning();
    }

    private async handleTabChange(activeInfo: { tabId: number; windowId?: number }) {
        if (activeInfo.windowId && activeInfo.windowId === this.windowId) {
            this.currentTab = await getCurrentActiveTab();
            this.updateInvalidTabWarning();
        }
    }

    private updateInvalidTabWarning() {
        this.warningMessage.invalidTab = !this.currentTab.valid_url;
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.readWindowAndTabInfo();
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

    private handleAiProviderChange(event: Event) {
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

    private async handleSummarizeClick() {
        // TODO
        const content = await this.getPageContent();
        const model = this.settings.getModel(this.selectedAiProvider);
        if (!model) {
            return;
        }
        const prompt = 'Summarize the follow content';

        const resp = await model.chatWithContent(prompt, content, 'markdown', this.settings.getSystemPrompt(), this.thinkingModeEnabled);
        console.log(resp);
    }

    private async getPageContent(): Promise<string> {
        const response = await browser.tabs.sendMessage(this.currentTab.id, { action: "getPageContent" });
        const md = response as string;

        debugLog('summary-extension-sidepanel', 'size:', md.length, 'content:', md);
        return md
    }

    


    private handleClearClick() {
        // TODO
    }

    private handleSettingsClick() {
        browser.runtime.openOptionsPage();
    }

    private handleChatInputChange(event: Event) {
        this.chatInputText = (event.target as HTMLTextAreaElement).value;
    }

    private chatInputOnKeyboard(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendChatClick();
        }
    }

    private handleSendChatClick() {
        // TODO
    }

    render() {
        return html`
            <div class="sidepanel-container">
                <warning-message-component id="warningMessage"></warning-message-component>
                <div id="responseArea">
                    ${this.responseContent.map(content => unsafeHTML(content))}
                </div>

                <footer>
                    <div class="ai-selector-panel">
                        <select
                            id="aiProviderPanel"
                            name="aiProviderPanel"
                            .value=${this.selectedAiProvider}
                            @change=${this.handleAiProviderChange}
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
                        <button id="summarizeBtn" @click=${this.handleSummarizeClick}>Summarize this page</button>
                        <button id="clearBtn" @click=${this.handleClearClick}>
                            <iconify-icon icon="material-symbols:mop-outline" height="2em"></iconify-icon>
                        </button>
                        <button id="settings" @click=${this.handleSettingsClick}>
                            <iconify-icon icon="material-symbols:settings-outline-rounded" height="2em"></iconify-icon>
                        </button>
                    </div>
                    <div class="chat-area">
                        <textarea
                            id="chatInput"
                            placeholder="Ask a question..."
                            .value=${live(this.chatInputText)}
                            @input=${this.handleChatInputChange}
                            @keydown=${this.chatInputOnKeyboard}
                        ></textarea>
                        <div class="onerow">
                            <div id="tabInfo">
                                <span>Tab: </span>
                                ${this.currentTab.favicon ? html`<img id="favicon" src="${this.currentTab.favicon}">` : ''}
                                <span class="tab-title-text">${this.currentTab.title}</span>
                            </div>
                            <button id="sendChatBtn" @click=${this.handleSendChatClick}>
                                <iconify-icon icon="tabler:arrow-up" height="2em"></iconify-icon>
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        `;
    }
}
