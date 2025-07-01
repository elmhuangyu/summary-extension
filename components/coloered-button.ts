import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Define a type for the button variants for better type safety
export type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';

@customElement('colored-button')
export class ColoredButton extends LitElement {
    static styles = css`
    .loader {
        width: 1em;
        height: 1em;
        border-radius: 50%;
        position: relative;
        animation: rotate 1s linear infinite
    }
    .loader::before {
        content: "";
        box-sizing: border-box;
        position: absolute;
        inset: 0px;
        border-radius: 50%;
        border: 3px solid #FFF;
        animation: prixClipFix 2s linear infinite ;
    }

    @keyframes rotate {
        100%   {transform: rotate(360deg)}
    }

    @keyframes prixClipFix {
        0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
        25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
        50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
        75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
        100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
    }

    button {
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        color: white; /* Default text color for dark backgrounds */
        transition: background-color 0.2s ease, opacity 0.2s ease;
        font-family: inherit; /* Inherit font from parent */
        display: inline-flex; /* Use flex to align content and icon if any */
        align-items: center;
        justify-content: center;
    }
    button:hover {
        opacity: 0.9;
    }
    button:active {
        opacity: 0.8;
    }

    /* --- Variant Styles --- */
    .primary { background-color: #007bff; } /* Blue */
    .success { background-color: #28a745; } /* Green */
    .danger { background-color: #dc3545; }  /* Red */
    .warning { background-color: #ffc107; color: #333; } /* Yellow, often needs darker text */
    .info { background-color: #17a2b8; }    /* Cyan/Teal */
    .dark { background-color: #343a40; }    /* Dark Gray */
    .light { background-color: #f8f9fa; color: #333; border: 1px solid #ddd; } /* Light, often needs darker text and border */
    `;

    /**
     * Type of the button
     * Defaults to 'button'.
     */
    @property({ type: String })
    btntype: string = 'button';

    /**
     * The text displayed on the button.
     * Defaults to 'Button'.
     */
    @property({ type: String })
    label: string = 'Button';

    /**
     * The color variant of the button.
     * Choose from 'primary', 'success', 'danger', 'warning', 'info', 'dark', 'light'.
     * Defaults to 'primary'.
     */
    @property({ type: String })
    variant: ButtonVariant = 'primary';

    /**
     * Whether using the loading
     */
    @property({ type: Boolean })
    loading: boolean = false;

    render() {
        if (this.loading) {
            return html`
            <button class="warning">
                <span class="loader"></span>
            </button>
            `;
        }
        return html`
        <button type="${this.btntype}" class="${this.variant}">
            ${this.label}
        </button>
        `;
    }
}
