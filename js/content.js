// const turndownService = new TurndownService();

debugLog("Content script trying to load.");

// Function to extract and clean page content
function getPageMarkdown() {
    try {
        // Attempt to clone the document body to avoid altering the live page
        const documentClone = document.body.cloneNode(true);

        // Remove script and style elements from the clone
        documentClone.querySelectorAll('script, style, link, svg, iframe, nav, header, footer, aside').forEach(el => el.remove());

        let mainContentElement =
            documentClone.querySelector('article') ||
            documentClone.querySelector('main') ||
            documentClone.querySelector('[role="main"]') ||
            documentClone; // Fallback to body if no specific main content tag is found

        debugLog("Main content element:", mainContentElement);
        let pageHtml = mainContentElement.innerHTML;

        // Basic pre-cleaning: remove excessive newlines and whitespace before Turndown
        pageHtml = pageHtml.replace(/\s{2,}/g, ' ').trim();

        // Initialize Turndown service (assuming it's loaded)
        // Check if TurndownService is available
        if (typeof TurndownService === 'undefined') {
            console.error('TurndownService is not loaded.');
            return "Error: Turndown library not available.";
        }
        const turndownService = new TurndownService({
            headingStyle: 'atx', // # Heading
            hr: '---',
            bulletListMarker: '*',
            codeBlockStyle: 'fenced', // ```code```
            emDelimiter: '_', // _emphasis_
        });

        // Add a rule to handle potential issues with Turndown and iframes/other complex elements
        // that might have survived or were part of the main content.
        // This example keeps alt text for images.
        turndownService.keep(['figure', 'figcaption']);
        turndownService.addRule('images', {
             filter: 'img',
             replacement: function (content, node) {
                 const alt = node.alt || '';
                 const src = node.getAttribute('src') || '';
                 if (src) {
                     return `![${alt}](${src})`;
                 }
                 return alt; // return alt text if no src
             }
        });


        let markdown = turndownService.turndown(pageHtml);

        // Post-processing: Trim whitespace, reduce multiple blank lines
        markdown = markdown.trim().replace(/\n{3,}/g, '\n\n');

        // Limit content size to avoid overly large payloads (e.g., 10k characters)
        // This is a simple truncation, more sophisticated chunking might be needed for very large pages.
        const MAX_LENGTH = 15000;
        if (markdown.length > MAX_LENGTH) {
            markdown = markdown.substring(0, MAX_LENGTH) + "... (content truncated)";
        }

        return markdown;

    } catch (error) {
        console.error('Error getting page content as Markdown:', error);
        return "Error processing page content: " + error.message;
    }
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog("Message received in content script:", request);
    if (request.action === "getPageContent") {
        const markdown = getPageMarkdown();
        debugLog("Sending markdown to side panel (approx length):", markdown.length);
        sendResponse({ content: markdown });
    }
    return true; // Indicates that the response will be sent asynchronously
});

debugLog("Content script loaded and listener added.");
