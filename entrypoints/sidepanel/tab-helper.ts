import { getBody, getEmailFromGmail } from '@/lib/content-extract';
import { createMarkdownContent } from '@/third_party/obsidian-clipper/src/utils/markdown-converter';


export interface tabInfo {
    id: number
    title: string
    favicon: string | undefined
    valid_url: boolean
    url: string
}

export const emptyTab = { id: 0, title: '', favicon: undefined, valid_url: false, url: '' };

export async function getCurrentWindowId(): Promise<number | undefined> {
    return (await browser.windows.getCurrent()).id;
}

export async function getCurrentActiveTab(): Promise<tabInfo> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        return emptyTab;
    }
    const tab = tabs[0];

    return {
        id: tab.id ? tab.id : 0,
        title: tab.title ? tab.title : '',
        favicon: tab.favIconUrl,
        valid_url: tab.url ? isValidUrl(tab.url) : false,
        url: tab.url ? tab.url : '',
    };
}

function isValidUrl(url: string): boolean {
    return url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('file:///');
}

enum pageType {
    GmailEmail,
    General,
}

export class PageContext {
    tab: tabInfo
    ty: pageType = pageType.General

    constructor(tab: tabInfo) {
        this.tab = tab;
    }

    public hints(): string {
        if (this.tab.url.startsWith('https://mail.google.com/mail/u/0/#inbox/')) {
            return 'content is a email';
        }
        return `content is from website ${this.tab.url}`;
    }

    public summaryPrompt(): string {
        if (this.tab.url.startsWith('https://mail.google.com/mail/u/0/#inbox/')) {
            return 'summarize this email, list action items if the email contains action items';
        }
        return `summarize this page`;
    }

    public async getPageContent(): Promise<string> {
        // if email content is found, use the content.
        if (this.tab.url.startsWith('https://mail.google.com/mail/')) {
            const funcRes = await browser.scripting.executeScript({
                target: { tabId: this.tab.id },
                func: getEmailFromGmail,
            });

            if (funcRes.length > 0 && funcRes[0].result) {
                this.ty = pageType.GmailEmail;
                const content = funcRes[0].result;
                return createMarkdownContent(content, this.tab.url);
            }
        }

        const funcRes = await browser.scripting.executeScript({
            target: { tabId: this.tab.id },
            func: getBody,
        });

        if (funcRes.length < 1 || !funcRes[0].result) {
            return '';
        }

        const content = funcRes[0].result;
        return createMarkdownContent(content, this.tab.url);
    }
}
