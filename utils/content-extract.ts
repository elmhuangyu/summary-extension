import Defuddle from 'defuddle';
import { getDomain } from '@/third_party/obsidian-clipper/src/utils/string-utils';

export interface ExtractedContent {
  content: string;
  extractedContent: { [key: string]: string };
  schemaOrgData: any;
  fullHtml: string;
  title: string;
  description: string;
  domain: string;
  favicon: string;
  image: string;
  parseTime: number;
  published: string;
  author: string;
  site: string;
  wordCount: number;
}

export function extractConent(): ExtractedContent {
    const extractedContent: { [key: string]: string } = {};

    // Process with Defuddle first while we have access to the document
    const defuddled = new Defuddle(document, { url: document.URL }).parse();

    // Create a new DOMParser
    const parser = new DOMParser();
    // Parse the document's HTML
    const doc = parser.parseFromString(document.documentElement.outerHTML, 'text/html');

    // Remove all script and style elements
    doc.querySelectorAll('script, style').forEach(el => el.remove());

    // Remove style attributes from all elements
    doc.querySelectorAll('*').forEach(el => el.removeAttribute('style'));

    // Convert all relative URLs to absolute
    doc.querySelectorAll('[src], [href]').forEach(element => {
      ['src', 'href', 'srcset'].forEach(attr => {
        const value = element.getAttribute(attr);
        if (!value) return;

        if (attr === 'srcset') {
          const newSrcset = value.split(',').map(src => {
            const [url, size] = src.trim().split(' ');
            try {
              const absoluteUrl = new URL(url, document.baseURI).href;
              return `${absoluteUrl}${size ? ' ' + size : ''}`;
            } catch (e) {
              return src;
            }
          }).join(', ');
          element.setAttribute(attr, newSrcset);
        } else if (!value.startsWith('http') && !value.startsWith('data:') && !value.startsWith('#') && !value.startsWith('//')) {
          try {
            const absoluteUrl = new URL(value, document.baseURI).href;
            element.setAttribute(attr, absoluteUrl);
          } catch (e) {
            console.warn(`Failed to process ${attr} URL:`, value);
          }
        }
      });
    });

    // Get the modified HTML without scripts, styles, and style attributes
    const cleanedHtml = doc.documentElement.outerHTML;

    const response: ExtractedContent = {
      author: defuddled.author,
      content: defuddled.content,
      description: defuddled.description,
      domain: getDomain(document.URL),
      extractedContent: extractedContent,
      favicon: defuddled.favicon,
      fullHtml: cleanedHtml,
      image: defuddled.image,
      parseTime: defuddled.parseTime,
      published: defuddled.published,
      schemaOrgData: defuddled.schemaOrgData,
      site: defuddled.site,
      title: defuddled.title,
      wordCount: defuddled.wordCount
    };
    return response;
}