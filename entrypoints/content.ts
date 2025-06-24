import { extractConent } from '@/utils/content-extract';
import { createMarkdownContent } from '@/third_party/obsidian-clipper/src/utils/markdown-converter';

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    browser.runtime.onMessage.addListener((request: any, sender: any, sendResponse: (response?: any) => void) => {
      if (request.action === 'getPageContent') {
        const resp = extractConent();
        const currentUrl = document.URL.replace(/#:~:text=[^&]+(&|$)/, '');
        const markdown = createMarkdownContent(resp.content, currentUrl);
        sendResponse(markdown);
      } else if (request.action === 'ping') {
        sendResponse('pong');
      }
    });
  },
});
