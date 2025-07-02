# AI Page Assistant

This browser extension helps you summarize and chat about the content of the current web page. It can also use video subtitles to understand video content on YouTube and Bilibili.

## Features

*   Summarize the content of any web page.
*   Chat with an AI about the page content.
*   Understands video content on YouTube and Bilibili by using their subtitles.
*   Securely handles cookies for accessing private content.

## Getting Started

### Prerequisites

*   Node.js and npm
*   Python 3.11+ and pip
*   `uv` for python venv

### Chrome Extension

To build and run the Chrome Extension:

1.  Install the dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Load the extension in your browser from the `.output` directory.

### Subtitle extract service

The Subtitle extract service is a FastAPI server that provides an API for extracting subtitles.

1.  Navigate to the `sub-service` directory:
    ```bash
    cd sub-service
    ```
2.  Install the Python dependencies:
    ```bash
    uv venv
    uv pip install -r requirements.txt
    ```
3.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```

## Architecture

### Chrome Extension

The Chrome Extension is built with:

*   **wxt:** A framework for building cross-browser extensions.
*   **Lit:** A simple library for building fast, lightweight web components.
*   **TypeScript:** For type-safe JavaScript.

The Chrome Extension code is located in the `entrypoints` and `components` directories.

### Subtitle extract service

The Subtitle extract service is a Python server built with:

*   **FastAPI:** A modern, fast (high-performance) web framework for building APIs with Python 3.11+ based on standard Python type hints.
*   **yt-dlp:** A command-line program to download videos from YouTube and other sites.

The Subtitle extract service code is located in the `sub-service` directory. It provides a single endpoint, `/subtitles`, for extracting subtitles from a given video URL.

## License

This project is licensed under the [MIT License](LICENSE).
