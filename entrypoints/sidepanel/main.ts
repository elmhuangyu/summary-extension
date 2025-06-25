import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import 'iconify-icon';
import '@/utils/settings';
import { tabInfo, emptyTab, getCurrentWindowId, getCurrentActiveTab } from './tab-helper';
import './warning-message';
import { WarningMessageComponent } from './warning-message';
import './response-area'; // Import the new component
import { ResponseAreaComponent } from './response-area'; // Import the class
import { debugLog } from '@/utils/debug';
import { AppSettings } from '@/utils/settings';
import { Model } from '@/utils/llm';

@customElement('sidepanel-component')
export class SidepanelComponent extends LitElement {
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

    @query('#responseAreaComponent') // Query for the new component
    private responseAreaComponent!: ResponseAreaComponent;

    @property({ type: Object })
    private settings: AppSettings = new AppSettings();

    private settingsUnwatch: () => void = () => { };

    @property({ type: Object })
    private currentTab: tabInfo = emptyTab;

    @state()
    private windowId: number = 0;

    @state()
    private isChatRequestRunning: boolean = false;

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
    }

    private async readWindowAndTabInfo() {
        const windowId = await getCurrentWindowId();
        if (windowId) {
            this.windowId = windowId;
        }
        this.currentTab = await getCurrentActiveTab();
        this.updateInvalidTabWarning();
        this.pingContentScript();
        this.updatePrivateSiteWarning();
    }

    private async handleTabChange(activeInfo: { tabId: number; windowId?: number }) {
        if (activeInfo.windowId && activeInfo.windowId === this.windowId) {
            this.currentTab = await getCurrentActiveTab();
            this.updateInvalidTabWarning();
            this.pingContentScript();
            this.updatePrivateSiteWarning();
        }
    }

    private updateInvalidTabWarning() {
        this.warningMessage.invalidTab = !this.currentTab.valid_url;
    }

    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.readWindowAndTabInfo();
        this.updateThinkingModeVisibility();
    }

    private handleAiProviderChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedAiProvider = selectElement.value;
        this.updateThinkingModeVisibility();
        this.updatePrivateSiteWarning();
    }

    private updateThinkingModeVisibility() {
        this.showThinkingMode = this.selectedAiProvider.includes('gemini-2.5');
        if (!this.showThinkingMode) {
            this.thinkingModeEnabled = false;
        }
    }

    private updatePrivateSiteWarning() {
        const model = this.settings.getModel(this.selectedAiProvider);
        const isPrivateSite = this.settings.privateSites.some(site => this.currentTab.url.includes(site));
        this.warningMessage.notPrivateAiProviderOnPrivateSite = isPrivateSite && (!model || !model.isPrivate);
    }

    private async handleSummarizeClick() {
        if (this.warningMessage.hasWarning()) {
            return;
        }
        if (this.isChatRequestRunning) {
            return;
        }
        this.isChatRequestRunning = true;
        try {
            const content = await this.getPageContent();
            debugLog('summary-extension-sidepanel', 'content:', content);

            const model = this.settings.getModel(this.selectedAiProvider);
            if (!model) {
                return;
            }
            const prompt = 'Summarize the follow content';

            this.responseAreaComponent.addMessage('user', 'Summarize this page', this.currentTab.title, this.currentTab.favicon);
            this.responseAreaComponent.toggleLoading(true);
            const resp = await model.chatWithContent(prompt, content, 'markdown', this.settings.getSystemPrompt(), this.thinkingModeEnabled);
            debugLog('summary-extension-sidepanel', 'ai resp:', resp);
            this.responseAreaComponent.addMessage('ai', resp, this.currentTab.title, this.currentTab.favicon, this.selectedAiProvider);
        } finally {
            this.responseAreaComponent.toggleLoading(false);
            this.isChatRequestRunning = false;
        }
    }

    private async getPageContent(): Promise<string> {
        const response = await browser.tabs.sendMessage(this.currentTab.id, { action: "getPageContent" });
        const md = response as string;
        return md
    }

    private handleClearClick() {
        this.responseAreaComponent.clear();
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

    private async handleSendChatClick() {
        if (this.warningMessage.hasWarning()) {
            return;
        }
        if (this.isChatRequestRunning || this.chatInputText.trim() === '') {
            return;
        }
        this.isChatRequestRunning = true;
        try {
            const content = await this.getPageContent();
            debugLog('summary-extension-sidepanel', 'content:', content);

            const model = this.settings.getModel(this.selectedAiProvider);
            if (!model) {
                return;
            }
            const prompt = this.chatInputText;

            this.responseAreaComponent.addMessage('user', this.chatInputText, this.currentTab.title, this.currentTab.favicon);
            this.chatInputText = ''; // Clear input after sending

            this.responseAreaComponent.toggleLoading(true);
            const resp = await model.chatWithContent(prompt, content, 'markdown', this.settings.getSystemPrompt(), this.thinkingModeEnabled);
            debugLog('summary-extension-sidepanel', 'ai resp:', resp);
            this.responseAreaComponent.addMessage('ai', resp, this.currentTab.title, this.currentTab.favicon);
        } finally {
            this.responseAreaComponent.toggleLoading(false);
            this.isChatRequestRunning = false;
        }
    }

    private async pingContentScript() {
        try {
            const response = await browser.tabs.sendMessage(this.currentTab.id, { action: "ping" });
            this.warningMessage.pingFailed = false; // Reset on successful ping
        } catch (error) {
            this.warningMessage.pingFailed = true; // Set warning on failed ping
        }
    }

    render() {
        return html`
            <div class="sidepanel-container">
                <warning-message-component id="warningMessage"></warning-message-component>
                <response-area-component id="responseAreaComponent"></response-area-component>

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
