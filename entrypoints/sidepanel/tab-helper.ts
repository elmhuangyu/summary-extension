import { getBody, getEmailFromGmail } from '@/lib/content-extract';
import { createMarkdownContent } from '@/third_party/obsidian-clipper/src/utils/markdown-converter';
import { getSubtitle } from '@/lib/sub';
import { AppSettings } from '@/lib/settings';

export class TabInfo {
    id: number;
    title: string;
    favicon: string | undefined;
    validUrl: boolean;
    url: string;
    isBilibiliVideo: boolean;
    isYoutubeVideo: boolean;

    constructor(
        id: number,
        title: string,
        favicon: string | undefined,
        validUrl: boolean,
        url: string,
        isBilibiliVideo: boolean,
        isYoutubeVideo: boolean
    ) {
        this.id = id;
        this.title = title;
        this.favicon = favicon;
        this.validUrl = validUrl;
        this.url = url;
        this.isBilibiliVideo = isBilibiliVideo;
        this.isYoutubeVideo = isYoutubeVideo;
    }

    public async hasYoutubeSubtitle(): Promise<boolean> {
        const funcRes = await browser.scripting.executeScript({
            target: { tabId: this.id },
            func: () => {
                return document.querySelector('.ytd-video-description-transcript-section-renderer') != null;
            },
        });

        if (funcRes.length > 0 && funcRes[0].result === true) {
            return true;
        }
        return false;
    }

    public async bilibiliLoggedin(): Promise<boolean> {
        const funcRes = await browser.scripting.executeScript({
            target: { tabId: this.id },
            func: () => {
                return document.querySelector('.header-login-entry') === null;
            },
        });

        if (funcRes.length > 0 && funcRes[0].result === true) {
            return true;
        }
        return false;
    }
}

export const emptyTab: TabInfo = new TabInfo(
    0,
    '',
    undefined,
    false,
    '',
    false,
    false
);

export async function getCurrentWindowId(): Promise<number | undefined> {
    return (await browser.windows.getCurrent()).id;
}

export async function getCurrentActiveTab(): Promise<TabInfo> {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        return emptyTab;
    }
    const tab = tabs[0];
    const url = tab.url ? tab.url : '';

    return new TabInfo(
        tab.id ? tab.id : 0,
        tab.title ? tab.title : '',
        tab.favIconUrl,
        isValidUrl(url),
        url,
        isBilibiliVideoUrl(url),
        isYoutubeVideoUrl(url)
    );
}

function isValidUrl(url: string): boolean {
    return url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('file:///');
}

function isYoutubeVideoUrl(url: string): boolean {
    return url.startsWith('https://www.youtube.com/watch?v=');
}

function isBilibiliVideoUrl(url: string): boolean {
    return url.startsWith('https://www.bilibili.com/video/');
}


enum pageType {
    GmailEmail,
    Video,
    General,
}

export class PageContext {
    tab: TabInfo
    settings: AppSettings
    ty: pageType = pageType.General

    constructor(tab: TabInfo, settings: AppSettings) {
        this.tab = tab;
        this.settings = settings;
    }

    public hints(): string {
        if (this.tab.url.startsWith('https://mail.google.com/mail/u/0/#inbox/')) {
            return `content is a email, the thread subject is ${this.tab.title}`;
        } else if (this.ty === pageType.Video) {
            return `content is subtitle of video, the title of video is ${this.tab.title}`;
        }
        return `content is from website, title is ${this.tab.title}`;
    }

    public summaryPrompt(): string {
        if (this.tab.url.startsWith('https://mail.google.com/mail/u/0/#inbox/')) {
            return 'summarize this email, list action items if the email contains action items';
        } else if (this.ty === pageType.Video) {
            return 'summarize the video using its subtitle';
        }
        return 'summarize content of this page, the markdown may contains page structure and ads, please ignore them';
    }

    public contentType(): string {
        if (this.ty === pageType.Video) {
            return 'subtitle';
        }
        return 'markdown';
    }

    public async getPageContent(): Promise<string> {
        if (this.tab.isBilibiliVideo || this.tab.isYoutubeVideo) {
            const content = await getSubtitle(this.tab.url, this.settings);
            this.ty = pageType.Video;
            return content;
        }

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
