export function getBody(): string {
    function nodeTraverse(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.nodeValue ? node.nodeValue : '';
        }

        let domString: string[] = [];
        if (node.nodeType === Node.ELEMENT_NODE) {
            const e = node as HTMLElement;
            if (['IFRAME', 'IMG', 'SCRIPT', 'STYLE'].includes(e.tagName)) {
                return '';
            }

            if (e.tagName === 'INPUT' && e.getAttribute('type') === 'password') {
                return '';
            }

            if (e.shadowRoot) {
                for (const child of e.shadowRoot.children) {
                    domString.push(nodeTraverse(child));
                }
            }

            if (e.children.length > 0) {
                domString.push(startTag(e));
                for (const child of e.children) {
                    domString.push(nodeTraverse(child));
                }
                domString.push(endTag(e));
            } else {
                domString.push(e.outerHTML);
            }
        }

        return domString.join();
    }

    // return <tag attribute=value> of the element
    function startTag(element: HTMLElement): string {
        const attributes = Array.from(element.attributes).map((attr) => `${attr.name}="${attr.value}"`).join(' ');
        const space = attributes ? ' ' : '';
        return `<${element.localName}${space}${attributes}>`;
    }

    // return </tag>
    function endTag(element: HTMLElement): string {
        return `</${element.localName}>`;
    }

    return nodeTraverse(document.body);
}

export function getEmailFromGmail(): string {
    const email = document.querySelector('div.adn.ads');
    return email ? email.outerHTML : '';
}