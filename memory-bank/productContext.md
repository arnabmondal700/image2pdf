# Product Context

## Why This Project Exists
Traditional PDF tools either require software installation or upload files to external servers. This project eliminates both friction points by:
1. Running entirely in the browser (no installation)
2. Processing everything on the client side (no uploads, complete privacy)

## Problems It Solves
- **Privacy concerns** — Users don't need to trust a third-party server with their documents
- **Installation barrier** — No software to download or install
- **Accessibility** — Works on any modern browser across desktop and mobile
- **Cost** — Completely free to use
- **Speed** — No network latency for file transfers

## User Experience Goals
- **Instant start** — Navigate to the URL and begin immediately
- **Intuitive flows** — Drag-and-drop file uploads, clear action buttons, progress indicators
- **Dark mode** — System-preference-aware theme with manual toggle
- **Offline capability** — PWA support for repeat usage without internet
- **Responsive** — Works seamlessly on desktop, tablet, and mobile
- **Real-time feedback** — Progress bars, status messages, cancellation support for long operations

## How It Works (High-Level)
1. User uploads files via drag-and-drop or file picker
2. Files are read into memory as data URLs (never uploaded)
3. User configures settings (page size, DPI, quality, etc.)
4. Heavy processing (PDF generation, OCR, compression) runs in Web Workers
5. Result is offered as a downloadable file or preview

## Current Feature Maturity
- **Stable & Production**: Image to PDF, PDF Merge, PDF Settings persistence
- **Functional**: PDF Split, PDF Rearrange, PDF Compress, PDF Protect, PDF to Image, Mixed PDF Builder, OCR features
- **Note**: All tools are implemented and working, with varying levels of test coverage
