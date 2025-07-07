# AI Page Assistant

This browser extension helps you summarize and chat about the content of the current web page. It also leverages video subtitles to understand video content on platforms like YouTube and Bilibili.

## Features

*   **Page Summarization:** Quickly summarize the content of any web page.
*   **AI Chat:** Engage in conversations with an AI about the page content.
*   **Video Content Understanding:** Utilizes subtitles to comprehend video content on YouTube and Bilibili.
*   **Secure Cookie Handling:** Securely manages cookies to access private or authenticated content.

## Usage

### Install the extension

[Chrome Web Store](https://chromewebstore.google.com/detail/AI%20Page%20Assistant/ebfopfeijndiagimbbaoajjknahobnjp)

### Subtitle Extraction Service (Optional)

his service is optional and is only required if you wish to summarize video content from YouTube or Bilibili. Users need to deploy this service independently.

```bash
docker run --rm -p 8000:8000 ghcr.io/elmhuangyu/summary-extension/sub-service:main
```

## Development

### Prerequisites

*   Node.js and npm
*   Python 3.13+
*   `uv` for Python virtual environment management

### Chrome Extension

To build and run the Chrome Extension:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
3.  **Load Extension:** Load the extension in your browser from the `.output` directory.

### Subtitle Extraction Service

The Subtitle Extraction Service is a FastAPI server that provides an API for extracting video subtitles.

1.  Navigate to the `sub-service` directory:
    ```bash
    cd sub-service
    ```
2.  Install the Python dependencies:
    ```bash
    uv sync
    ```
3.  Run the server:
    ```bash
    uv run fastapi dev
    ```

## Architecture

### Chrome Extension

The Chrome Extension is built using:

*   **wxt:** A framework for building cross-browser extensions.
*   **Lit:** A simple library for building fast, lightweight web components.
*   **TypeScript:** For type-safe JavaScript development.

The Chrome Extension's source code is located in the `entrypoints` and `components` directories.

### Subtitle Extraction Service

The Subtitle Extraction Service is a Python server built with:

*   **FastAPI:** A modern, fast (high-performance) web framework for building APIs with Python 3.11+ based on standard Python type hints.
*   **yt-dlp:** A Python library used for downloading video subtitles.

The Subtitle Extraction Service's code is located in the `sub-service` directory. It exposes a single endpoint, `/subtitles`, for extracting subtitles from a given video URL.

## License

This project is licensed under the [Apache 2.0 License](LICENSE).
