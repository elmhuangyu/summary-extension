import { AppSettings } from "./settings";

interface Cookie {
    domain: string;
    includeSubdomains: boolean;
    path: string;
    secure: boolean;
    expiry: number;
    name: string;
    value: string;
}

async function getCookies(currentUrl: string): Promise<Cookie[]> {
    try {
        const url = new URL(currentUrl);
        const topLevelSite = url.origin;

        const cookiesWithPartitionKey = await browser.cookies.getAll({
            url: url.href,
            partitionKey: { topLevelSite: topLevelSite },
        });

        const cookiesWithoutPartitionKey = await browser.cookies.getAll({
            url: url.href,
        });

        let cookies = cookiesWithPartitionKey;
        cookies.push(...cookiesWithoutPartitionKey);

        // Map the cookies to the desired output format
        const formattedCookies = cookies.map(cookie => ({
            domain: cookie.domain,
            includeSubdomains: cookie.domain.startsWith('.'),
            path: cookie.path,
            secure: cookie.secure,
            expiry: cookie.expirationDate ? Math.floor(cookie.expirationDate) : 0, // Provide a default for session cookies
            name: cookie.name,
            value: cookie.value,
        }));

        return formattedCookies;

    } catch (error) {
        console.error('Error fetching cookies:', error);
        return [];
    }
}

export async function getSubtitle(currentUrl: string, settings: AppSettings): Promise<string> {
    const cookies = await getCookies(currentUrl);

    const response = await fetch(settings.subService.address, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${settings.subService.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'video_url': currentUrl,
            'cookies': cookies,
        }),
    });

    if (response.ok) {
        return await response.text();
    }

    throw new Error(`failed to download subtitle, response_code: ${response.status}`);
}