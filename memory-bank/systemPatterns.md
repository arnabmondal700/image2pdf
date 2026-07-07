# System Patterns

## Architecture Overview
The application follows a **tool-based architecture** with Angular 21 standalone components:

```
App Shell (App Component)
├── AppHeader (navigation)
├── OfflineBanner
├── UpdateNotification
├── ImageEditorModal
└── RouterOutlet
    └── Lazy-loaded Tool Components (10 tools)
        ├── Shared Components
        │   ├── DragDropZone
        │   ├── FileList
        │   ├── FileItem
        │   ├── PdfSettingsPanel
        │   ├── PdfPreview
        │   ├── GeneratePdfButton
        │   └── SeoContent
        ├── Services (per-tool or shared)
        └── Web Workers (heavy processing)
```

## Design Patterns

### 1. Tool-Based Routing
- Each PDF tool is a **lazy-loaded standalone component** accessible via its own route
- Route data includes SEO metadata (title, description, keywords, Open Graph, Twitter Card)
- Tools share common components (drag-drop zone, file list, settings panel, preview)

### 2. Service Layer Architecture
- **FileService** — File validation, data URL conversion, drag-and-drop reordering
- **PDFService** — Main PDF generation (coordinates jsPDF, Web Workers, protection)
- **PdfWorkerService** — Web Worker lifecycle management (spawn, message, progress, terminate)
- **ImageOptimizerService** — Image compression before PDF embedding
- **ThemeService** — Light/dark/system theme with localStorage persistence
- **SeoService** — Dynamic meta tag updates on route changes
- **IndexedDbService (Dexie)** — Local persistence for settings and sessions
- **OcrService** — Tesseract.js OCR with Web Worker and fallback
- **ExportService** — DOCX/TXT export for OCR results

### 3. Web Worker Pattern
All heavy processing uses Web Workers to keep the UI responsive:
```
Component → Service → PdfWorkerService → Web Worker → Progress updates → Component
```
- Workers are created via `new Worker(new URL(...), { type: 'module' })`
- Progress messages flow back via `postMessage` with `{ type: 'progress' | 'complete' | 'error' }`
- Cancellation supported via `worker.terminate()` + Promise rejection
- Fallback to main-thread processing when Workers are unavailable

### 4. State Management (Signals vs RxJS)
- **Angular Signals** for local component state and simple services (ThemeService)
- **RxJS BehaviorSubject** for progress streams and worker communication
- Rationale: Signals for synchronous reactive state; RxJS for async streams that need Observable interop

### 5. SEO Strategy
- Each route carries SEO metadata in its `data` property
- `SeoService` updates `<title>`, `<meta>` tags on navigation
- Server-side rendering (SSR) for initial SEO content via Angular SSR
- Static `robots.txt` and `sitemap.xml` in `/public`

### 6. PWA Strategy
- Service Worker via `@angular/service-worker` (ngsw-config.json)
- Offline banner component for connectivity detection
- Update notification for new version prompts
- Manifest for install prompts

### 7. Persistence Strategy
- **IndexedDB (Dexie)** — PDF settings per tool, session files, workspace sessions
- **localStorage** — Theme preference
- **Session Storage** — Temporary file references during session

### 8. Pure Utility Functions
- Layout engine (`pdf-layout-engine.ts`) is pure TypeScript with zero Angular dependencies
- All page dimension calculations, margin sanitization, image positioning logic is independently testable

## Component Communication
- **Input bindings** for parent → child data flow
- **Output events** for child → parent communication
- **Services** for cross-component shared state
- **Router** for tool navigation and route-level data
- **ImageEditorStateService** for modal state management (image editing across tools)
