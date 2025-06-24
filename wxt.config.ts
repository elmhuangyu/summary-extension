import { defineConfig } from 'wxt';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/webextension-polyfill'],
    vite: () => ({
        plugins: [
            wasm(),
            topLevelAwait()
        ]
    }),
    manifest: {
        "manifest_version": 3,
        "name": "AI Page Assistant",
        "version": "0.1.0",
        "description": "Use AI to summarize and chat about the current web page.",
        "permissions": [
            "activeTab",
            "scripting",
            "sidePanel",
            "storage",
            "tabs",
        ],
    }
});
