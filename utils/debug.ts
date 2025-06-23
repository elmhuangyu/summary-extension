import { storage } from "#imports";

let debugMode: boolean = false;

loadDebugModeFromStorage().then(enable => {
    debugMode = enable;
});

// watch if the value is changed.
storage.watch<boolean>('local:debugMode', (newValue, oldVale) => {
    if (newValue === true) {
        debugMode = true;
    } else {
        debugMode = false;
    }
});

async function loadDebugModeFromStorage(): Promise<boolean> {
    let debugModeValue = await storage.getItem<boolean>('local:debugMode');
    if (debugModeValue === true) {
        return true;
    }
    return false;
}

// Helper function for debug logging
export const debugLog = (filterName: string, ...args: any[]) => {
    if (debugMode) {
        console.log(`[${filterName}]`, ...args);
    }
};
