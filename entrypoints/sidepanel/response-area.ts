import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import DOMPurify from "isomorphic-dompurify";

interface Message {
    type: 'user' | 'ai' | 'error';
    content: string;
    tabTitle?: string;
    tabFavicon?: string;
    aiModelName?: string;
}

@customElement('response-area-component')
export class ResponseAreaComponent extends LitElement {
    @property({ type: Array })
    private responseContent: Message[] = [];

    @property({ type: Boolean })
    private isLoading: boolean = false;

    @property({ type: String })
    private loadingMessage: string = '';

    @query('#responseArea')
    private responseAreaDiv!: HTMLDivElement;

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            font-family: 'Inter', sans-serif;
            box-sizing: border-box;
            flex-grow: 1; /* Allow it to take up remaining space */
            min-height: 0; /* Important for flex items in a column */
        }

        #responseArea {
            overflow-y: auto;
            padding: 5px;
            margin-bottom: 15px;
            color: #333;
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-height: 0;
            flex-grow: 1;
        }

        .message-wrapper {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .tab-info-header {
            display: flex;
            gap: 5px;
            padding: 5px 0;
            font-size: 0.9em;
            color: #666;
            border-bottom: 1px solid #eee;
        }

        .tab-info-header img {
            height: 1.1em;
            width: 1.1em;
            vertical-align: middle;
        }

        .tab-title-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 1;
            min-width: 0;
        }

        .message-container {
            padding: 8px 12px;
            border-radius: 6px;
            word-wrap: break-word;
        }

        .welcome-message-container {
            font-style: italic;
            color: #666;
            text-align: center;
            background-color: transparent;
            padding: 0;
            margin: 0;
        }

        .user-message {
            background-color: #e6f7ff;
            align-self: flex-end;
            margin-left: auto;
            max-width: 85%;
        }
        .ai-message {
            background-color: #e0ffe6;
            align-self: flex-start;
            max-width: 90%;
        }

        .error-message {
            background-color: #ffe6e6;
            color: #d8000c;
            align-self: flex-start;
            max-width: 90%;
        }

        .ai-model-header {
            font-size: 0.85em;
            color: #555;
            align-self: flex-start; /* Align with the AI message box */
            max-width: 90%; /* Match the width of the AI message box */
            padding-left: 8px; /* Align with the padding of the message container */
        }

        /* Markdown specific styles */
        .ai-message pre {
            background-color: #eee;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }

        .ai-message code {
            font-family: 'Fira Code', 'Cascadia Code', monospace;
            background-color: #e0e0e0;
            padding: 2px 4px;
            border-radius: 3px;
        }

        .ai-message p {
            margin-top: 0;
            margin-bottom: 8px;
        }

        .ai-message ul, .ai-message ol {
            margin-top: 0;
            margin-bottom: 8px;
            padding-left: 20px;
        }

        .ai-message h1, .ai-message h2, .ai-message h3, .ai-message h4, .ai-message h5, .ai-message h6 {
            margin-top: 15px;
            margin-bottom: 10px;
        }

        .loader-container {
            display: flex;
            justify-content: center;
            padding: 10px 0;
        }

        .loader-container {
            display: flex;
            justify-content: center;
            align-items: center; /* Center vertically with text */
            gap: 8px; /* Space between loader and text */
            padding: 10px 0;
            color: #555; /* Text color */
            font-size: 0.9em;
        }

        .loader {
            width: 16px;
            height: 16px;
            border: 2px solid #f3f3f3; /* Light grey */
            border-top: 2px solid #555; /* Dark grey */
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (changedProperties.has('responseContent')) {
            this.scrollToBottom();
        }
    }

    public addMessage(type: 'user' | 'ai' | 'error', message: string, tabTitle?: string, tabFavicon?: string, aiModelName?: string) {
        this.responseContent = [...this.responseContent, { type, content: message, tabTitle, tabFavicon, aiModelName }];
    }

    public clear() {
        this.responseContent = [];
        this.isLoading = false; // Clear loading state when messages are cleared
    }

    public toggleLoading(show: boolean, message: string = '') {
        this.isLoading = show;
        this.loadingMessage = message;
        if (show) {
            this.scrollToBottom(); // Scroll to bottom when loading starts
        }
    }

    private scrollToBottom() {
        if (this.responseAreaDiv) {
            this.responseAreaDiv.scrollTop = this.responseAreaDiv.scrollHeight;
        }
    }

    render() {
        return html`
            <div id="responseArea">
                ${this.responseContent.length === 0
                    ? html`<p class="welcome-message-container">Welcome! Ask a question about the page or click Summarize.</p>`
                    : this.responseContent.map(msg => {
                        const messageClass = `${msg.type}-message`;
                        const content = msg.type === 'ai' ? unsafeHTML(DOMPurify.sanitize(marked.parse(msg.content, { async: false }) as string)) : msg.content;
                        return html`
                            ${msg.type === 'ai' && msg.aiModelName ? html`
                                <div class="ai-model-header">
                                    <strong>${msg.aiModelName.split("/")[1]}:</strong> 
                                </div>
                            ` : ''}
                            <div class="message-container ${messageClass}">
                                ${msg.tabTitle && msg.tabFavicon ? html`
                                    <div class="tab-info-header">
                                        <img src="${msg.tabFavicon}">
                                        <span class="tab-title-text">${msg.tabTitle}</span>
                                    </div>
                                ` : ''}
                                ${content}
                            </div>
                        `;
                    })}
                ${this.isLoading ? html`<div class="loader-container"><div class="loader"></div><span>${this.loadingMessage}</span></div>` : ''}
            </div>
        `;
    }
}
