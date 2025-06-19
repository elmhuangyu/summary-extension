async function r(...e){try{(await chrome.storage.local.get("debugMode")).debugMode&&console.log(...e)}catch(o){console.error("Error accessing debugMode setting:",o)}}export{r as d};
