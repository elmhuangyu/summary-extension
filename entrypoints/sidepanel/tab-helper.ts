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
