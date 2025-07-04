import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/webextension-polyfill'],
    manifest: {
        "manifest_version": 3,
        "name": "AI Page Assistant",
        "version": "0.1.0",
        "description": "Use AI to summarize and chat about the current web page.",
        "host_permissions": [ "*://*/*" ],
        "permissions": [
            "activeTab",
            "cookies",
            "scripting",
            "sidePanel",
            "storage",
            "tabs",
        ],
    }
});
