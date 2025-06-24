import { LitElement, html, css, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';

interface Message {
    type: 'user' | 'ai';
    content: string;
}

@customElement('response-area-component')
export class ResponseAreaComponent extends LitElement {
    @property({ type: Array })
    private responseContent: Message[] = [];

    @property({ type: Boolean })
    private isLoading: boolean = false;

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
            margin-right: auto;
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

        .loader {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #555; /* Dark grey */
            box-shadow: 32px 0 #555, -32px 0 #555; /* Dark grey */
            position: relative;
            animation: flash 0.5s ease-out infinite alternate;
        }

        @keyframes flash {
            0% {
                background-color: #5552; /* Transparent dark grey */
                box-shadow: 32px 0 #5552, -32px 0 #555; /* Transparent dark grey, Dark grey */
            }
            50% {
                background-color: #555; /* Dark grey */
                box-shadow: 32px 0 #5552, -32px 0 #5552; /* Transparent dark grey */
            }
            100% {
                background-color: #5552; /* Transparent dark grey */
                box-shadow: 32px 0 #555, -32px 0 #5552; /* Dark grey, Transparent dark grey */
            }
        }
    `;

    protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (changedProperties.has('responseContent')) {
            this.scrollToBottom();
        }
    }

    public addMessage(type: 'user' | 'ai', message: string) {
        this.responseContent = [...this.responseContent, { type, content: message }];
    }

    public clear() {
        this.responseContent = [];
        this.isLoading = false; // Clear loading state when messages are cleared
    }

    public toggleLoading(show: boolean) {
        this.isLoading = show;
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
                        const messageClass = msg.type === 'user' ? 'user-message' : 'ai-message';
                        const content = msg.type === 'ai' ? unsafeHTML(marked.parse(msg.content, { async: false }) as string) : msg.content;
                        return html`<div class="message-container ${messageClass}">${content}</div>`;
                    })}
                ${this.isLoading ? html`<div class="loader-container"><div class="loader"></div></div>` : ''}
            </div>
        `;
    }
}
