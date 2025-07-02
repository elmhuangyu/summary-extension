import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import 'iconify-icon';

@customElement('warning-message-component')
export class WarningMessageComponent extends LitElement {
    @property({ type: Boolean })
    noModel: boolean = false;

    @property({ type: Boolean })
    invalidTab: boolean = false;

    @property({ type: Boolean })
    notPrivateAiProviderOnPrivateSite: boolean = false;

    @property({ type: Boolean })
    noSubtitleServiceSetup: boolean = false;

    @property({ type: Boolean })
    videoDoesNotHaveSubtitle: boolean = false;

    @property({ type: Boolean })
    bilibiliRequiresLoginToAccessSubtitle: boolean = false;

    public hasWarning(): boolean {
        return this.noModel || this.invalidTab || this.notPrivateAiProviderOnPrivateSite || this.noSubtitleServiceSetup || this.videoDoesNotHaveSubtitle || this.bilibiliRequiresLoginToAccessSubtitle;
    }

    public clearWarnings(): void {
        this.noModel = false;
        this.invalidTab = false;
        this.notPrivateAiProviderOnPrivateSite = false;
        this.noSubtitleServiceSetup = false;
        this.videoDoesNotHaveSubtitle = false;
        this.bilibiliRequiresLoginToAccessSubtitle = false;
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
        if (this.notPrivateAiProviderOnPrivateSite) {
            messages.push('Not private AI provider on private site.');
        }
        if (this.noSubtitleServiceSetup) {
            messages.push('No subtitle service is setup, please go to option page to config.');
        }
        if (this.videoDoesNotHaveSubtitle) {
            messages.push('Video does not have subtitle.');
        }
        if (this.bilibiliRequiresLoginToAccessSubtitle) {
            messages.push('Bilibili requires login to access subtitle.');
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
