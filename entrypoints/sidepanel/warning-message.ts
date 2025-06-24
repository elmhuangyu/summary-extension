import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import 'iconify-icon';

@customElement('warning-message-component')
export class WarningMessageComponent extends LitElement {
    @property({ type: Boolean })
    noModel: boolean = false;

    @property({ type: Boolean })
    invalidTab: boolean = false;

    public hasWarning(): boolean {
        return this.noModel || this.invalidTab;
    }

    static styles = css`
        .warning-message {
            color: red;
            font-weight: bold;
            text-align: left;
            padding: 5px;
            background: #FFFFC5;
            display: flex;
            gap: 5px;
            display: flex;
            flex-direction: column;
        }
        .warning-message span {
            margin: 0; /* Remove default paragraph margin */
        }
    `;

    render() {
        const messages: string[] = [];
        if (this.noModel) {
            messages.push('No LLM model is configured, please go to option page to config.');
        }
        if (this.invalidTab) {
            messages.push('This tab is invalid for summarization or chat.');
        }

        if (messages.length === 0) {
            return html``;
        }

        return html`
            <div id="warning" class="warning-message">
                    ${messages.map(message => html`
                        <div>
                            <iconify-icon icon="mdi:alert"></iconify-icon>
                            <span>${message}</span>
                        </div>`)}
            </div>
        `;
    }
}
